import express from "express";
import compression from "compression";
import { Document as MongooseDocument } from "mongoose";
import dotenv from "dotenv";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import cors from "cors";

import AppError from "./utils/appError";

import { apiLimiter } from "./middlewares/rate-limitter.middleware";
import { xssSanitizer } from "./middlewares/xss.middleware";

import { globalErrorHandler } from "./controllers/error.controller";

import tourRouter from "./routes/tours.routes";
import userRouter from "./routes/users.routes";
import authRouter from "./routes/auth.routes";
import reviewRouter from "./routes/reviews.routes";
import bookingRoute from "./routes/booking.routes";

import { ITourDocument } from "./models/tour.model";
import { SoftDeletetion } from "./models/plugins/softDelete.plugin";

dotenv.config();

declare global {
  namespace Express {
    interface Request {
      requestTime?: string;
      tour?: ITourDocument;
      doc: MongooseDocument & SoftDeletetion;
    }

    interface Query {
      startProcessingTime?: number;
    }
  }
}

const app = express();

// Recreate __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// IMPLEMENT CORS: this add Access-Control-Allow-Origin to * to allow consuming the API from anywhere
app.use(cors());
app.options("/*splat", cors());

// MIDDLEWARES
app.set("trust proxy", 1); //allow 1 proxy for railway deployment
app.use("/api", apiLimiter); // limit requests from same IP
app.use(helmet()); // set security HTTP headers
app.use(express.json()); // body parser

/**
 * Data sanitization against NoSQL query injection
 * Returns middleware function that strips out keys that start with $ and contain . req.body, req.query, and req.param
 */
app.use((req, res, next) => {
  req.body = mongoSanitize.sanitize(req.body);
  next();
});

/**
 * Data sanitization against XSS
 * Returns middleware function that sanitizes user input to prevent cross-site scripting (XSS) attacks
 */
app.use(xssSanitizer);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // logger
}

// compression() returns middleware function that's going to compress all responses text sent to the client
app.use(compression());

app.use(express.static(path.join(__dirname, "..", "public"))); // Serve static files  from the 'public' directory

// query parser: this makes express use qs library under the hood to support nested query strings
app.set("query parser", "extended");

// ROUTES
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRoute);

// Handles invalid routes
app.use((req, res, next) => {
  // passing param to the next function makes express ignores all queueing middlewares
  //  and run the global error handler
  next(new AppError(`Route ${req.originalUrl} not found!`, 404));
});

// Global error handler middleware
app.use(globalErrorHandler);

export default app;

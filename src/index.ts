import dotenv from "dotenv";

import app from "./app";
import connectDB from "./configs/db";
import { Server } from "http";
import mongoose from "mongoose";

dotenv.config();

// UNCAUGHT EXCEPTION
process.on("uncaughtException", (error: any) => {
  console.log("Error : ", error.name, error.message);
  process.exit(1);
});

// SERVER
const port = process.env.PORT || 3001;
let server: Server | undefined;

connectDB()
  .then(() => {
    server = app.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.log("DB connection failed : ", err);
    process.exit(1);
  });

// UNHANDLED PROMISE REJECTION
process.on("unhandledRejection", (error: any) => {
  console.log("Error : ", error.name, error.message);
  process.exit(1);
});

// this to politely terminate the process when OS asks to, by processing in-flight requests and exit
process.on("SIGTERM", () => {
  console.log("SIGTERM RECEIVED, shutting down gracefully!");

  if (!server) process.exit(0);

  server.close(async () => {
    await mongoose.connection.close();
    console.log("PROCESS TERMINATED!");
    process.exit(0);
  });
});

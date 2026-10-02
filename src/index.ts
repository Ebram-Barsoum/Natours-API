import dotenv from "dotenv";

import app from "./app";
import connectDB from "./configs/db";

dotenv.config();

// UNCAUGHT EXCEPTION
process.on("uncaughtException", (error: any) => {
  console.log("Error : ", error.name, error.message);
  process.exit(1);
});

// SERVER
const port = process.env.PORT || 3001;

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });
});

// UNHANDLED PROMISE REJECTION
process.on("unhandledRejection", (error: any) => {
  console.log("Error : ", error.name, error.message);
  process.exit(1);
});

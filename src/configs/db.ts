import mongoose from "mongoose";

export default async function connectDB() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("MONGO_URI is not defined");
    }

    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Database connected");
  } catch (error: any) {
    console.log(error.name, error.message);
    process.exit(1); // 1 means exit with failure
  }
}

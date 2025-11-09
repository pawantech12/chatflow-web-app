import mongoose from "mongoose";

async function connectDB(mongoUri) {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connection successfull to database");
  } catch (error) {
    console.error("Database connection unsuccessfull", error);
  }
}

export default connectDB;

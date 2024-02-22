import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import customerRoute from "./routes/cutomer.js";
import AppError from "./utils/appError.js";
import globalErrorHandling from "./controllers/error.js";

dotenv.config({ path: "./config.env" });
const app = express();
const port = process.env.PORT || 5000;

// uncaughtException
process.on("uncaughtException", (err) => {
  console.log("UNHANDLED Exception! Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

// unhandled Rejection
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.log(err);
  console.log(err.name, err.message);
  process.exit(1);
});

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

// Database

mongoose
  .connect(process.env.MONGO_DATABASE)
  .then(() => {
    console.log("Mongoose Connected Successfully");
  })
  .catch((err) => {
    console.log(err.message);
  });

// Middleware

app.use("/api/v1/customerRoute", customerRoute);

app.get("/", (req, res) => {
  res.send("Hello india");
});
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.url} on this server`, 401));
});

app.use(globalErrorHandling);

app.listen(port, () => {
  console.log(`Server Listing on ${port}`);
});

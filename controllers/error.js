import AppError from "../utils/appError.js";

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}.Please use another value`;
  return new AppError(message, 400);
};

const handleJWTError = (err) => {
  const message = "invalid user token signature";
  return new AppError(message, 400);
};
const handleJWTExpire = (err) => {
  const message = "your token have expire! Please login again.";
  return new AppError(message, 400);
};
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid inpatch data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // operational trusted error send to the client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // Programing or other unknow error:don't leak error details
  } else {
    console.log("Error: ", err);
    return res.status(500).json({
      status: "error",
      message: "Something went very wrong",
    });
  }
};

export default (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = err;
    if (error.name === "CastError") {
      error = handleCastErrorDB(error);
    } else if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    } else if (error.name === "JsonWebTokenError") {
      error = handleJWTError(error);
    } else if (error.name === "TokenExpiredError") {
      error = handleJWTExpire(error);
    } else if (error.name === "ValidationError") {
      error = handleValidationError(error);
    }
    sendErrorProd(error, res);
  }
};

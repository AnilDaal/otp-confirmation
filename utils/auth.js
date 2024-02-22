import jwt from "jsonwebtoken";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { promisify } from "util";
import Customer from "../models/customer.js";

const authUser = catchAsync(async (req, res, next) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer") ||
    !req.headers.authorization.split(" ")[1]
  ) {
    return next(
      new AppError(
        "token not found or token not start with Bearer or token is null",
        401
      )
    );
  }
  const token = req.headers.authorization.split(" ")[1];
  if (token) {
    let tokenData = await promisify(jwt.verify)(token, process.env.SECRET_KEY);
    console.log(tokenData);
    let freshData;
    if (tokenData.varified === true) {
      freshData = await Customer.findById(tokenData.id);
      if (!freshData) {
        return next(
          new AppError(
            `The customer belong to this token does no longer exist`,
            401
          )
        );
      }
    } else {
      return next(new AppError(`email not varified`, 401));
    }

    // if admin update password
    if (await freshData.changePassword(tokenData.iat)) {
      return next(new AppError(`customer recently changed password`, 401));
    }
    req.user = freshData;
  }
  next();
});

export { authUser };

import Customer from "../models/customer.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import sendEmail from "../utils/email.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const customerSignup = catchAsync(async (req, res, next) => {
  const { email, password, name, confirmPassword } = req.body;
  if (!email || !password || !name || !confirmPassword) {
    return next(new AppError("Please Enter All field", 401));
  }
  const customerData = await Customer.create({
    email,
    password,
    name,
    confirmPassword,
  });

  let resetToken = Math.floor(Math.random() * 1000000);
  customerData.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken.toString())
    .digest("hex");
  customerData.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  // validateBeforeSave: flase
  await customerData.save({ validateBeforeSave: false });
  // 3) Send email
  // const resetURL = `${req.protocol}://${req.get("host")}/api/v1/${
  //   customerData.roles
  // }/resetPassword/${resetToken}`;
  const message = `Please confirm your Code ${resetToken}`;
  try {
    const options = {
      email: customerData.email,
      subject: "Motion Animation",
      message,
    };
    await sendEmail(options);
  } catch (error) {
    customerData.passwordResetToken = undefined;
    customerData.passwordResetExpires = undefined;
    await customerData.save({ validateBeforeSave: false });
    return next(
      new AppError(
        "There was an error sending the email. Try again later! or Use .io domain in gmail",
        500
      )
    );
  }

  const token = jwt.sign(
    { id: customerData._id, role: customerData.roles, varified: false },
    process.env.SECRET_KEY,
    {
      expiresIn: "7d",
    }
  );
  res.status(200).json({
    status: "success",
    token,
  });
});

const cutomerLogin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("Please enter email and password", 401));
  }
  const customerData = await Customer.findOne({ email }).select("+password");
  if (
    !customerData ||
    !customerData.correctPassword(password, customerData.password)
  ) {
    return next(new AppError("email or password not match", 401));
  }

  let resetToken = Math.floor(Math.random() * 1000000);
  customerData.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken.toString())
    .digest("hex");
  customerData.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  // validateBeforeSave: flase
  await customerData.save({ validateBeforeSave: false });
  // 3) Send email
  // const resetURL = `${req.protocol}://${req.get("host")}/api/v1/${
  //   customerData.roles
  // }/resetPassword/${resetToken}`;
  const message = `Please confirm your Code ${resetToken}`;
  try {
    const options = {
      email: customerData.email,
      subject: "Motion Animation",
      message,
    };
    await sendEmail(options);
  } catch (error) {
    customerData.passwordResetToken = undefined;
    customerData.passwordResetExpires = undefined;
    await customerData.save({ validateBeforeSave: false });
    return next(
      new AppError(
        "There was an error sending the email. Try again later! or Use .io domain in gmail",
        500
      )
    );
  }

  const token = jwt.sign(
    { id: customerData._id, role: customerData.roles, varified: false },
    process.env.SECRET_KEY,
    {
      expiresIn: "7d",
    }
  );
  res.status(200).json({
    status: "success",
    token,
  });
});

const confirmToken = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const { resetToken } = req.body;
  if (!resetToken) {
    return next(new AppError("Please enter your reset token", 401));
  }
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  // 2) check user existed or not and token is not expire
  const customerData = await Customer.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!customerData) {
    return next(new AppError("Token was expire or invalid", 404));
  }
  // 4) Signin user
  const token = jwt.sign(
    { id: customerData._id, role: customerData.roles, varified: true },
    process.env.SECRET_KEY,
    {
      expiresIn: "7d",
    }
  );
  res.status(201).json({
    status: "success",
    token,
  });
});

export { customerSignup, cutomerLogin, confirmToken };

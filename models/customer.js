import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import crypto from "crypto";

const customerSchema = mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    validator: [validator.isEmail, "Enter correct email"],
    // unique: [true, "Email must be unique"],
    required: [true],
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "Please Enter Password"],
    minlength: [6, "password must have more than 6 character"],
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (value) {
        return value == this.password;
      },
      message: "Password not match",
    },
    minlength: [6, "pussword must be more than 6 character"],
  },
  passwordChangeAt: { type: Date },
  passwordResetToken: String,
  passwordResetExpires: Date,
  isVerified: { type: Boolean, default: false },
});

customerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  this.confirmPassword = undefined;
  next();
});

customerSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) {
    return next();
  }
  this.passwordChangeAt = Date.now() - 1000;
  next();
});

customerSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

customerSchema.methods.changePassword = async function (timeStamp) {
  if (this.passwordChangeAt) {
    const time = parseInt(this.passwordChangeAt.getTime() / 1000, 10);
    return time > timeStamp;
  }
  return false;
};

// customerSchema.methods.createPasswordResetToken = function () {
//   const resetToken = crypto.randomBytes(32).toString("hex");
//   console.log(resetToken);
//   this.passwordResetToken = crypto
//     .createHash("sha256")
//     .update(resetToken)
//     .digest("hex");
//   this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
//   return resetToken;
// };

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;

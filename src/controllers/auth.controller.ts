import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { Response, CookieOptions } from "express";

import User, { IUser } from "../models/user.model";
import catchAsyncError from "../utils/catchAsyncError";
import AppError from "../utils/appError";
import sendEmail from "../utils/sendEmail";

const generateAccessToken = (id: string) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not defined");

  return jwt.sign(
    { id },
    process.env.JWT_SECRET as string,
    {
      expiresIn: process.env.JWT_EXPIRES_IN as string,
    } as jwt.SignOptions,
  );
};

const createSendToken = (
  res: Response,
  statusCode: number,
  message: string,
  user: IUser,
) => {
  const token = generateAccessToken(String(user._id));

  const cookieExpiryDays = Number(process.env.JWT_COOKIE_EXPIRES_IN);
  if (isNaN(cookieExpiryDays))
    throw new Error("JWT_COOKIE_EXPIRES_IN is not defined");

  const cookieOptions: CookieOptions = {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    expires: new Date(Date.now() + cookieExpiryDays * 24 * 60 * 60 * 1000),
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };

  res.cookie("accessToken", token, cookieOptions);

  const json = user.toJSON();

  res.status(statusCode).json({
    status: "success",
    message,
    token,
    data: {
      user: {
        id: user.id,
        name: json.name,
        email: json.email,
        imageUrl: json.imageUrl, // transformed, with BASE_URL and path
        role: json.role,
        createdAt: json.createdAt,
        updatedAt: json.updatedAt,
      },
    },
  });
};

const signup = catchAsyncError(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    imageUrl: req.body.imageUrl,
  });

  const message = "User created successfully!";

  createSendToken(res, 201, message, newUser);
});

const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  // 1)- Check if email and password exist
  if (!email || !password)
    return next(new AppError("Email and password are required", 400));

  //2)- Check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password");
  const isCorrectPassword = user
    ? await user.verifyPassword(password, user.password)
    : false;

  if (!user || !isCorrectPassword)
    return next(new AppError("Incorrect email or password", 401));

  //3)- If everything ok, send token to client
  const message = "User logged in successfully!";
  createSendToken(res, 200, message, user);
});

const forgotPassword = catchAsyncError(async (req, res, next) => {
  // 1)- Find a user based on received email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("There is no user with this email!", 404));
  }

  // 2)- Generate random token
  const resetToken = user.createPasswordResetToken();
  await user.save();

  // 3)- Send token to user email
  const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/auth/reset-password/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetUrl}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 min)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to your email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        500,
      ),
    );
  }
});

const resetPassword = catchAsyncError(async (req, res, next) => {
  // 1)- Get user based on reset token and validate the token
  const { resetToken } = req.params;
  const hashedResetToken = crypto
    .createHash("sha256")
    .update(resetToken as string)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedResetToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(new AppError("Token is invalid or has expired", 400));

  // 2)- Check if new password exists
  const newPassword = req.body.newPassword;

  if (!newPassword) return next(new AppError("New password is required", 400));

  // 3)- Update password and passwordChangedAt property
  user.password = newPassword;
  user.passwordChangedAt = new Date();
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // we use save instead of updateOne because we need to run validators and middleware
  await user.save();

  // 4)- Log user in and send JWT
  const message = "Password reset successfully!";
  createSendToken(res, 200, message, user);
});

const updatePassword = catchAsyncError(async (req, res, next) => {
  // 1)- Get user from collection
  const user = await User.findById(req.user._id).select("+password");

  if (!user) return next(new AppError("There is no user with this ID", 404));

  // 2)- Validate the current password
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword)
    return next(
      new AppError("Old password and new password are required", 400),
    );

  const isOldPasswordCorrect = await user?.verifyPassword(
    oldPassword,
    user.password,
  );

  if (!isOldPasswordCorrect)
    return next(new AppError("Old password is incorrect", 401));

  // 3)- Update password and passwordChangedAt property
  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();

  // 4)- Log user in and send JWT
  const message = "Password updated successfully!";
  createSendToken(res, 200, message, user);
});

export { signup, login, forgotPassword, resetPassword, updatePassword };

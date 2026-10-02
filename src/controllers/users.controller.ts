import { Request, Response } from "express";
import catchAsyncError from "../utils/catchAsyncError";
import User from "../models/user.model";
import APIFeatures from "../utils/apiFeatures";

const getAllUsers = catchAsyncError(async (req: Request, res: Response) => {
  const features = new APIFeatures(User.find(), req.query);

  const filters = ["role"];

  const [users, count] = await Promise.all([
    features.filter(filters).search(["name"]).paginate().executeQuery(),
    features.getDocumentsCount(),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      users,
      count,
    },
  });
});

const getMe = (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    data: {
      user: req.user,
    },
  });
};

const updateMe = catchAsyncError(async (req: Request, res: Response) => {
  const userId = req.user._id;

  let newData = { ...req.body };

  if (req.file) {
    newData = { ...newData, imageUrl: req.file.filename };
  }

  const user = await User.findByIdAndUpdate(userId, newData, {
    new: true, // to return the updated document
    runValidators: true, // to validate the updated document
  });

  res.status(200).json({
    status: "success",
    message: "User updated successfully!",
    data: {
      user,
    },
  });
});

const deleteMe = catchAsyncError(async (req: Request, res: Response) => {
  await req.user.softDelete();

  res.status(204).json({
    status: "success",
    message: "User deleted successfully!",
    data: null,
  });
});

export { getAllUsers, updateMe, deleteMe, getMe };

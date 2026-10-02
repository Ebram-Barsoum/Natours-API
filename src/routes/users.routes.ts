import express from "express";

import {
  getAllUsers,
  updateMe,
  deleteMe,
  getMe,
} from "../controllers/users.controller";
import { getUserBookings } from "../controllers/booking.controller";

import { protect, restrictTo } from "../middlewares/auth.middleware";
import {
  validateMongoDBId,
  validateRequestBody,
} from "../middlewares/validation.middlewares";

import { updateMeSchema } from "../schemas/users.schema";
import {
  resizeUserImage,
  uploadUserImage,
} from "../middlewares/users.middleware";

const userRouter = express.Router();

userRouter.use(protect);

userRouter.get("/me", getMe);
userRouter.patch(
  "/update-me",
  validateRequestBody(updateMeSchema),
  uploadUserImage,
  resizeUserImage,
  updateMe,
);
userRouter.delete("/delete-me", deleteMe);

userRouter.use(restrictTo("admin"));

userRouter.get("/", getAllUsers);

userRouter.get(
  "/:userId/bookings",
  validateMongoDBId("userId"),
  getUserBookings,
);

export default userRouter;

import express from "express";
import { protect, restrictTo } from "../middlewares/auth.middleware";
import {
  deleteBooking,
  getAllBookings,
  getCheckoutSession,
  getMyBookings,
  updateBooking,
} from "../controllers/booking.controller";
import {
  validateDocumentExistence,
  validateMongoDBId,
} from "../middlewares/validation.middlewares";
import Booking, { IBooking } from "../models/booking.model";

const bookingRoute = express.Router();
bookingRoute.use(protect);

bookingRoute.post("/checkout-session/:tourId", getCheckoutSession);
bookingRoute.get("/mine", getMyBookings);

bookingRoute.use(restrictTo("admin", "lead-guide"));

bookingRoute.get("/", getAllBookings);

bookingRoute.patch(
  "/:bookingId",
  validateMongoDBId("bookingId"),
  validateDocumentExistence<IBooking>(Booking, "bookingId"),
  updateBooking,
);

bookingRoute.delete(
  "/:bookingId",
  validateMongoDBId("bookingId"),
  validateDocumentExistence<IBooking>(Booking, "bookingId"),
  deleteBooking,
);

export default bookingRoute;

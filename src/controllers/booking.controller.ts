import { Request, Response, NextFunction } from "express";

import Tour from "../models/tour.model";

import catchAsyncError from "../utils/catchAsyncError";
import AppError from "../utils/appError";
import { createOneTimeCheckoutSession } from "../services/stripe.service";
import Booking from "../models/booking.model";
import APIFeatures from "../utils/apiFeatures";

const getCheckoutSession = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1)- Get the currently booked tour
    const { tourId } = req.params;
    const tour = await Tour.findById(tourId);

    if (!tour) {
      return next(new AppError("Tour not found", 400));
    }

    // 2)- Create checkout session
    const checkoutSession = await createOneTimeCheckoutSession(req, tour);

    // 3)- Return a response
    res.status(200).json({
      status: "success",
      session: checkoutSession,
    });
  },
);

const createBookingCheckout = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {},
); // TODO: using webhooks

const getMyBookings = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;

    const bookings = await Booking.find({ user: userId });

    res.status(200).json({
      status: "success",
      data: {
        bookings,
      },
    });
  },
);

const getAllBookings = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const feature = new APIFeatures(Booking.find(), req.query);

    const bookings = await feature.sort().paginate().executeQuery();

    res.status(200).json({
      status: "success",
      data: {
        bookings,
      },
    });
  },
); // for Admin and lead-guide

const getUserBookings = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    if (!userId) {
      return next(new AppError("UserId is missing!", 400));
    }

    const bookings = await Booking.find({ user: userId });

    res.status(200).json({
      status: "success",
      data: {
        bookings,
      },
    });
  },
); // for Admin and lead-guide

const createBooking = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {},
); // TODO: for Admin and lead-guide

const updateBooking = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const currentBooking = req.doc;
    Object.assign(currentBooking, req.body);

    const updatedBooking = await currentBooking.save();

    res.status(201).json({
      status: "success",
      message: "Booking updated successfully!",
      data: {
        booking: updatedBooking,
      },
    });
  },
); // for Admin and lead-guide

const deleteBooking = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    await req.doc.softDelete();

    res.status(204).json({
      status: "success",
      message: "Booking deleted successfully!",
      data: null,
    });
  },
); // for Admin and lead-guide

export {
  getCheckoutSession,
  createBookingCheckout,
  getUserBookings,
  getMyBookings,
  getAllBookings,
  createBooking,
  updateBooking,
  deleteBooking,
};

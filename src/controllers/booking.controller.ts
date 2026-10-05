import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";

import Tour from "../models/tour.model";
import User from "../models/user.model";
import Booking from "../models/booking.model";

import catchAsyncError from "../utils/catchAsyncError";
import AppError from "../utils/appError";
import { createOneTimeCheckoutSession } from "../services/stripe.service";
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

const createCheckoutBooking = async (
  session: Stripe.CheckoutSessionCompletedEvent.Data,
) => {
  // this 'object' is a mirror to the returned object from create checkout session handler
  const { object } = session;
  const tour = object.client_reference_id;
  const user = (await User.findOne({ email: object.customer_email }))?.id;
  const price = (object.amount_total ?? 0) / 100;

  if (!object.client_reference_id)
    throw new Error("client_reference_id is missing!");

  await Booking.create({ tour, user, price });
};

const checkoutWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  //1)- extract stripe signature from the header: when stripe calls the webhook it adds that signature to the header
  const signature: string | string[] = req.headers["stripe-signature"] ?? "";

  // 2)- Construct event
  let event: Stripe.Event;
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("Stripe webhook secret is missing!");
    }

    event = Stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    return res.status(400).json((error as Error).message);
  }

  // 3)- Create booking on target event
  if (event && event.type === "checkout.session.completed") {
    await createCheckoutBooking(event.data);
  }

  //4)- send success response to stripe
  res.status(200).json({ received: true });
};

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
  checkoutWebhook,
  getUserBookings,
  getMyBookings,
  getAllBookings,
  updateBooking,
  deleteBooking,
};

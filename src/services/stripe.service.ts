import { Request } from "express";
import Stripe from "stripe";
import { ITour } from "../models/tour.model";
import { HydratedDocument } from "mongoose";

const createOneTimeCheckoutSession = async (
  req: Request,
  tour: HydratedDocument<ITour>, // to make the type include virtual properties
): Promise<Stripe.Checkout.Session> => {
  const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
  });

  return stripeClient.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    success_url: `${req.protocol}://${req.get("host")}/my-tours`,
    cancel_url: `${req.protocol}://${req.get("host")}/tours/${tour.slug}`,
    client_reference_id: tour.id,
    customer_email: req.user.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: tour.price * 100, // amount expected to be in cents so we need to multiply it by 100
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [
              `${process.env.BASE_URL}/uploads/tours/${tour.imageCover}`,
            ],
          },
        },
        quantity: 1,
      },
    ],
  });
};

export { createOneTimeCheckoutSession };

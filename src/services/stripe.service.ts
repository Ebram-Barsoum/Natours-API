import { Request } from "express";
import Stripe from "stripe";
import { ITour } from "../models/tour.model";

const createOneTimeCheckoutSession = async (
  req: Request,
  tour: ITour,
): Promise<Stripe.Checkout.Session> => {
  const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
  });

  return stripeClient.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    success_url: `${req.protocol}://${req.get("host")}/my-tours`,
    cancel_url: `${req.protocol}://${req.get("host")}/tours/${tour.slug}`,
    customer_email: req.user.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: tour.price * 100, // amount expected to be in cents so we need to multiply it by 100
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://natours.dev/img/tours/${tour.imageCover}`], // TODO: change this to our hosted API, it should only contain hosted images
          },
        },
        quantity: 1,
      },
    ],
  });
};

export { createOneTimeCheckoutSession };

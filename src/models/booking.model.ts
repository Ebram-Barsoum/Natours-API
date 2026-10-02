import mongoose, { InferSchemaType, HydratedDocument } from "mongoose";
import castMonogoID from "../utils/castMongoID";
import softDeletePlugin from "./plugins/softDelete.plugin";

const bookingSchema = new mongoose.Schema(
  {
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Booking must belong to a tour!"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Booking must be associated to a specific user!"],
    },
    price: {
      type: Number,
      required: [true, "Booking must have a price!"],
    },
    isPaid: {
      // this for future manual payment
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: castMonogoID,
    },
    toObject: { virtuals: true },
  },
);

// DOCUMENT middleware that doing left join to return user and tour data.
bookingSchema.pre(/^find/, function (next) {
  this.populate({
    path: "tour",
    select: "id, name, summary, imageCover, price",
  }).populate("user");

  next();
});

export type IBooking = InferSchemaType<typeof bookingSchema>;
export type IBookingDocument = HydratedDocument<IBooking>;

bookingSchema.plugin(softDeletePlugin<IBooking>);
const Booking = mongoose.model<IBooking>("Booking", bookingSchema);

export default Booking;

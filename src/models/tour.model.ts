import mongoose, { HydratedDocument, InferSchemaType, Query } from "mongoose";
import slugify from "slugify";
import castMonogoID from "../utils/castMongoID";
import softDeletePlugin, { SoftDeletetion } from "./plugins/softDelete.plugin";

interface CustomQuery extends Query<any, any> {
  startProcessingTime?: number;
}

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: (v: number[]) => v.length === 2,
        message: "Coordinates must be [longitude, latitude]",
      },
    },
    address: String,
    description: String,
  },
  { _id: false },
);

const locationSchema = new mongoose.Schema({
  type: { type: String, enum: ["Point"], default: "Point" },
  coordinates: [Number],
  address: String,
  description: String,
  day: Number,
});

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: true,
      required: [true, "A tour must have a name"],
      maxlength: [40, "A tour name must have less or equal than 40 characters"],
      minlength: [10, "A tour name must have more or equal than 10 characters"],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either easy, medium or difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (value: number) => {
        return Math.round(value * 10) / 10; // 4.666666, 46.6666, 47, 4.7
      },
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      default: 0,
      validate: {
        validator: function (val: number): boolean {
          // 'this' refers to the currently processed document on NEW document and not on UPDATE document
          return val < this.price;
        },
        message: "Discount ({VALUE}) must be less than the price",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a summary"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      validate: {
        validator: function (this: any, value: string) {
          return this.status !== "published" || !!value;
        },
        message: "A tour must have a cover image",
      },
    },
    images: [String],
    startDates: [Date],
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    startLocation: {
      type: pointSchema,
      default: undefined,
    },
    locations: [locationSchema],
    guides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ], // child reference
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: Record<string, unknown>) => {
        if (ret.imageCover) {
          ret.imageCover = `${process.env.BASE_URL}/uploads/tours/${ret.imageCover}`;
        }

        if ((ret.images as []).length > 0) {
          ret.images = (ret.images as []).map(
            (img: string) =>
              (img = `${process.env.BASE_URL}/uploads/tours/${img}`),
          );
        }

        castMonogoID(_doc, ret);
      },
    },
    toObject: {
      virtuals: true,
    },
  },
);

tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" });

// Virtual property that is not stored in DB and derived from other fields
tourSchema.virtual("durationWeeks").get(function () {
  return +(this.duration / 7).toFixed(1);
});

// Virtual populate: to include the reviews in the tour document
// as a virtual field because tour doesn't know about it's reviews
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tourId",
  localField: "_id",
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre("save", function (next) {
  // 'this' refers to the currently processed document
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre("validate", function (next) {
  if (this.status !== "published") return next();

  const missing: string[] = [];
  if (!this.description) missing.push("description");
  if (!this.imageCover) missing.push("imageCover");
  if (!this.startDates?.length) missing.push("startDates");
  if (!this.startLocation) missing.push("startLocation");
  if (!this.locations?.length) missing.push("locations");

  if (missing.length) {
    this.invalidate("status", `Cannot publish. Missing: ${missing.join(", ")}`);
  }
  next();
});

// DOCUMENT MIDDLEWARE: this is how we embedded documents
// tourSchema.pre('save', async function (next) {
//     const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//     this.guides = await Promise.all(guidesPromises) as any;

//     next();
// });

// QUERY MIDDLEWARE: runs before any find query
tourSchema.pre(/^find/, function (this: CustomQuery, next) {
  // 'this' refers to the currently processed query
  // this.find({ status: { $ne: "draft" } });

  this.startProcessingTime = Date.now();
  next();
});

// tourSchema.post(/^find/, function (this: CustomQuery, docs, next) {
//     // 'this' refers to the currently processed query

//     console.log('Query time : ', Date.now() - (this.startProcessingTime || 0), 'ms');
//     next();
// });

// AGGRAGATION MIDDLEWARE
tourSchema.pre("aggregate", function (next) {
  // 'this' refers to the currently processed aggragation object

  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  // console.log("Aggrgation pipeline : ", this.pipeline());

  next();
});

export type ITour = InferSchemaType<typeof tourSchema>;
export type ITourDocument = HydratedDocument<ITour, SoftDeletetion>;

tourSchema.plugin(softDeletePlugin<ITour>);

const Tour = mongoose.model<ITour>("Tour", tourSchema);
export default Tour;

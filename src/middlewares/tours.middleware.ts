import { NextFunction, Request, Response } from "express";
import sharp from "sharp";

import { getFileUploader } from "../configs/multer";
import catchAsyncError from "../utils/catchAsyncError";
import { ObjectSchema } from "joi";

const uploadTourImages = getFileUploader({
  type: "mix",
  mixConfig: [
    { name: "imageCover", maxCount: 1 },
    { name: "images", maxCount: 3 },
  ],
  supportedFiles: ["image"],
  maxFileSizeInMB: 5,
  destination: "public/uploads/tours",
  storageType: "memory",
});

const resizeTourImages = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // check if there is not a file
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (!files.imageCover?.[0] && !files?.images) return next();

    // 1) Process imageCover
    if (files.imageCover?.[0]) {
      req.body.imageCover = `tour-${req.params.tourId ?? ""}-${Date.now()}-cover-image.jpeg`;

      await sharp(files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/uploads/tours/${req.body.imageCover}`);
    }

    // 2) Process images array
    if (files.images?.length) {
      req.body.images = [];
      await Promise.all(
        files.images.map(async (image, index) => {
          const filename = `tour-${req.params.tourId ?? ""}-${Date.now()}-image-${index + 1}.jpeg`;
          await sharp(image.buffer)
            .resize(2000, 1333)
            .toFormat("jpeg")
            .jpeg({ quality: 90 })
            .toFile(`public/uploads/tours/${filename}`);
          req.body.images.push(filename);
        }),
      );
    }

    next();
  },
);

const validateTourImages = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.files, {
      abortEarly: false, // so user can see all errors at once
      stripUnknown: true, // to remove unnecessary fields
    });

    if (error) {
      return res.status(400).json({
        status: "fail",
        message: "Validation error",
        errors: error.details.map((err) => err.message),
      });
    }

    req.files = value; // This is to remove the unnecessary fields from request body

    next();
  };
};

const aliasRecommendedTours = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // SOLUTION 1: Modify URL before query parsing (WORKS) ✅
  // This appends query parameters to the URL, forcing Express to parse them
  // into req.query when the getter is accessed

  const separator = req.url.includes("?") ? "&" : "?";
  req.url += `${separator}sort=-ratingsAverage,price&limit=5&recommended=true`;

  next();

  // SOLUTION 2: Direct modification (DOESN'T WORK) ❌
  // Fails because 'extended' query parser defines req.query as a getter-only property
  // Error: "Cannot set property query of #<IncomingMessage> which has only a getter"
  // The extended parser creates read-only query objects to prevent mutations

  /*
   * req.query.limit = '5';
   * req.query.sort = '-ratingsAverage,price';
   * req.query.recommended = 'true';
   * next();
   */
};

const chekcBody = (req: Request, res: Response, next: NextFunction) => {
  const tour = req.body;

  if (!tour.name || !tour.price) {
    return res.status(400).json({
      status: "fail",
      message: "Missing name or price",
    });
  }

  next();
};

export {
  chekcBody,
  aliasRecommendedTours,
  uploadTourImages,
  resizeTourImages,
  validateTourImages,
};

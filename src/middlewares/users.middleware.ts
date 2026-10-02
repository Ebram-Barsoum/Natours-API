import { Request, Response, NextFunction } from "express";
import sharp from "sharp";
import catchAsyncError from "../utils/catchAsyncError";
import { getFileUploader } from "../configs/multer";

const uploadUserImage = getFileUploader({
  type: "single",
  propertyName: "imageUrl",
  supportedFiles: ["image"],
  maxFileSizeInMB: 5,
  destination: "public/uploads/users",
  storageType: "memory",
});

const resizeUserImage = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // check if there is not a file
    if (!req.file) return next();

    // set filename to user-{id}-{date}.ext to be able to access it inside the route handler
    // to save it into the database
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    const outputPath = `public/uploads/users/${req.file.filename}`;

    await sharp(req.file.buffer)
      .resize(500, 500, {
        fit: sharp.fit.cover,
        position: sharp.strategy.entropy,
      })
      .toFormat("jpeg") // convert image format to jpeg
      .jpeg({ quality: 90 }) // to reduce size and quality
      .toFile(outputPath); // the path where we are going to save the image in the file system including the filename

    next();
  },
);

export { resizeUserImage, uploadUserImage };

import { Request, Response, NextFunction } from "express";
import { ObjectSchema } from "joi";
import { Model } from "mongoose";

import catchAsyncError from "../utils/catchAsyncError";
import AppError from "../utils/appError";

const MONGODB_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

function validateRequestBody(schema: ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
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

    req.body = value; // This is to remove the unnecessary fields from request body

    next();
  };
}

function validateMongoDBId(param: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!MONGODB_ID_PATTERN.test(req.params[param] as string)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid MongoDB ID format!",
      });
    }

    next();
  };
}

function validateDocumentExistence<T>(model: Model<T>, param: string) {
  return catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      const document = await model.findById(req.params[param]);

      if (!document)
        return next(
          new AppError(`No resource found with id: ${req.params[param]}`, 404),
        );

      req.doc = document as any;
      next();
    },
  );
}

function validateDocumentOwner(ownerField: string = "user") {
  return (req: Request, res: Response, next: NextFunction) => {
    const ownerId = (req.doc as any)[ownerField].toString();

    if (!ownerId)
      return new AppError(
        "Ownership filed is not found in user document!",
        500,
      );
    if (ownerId !== req.user._id.toString())
      return new AppError("You're not allowed to perform this action!", 403);

    next();
  };
}

export {
  validateRequestBody,
  validateMongoDBId,
  validateDocumentExistence,
  validateDocumentOwner,
};

import Review, { TReviewDocument } from "../models/review.model";
import AppError from "../utils/appError";
import catchAsyncError from "../utils/catchAsyncError";

declare global {
    namespace Express {
        interface Request {
            review?: TReviewDocument;
        }
    }
}

const validateReviewOwner = (action: "update" | "delete") => {
    return catchAsyncError(async (req, res, next) => {
        const review = await Review.findById(req.params.reviewId);

        if (!review) return next(new AppError('Review not found!', 404));

        if (review.user.toString() !== req.user._id.toString()) return next(new AppError(`You are not allowed to ${action} this review!`, 403));

        req.review = review as TReviewDocument;
        next();
    });
}

export {
    validateReviewOwner
}
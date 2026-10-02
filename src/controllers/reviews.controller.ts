
import Review, { TReviewDocument } from "../models/review.model";
import catchAsyncError from "../utils/catchAsyncError";

const createReview = catchAsyncError(async (req, res) => {
    const tourId = req.params.tourId;

    const newReview = new Review({ ...req.body, tourId, user: req.user._id });

    await newReview.save();

    res.status(201).json({
        status: "success",
        message: "Review added successfully!",
        data: {
            review: newReview
        }
    });
});

const getReviewsByTourId = catchAsyncError(async (req, res) => {
    const tourId = req.params.tourId

    const [reviews, count] = await Promise.all([
        Review.find({ tourId }).populate('user'),
        Review.countDocuments({ tourId })
    ]);

    res.status(200).json({
        status: "success",
        data: {
            reviews,
            count
        }
    });
});

const updateReview = catchAsyncError(async (req, res) => {
    const { rating, content } = req.body;

    (req.doc as unknown as TReviewDocument).set({ rating, content });

    const updatedReview = await (req.doc as unknown as TReviewDocument).save();

    res.status(200).json({
        status: "success",
        message: "Review updated successfully!",
        data: {
            review: updatedReview
        }
    });
});

const deleteReview = catchAsyncError(async (req, res) => {
    await (req.review as TReviewDocument).deleteOne();

    res.status(200).json({
        status: "success",
        message: "Review deleted successfully!",
    });
});

export {
    createReview,
    getReviewsByTourId,
    updateReview,
    deleteReview
};
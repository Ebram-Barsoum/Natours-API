import express from 'express';

import { createReview, deleteReview, getReviewsByTourId, updateReview } from '../controllers/reviews.controller';

import { protect, restrictTo } from '../middlewares/auth.middleware';
import { validateDocumentExistence, validateDocumentOwner, validateMongoDBId, validateRequestBody } from '../middlewares/validation.middlewares';

import { createReviewSchema } from '../schemas/review.schemas';
import Review, { IReview } from '../models/review.model';
import Tour, { ITour } from '../models/tour.model';

const reviewRouter = express.Router({ mergeParams: true });

const validateReviewMiddlewares = [
    validateMongoDBId('reviewId'),
    validateDocumentExistence<IReview>(Review, 'reviewId'),
    validateDocumentOwner('user')
];

export const validateTourMiddlewares = [
    validateMongoDBId('tourId'),
    validateDocumentExistence<ITour>(Tour, 'tourId')
]

reviewRouter.get('/', ...validateTourMiddlewares, getReviewsByTourId);

reviewRouter.use(protect, restrictTo('user'));

reviewRouter.post('/', ...validateTourMiddlewares, validateRequestBody(createReviewSchema), createReview);
reviewRouter.put('/:reviewId', ...validateReviewMiddlewares, validateRequestBody(createReviewSchema), updateReview);
reviewRouter.delete('/:reviewId', ...validateReviewMiddlewares, deleteReview);

export default reviewRouter;
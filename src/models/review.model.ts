import mongoose, { InferSchemaType, HydratedDocument } from "mongoose";

import castMonogoID from "../utils/castMongoID";
import Tour from "./tour.model";

const reviewSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'A review must have a content']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'A review must have a rating']
    },
    tourId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour',
        required: [true, 'A review must belong to a tour']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'A review must belong to a user']
    }
}, {
    timestamps: true,
    versionKey: false,
    toJSON: {
        virtuals: true,
        transform: castMonogoID
    },
    toObject: { virtuals: true }
});

reviewSchema.index({ tourId: 1, user: 1 }, { unique: true }); // unique index to avoid duplicate reviews

reviewSchema.statics.calcAverageRatings = async function (tourId: string) { // static method accessible from model itself
    // 1)- calculate average ratings of a tour with the provided tourId
    const stats = await this.aggregate([ // this refers to the current model
        {
            '$match': {
                tourId,
                deletedAt: null, // execulde soft deleted reviews
            }
        },
        {
            '$group': {
                _id: '$tourId',
                ratingsQuantity: { '$sum': 1 },
                ratingsAverage: { '$avg': '$rating' }
            }
        }
    ]);

    // 2)- update the tour with the calculated average ratings
    await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: stats[0] ? stats[0]?.ratingsQuantity : 0,
        ratingsAverage: stats[0] ? stats[0]?.ratingsAverage : 0
    });
}

// DOCUMENT MIDDLEWARE: runs after .save() and .create() to calculate ratings stats after review creating and updating
reviewSchema.post('save', function () {
    // this points to current processed document review
    // this.constructor points to the Review model, it's workaround to use the model before it's defined
    this.constructor.calcAverageRatings(this.tourId);
});

// QUERY MIDDLEWARE: runs after findOneAndUpdate() and findOneAndDelete() to calculate ratings stats after review updating
reviewSchema.post(/^findOneAnd/, async function (doc) {
    await doc.constructor.calcAverageRatings(doc.tourId);
});

export type IReview = InferSchemaType<typeof reviewSchema>;
export type TReviewDocument = HydratedDocument<IReview>;

const Review = mongoose.model<IReview>('Review', reviewSchema);
export default Review;
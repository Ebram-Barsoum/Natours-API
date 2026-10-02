import Joi from "joi";

const createReviewSchema = Joi.object({
    rating: Joi.number().min(1).max(5).required().messages({
        'number.base': 'A review rating must be a number',
        'number.min': 'A review must have a rating of at least 1',
        'number.max': 'A review must have a rating of at most 5',
        'any.required': 'A review must have a rating',
    }),
    content: Joi.string().required().messages({
        'string.empty': 'A review must have a content',
        'any.required': 'A review must have a content'
    }),
});

export {
    createReviewSchema
};
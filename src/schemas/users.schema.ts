import Joi from "joi";

const updateMeSchema = Joi.object({
    name: Joi.string().min(3).max(20).messages({
        'string.min': 'A user name must have more or equal than 3 characters',
        'string.max': 'A user name must have less or equal than 20 characters',
    }),
    email: Joi.string().email().messages({
        'string.email': 'Invalid email address!',
    }),
});

export {
    updateMeSchema
};
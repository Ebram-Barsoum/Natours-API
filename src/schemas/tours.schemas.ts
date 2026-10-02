import Joi from "joi";

const multerFileSchema = Joi.object({
  fieldname: Joi.string().required(),
  originalname: Joi.string().required(),
  encoding: Joi.string().required(),
  mimetype: Joi.string()
    .regex(/^image\//)
    .required()
    .messages({
      "string.pattern.base": "File must be an image",
    }),
  buffer: Joi.any().required(),
  size: Joi.number()
    .max(5 * 1024 * 1024)
    .required()
    .messages({
      "number.max": "File size must be less than 5MB",
    }),
}).unknown(true);

const coreTourSchema = Joi.object({
  name: Joi.string().min(10).max(40).required().messages({
    "string.empty": "A tour must have a name",
    "string.min": "A tour name must have more or equal than 10 characters",
    "string.max": "A tour name must have less or equal than 40 characters",
    "any.required": "A tour must have a name",
  }),
  duration: Joi.number().required().messages({
    "any.required": "A tour must have a duration",
  }),
  maxGroupSize: Joi.number().required().messages({
    "any.required": "A tour must have a group size",
  }),
  ratingsAverage: Joi.number().min(1).max(5).optional().messages({
    "number.min": "Rating must be above 1.0",
    "number.max": "Rating must be below 5.0",
  }),
  ratingsQuantity: Joi.number().min(0).optional(),
  difficulty: Joi.string()
    .valid("easy", "medium", "difficult")
    .required()
    .messages({
      "any.only": "Difficulty is either easy, medium or difficult",
      "any.required": "A tour must have a difficulty",
    }),
  price: Joi.number().required().messages({
    "any.required": "A tour must have a price",
  }),
  priceDiscount: Joi.number().less(Joi.ref("price")).optional().messages({
    "number.less": "Discount must be less than the price",
  }),
  summary: Joi.string().required().messages({
    "string.empty": "A tour must have a summary",
    "any.required": "A tour must have a summary",
  }),
  description: Joi.string().optional(),
});

const updateCoreTourSchema = coreTourSchema.fork(
  Object.keys(coreTourSchema.describe().keys),
  (schema) => schema.optional(),
);

const tourLocationsSchema = Joi.object({
  startLocation: Joi.object({
    type: Joi.string().valid("Point").default("Point").messages({
      "any.only": 'Start location type must be "Point".',
      "string.base": "Start location type must be a string.",
    }),

    coordinates: Joi.array().items(Joi.number()).length(2).required().messages({
      "any.required": "Start location coordinates are required.",
      "array.base": "Start location coordinates must be an array.",
      "array.length":
        "Start location coordinates must contain exactly 2 values.",
    }),

    address: Joi.string().required().messages({
      "any.required": "Start location address is required.",
      "string.base": "Start location address must be a string.",
    }),

    description: Joi.string().messages({
      "string.base": "Start location description must be a string.",
    }),
  })
    .required()
    .messages({
      "any.required": "Start location is required.",
      "object.base": "Start location must be an object.",
    }),

  locations: Joi.array()
    .items(
      Joi.object({
        type: Joi.string().valid("Point").default("Point").messages({
          "any.only": 'Location type must be "Point".',
          "string.base": "Location type must be a string.",
        }),

        coordinates: Joi.array()
          .items(Joi.number())
          .length(2)
          .required()
          .messages({
            "any.required": "Location coordinates are required.",
            "array.base": "Location coordinates must be an array.",
            "array.length":
              "Location coordinates must contain exactly 2 values.",
            "number.base": "Each coordinate must be a number.",
          }),

        address: Joi.string().required().messages({
          "any.required": "Location address is required.",
          "string.base": "Location address must be a string.",
        }),

        description: Joi.string().messages({
          "string.base": "Location description must be a string.",
        }),

        day: Joi.number().integer().min(1).required().messages({
          "any.required": "Location day is required.",
          "number.base": "Location day must be a number.",
          "number.integer": "Location day must be an integer.",
          "number.min": "Location day must be at least 1.",
        }),
      }),
    )
    .min(1)
    .required()
    .messages({
      "any.required": "Locations are required.",
      "array.base": "Locations must be an array.",
      "array.min": "You must provide at least one location.",
    }),
});

const tourGuidesSchema = Joi.object({
  guides: Joi.array().items(
    Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .messages({
        "string.pattern.base": "Guide ID must be a valid MongoDB ID",
      }),
  ),
});

const tourScheduleSchema = Joi.object({
  startDates: Joi.array().min(1).items(Joi.date()).required().messages({
    "array.required": "Array of start dates must be provided!",
    "array.min": "You must provide at least one start day!",
    "array.base": "Start dates must be an array!",
    "date.base": "Each start date must be a valid date!",
  }),
});

const tourImagesSchema = Joi.object({
  imageCover: Joi.array().items(multerFileSchema).optional(),
  images: Joi.array().items(multerFileSchema).optional(),
});

const tourStatusSchema = Joi.object({
  status: Joi.string().valid("draft", "published").required().messages({
    "any.only": "Status must be draft or published!",
    "any.required": "Tour status must be provided!",
  }),
});

export {
  coreTourSchema,
  updateCoreTourSchema,
  tourLocationsSchema,
  tourGuidesSchema,
  tourScheduleSchema,
  tourImagesSchema,
  tourStatusSchema,
};

import express from "express";
import {
  createTourCore,
  deleteTour,
  getAllTours,
  getMonthlyPlan,
  getTour,
  getToursStats,
  updateTour,
  getToursWithin,
  getToursDistances,
} from "../controllers/tours.controller";
import {
  aliasRecommendedTours,
  uploadTourImages,
  resizeTourImages,
  validateTourImages,
} from "../middlewares/tours.middleware";
import { protect, restrictTo } from "../middlewares/auth.middleware";
import { validateMongoDBId } from "../middlewares/validation.middlewares";

import reviewsRouter from "./reviews.routes";
import { validateTourMiddlewares } from "./reviews.routes";
import { validateRequestBody } from "../middlewares/validation.middlewares";
import {
  coreTourSchema,
  tourGuidesSchema,
  tourImagesSchema,
  tourLocationsSchema,
  tourScheduleSchema,
  tourStatusSchema,
  updateCoreTourSchema,
} from "../schemas/tours.schemas";

const tourRouter = express.Router();

//router.param('tourId', checkID); Middleware that is specific to this router and checks the tourId

tourRouter.use("/:tourId/reviews", reviewsRouter);

tourRouter.get("/", getAllTours);
tourRouter.get("/:tourId", validateMongoDBId("tourId"), getTour);
tourRouter.get("/recommended", aliasRecommendedTours, getAllTours);
tourRouter.get("/stats", getToursStats);

// also could be done with /tours-within?distance=233&center=-40,45&unit=mile
tourRouter.get(
  "/tours-within/distance/:distance/center/:latlng/unit/:unit",
  getToursWithin,
);
tourRouter.get("/distances/:latlng/unit/:unit", getToursDistances);

tourRouter.use(protect);

tourRouter.get(
  "/monthly-plan",
  restrictTo("admin", "lead-guide", "guide"),
  getMonthlyPlan,
);

tourRouter.use(restrictTo("admin", "lead-guide"));

tourRouter.post("/", validateRequestBody(coreTourSchema), createTourCore);

tourRouter.patch(
  "/:tourId",
  ...validateTourMiddlewares,
  validateRequestBody(updateCoreTourSchema),
  updateTour,
);

tourRouter.patch(
  "/:tourId/guides",
  ...validateTourMiddlewares,
  validateRequestBody(tourGuidesSchema),
  updateTour,
);

tourRouter.patch(
  "/:tourId/images",
  ...validateTourMiddlewares,
  uploadTourImages,
  validateTourImages(tourImagesSchema),
  resizeTourImages,
  updateTour,
);

tourRouter.patch(
  "/:tourId/locations",
  ...validateTourMiddlewares,
  validateRequestBody(tourLocationsSchema),
  updateTour,
);

tourRouter.patch(
  "/:tourId/schedule",
  ...validateTourMiddlewares,
  validateRequestBody(tourScheduleSchema),
  updateTour,
);

tourRouter.patch(
  "/:tourId/status",
  ...validateTourMiddlewares,
  validateRequestBody(tourStatusSchema),
  updateTour,
);

tourRouter.delete("/:tourId", ...validateTourMiddlewares, deleteTour);

export default tourRouter;

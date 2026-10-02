import { NextFunction, Request, Response } from "express";

import Tour from "../models/tour.model";
import APIFeatures from "../utils/apiFeatures";
import catchAsyncError from "../utils/catchAsyncError";
import { ITourDocument } from "../models/tour.model";
import AppError from "../utils/appError";
import calcRadius from "../utils/calcRadius";
import { DistanceUnit } from "../utils/calcRadius";

const getAllTours = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const filters = ["difficulty", "duration", "price"];

    // 1)- Creating instance of APIFeatures class
    const features = new APIFeatures(Tour.find(), req.query);

    // 2)- Filtering tours
    const [tours, count] = await Promise.all([
      features.filter(filters).sort().limitFields().paginate().executeQuery(),
      features.getDocumentsCount(),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        tours,
        count,
      },
    });
  },
);

const getTour = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { tourId } = req.params;

    const tour = await Tour.findById(tourId)
      .populate({
        path: "guides",
        select: "-deletedAt -updatedAt -createdAt",
      })
      .populate({
        path: "reviews",
        select: "-deletedAt -updatedAt -createdAt",
      });

    res.status(200).json({
      status: "success",
      data: {
        tour,
      },
    });
  },
);

const createTourCore = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body);
    const newTour = await Tour.create({ ...req.body });

    res.status(201).json({
      status: "success",
      message: "tour added sucessfully!",
      data: {
        tour: newTour,
      },
    });
  },
);

const updateTour = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("Req Body : ", req.body);

    const currentTour = req.doc as ITourDocument;
    Object.assign(currentTour, req.body);

    const updatedTour = await currentTour.save();

    res.status(200).json({
      status: "success",
      message: "Tour is updated successfully!",
      data: {
        tour: updatedTour,
      },
    });
  },
);

const updateTourGuides = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const currentTour = req.doc as ITourDocument;
    Object.assign(currentTour, req.body);

    const updatedTour = await currentTour.save();

    res.status(200).json({
      status: "success",
      data: {
        tour: updatedTour,
      },
    });
  },
);

const deleteTour = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    await (req.doc as ITourDocument).softDelete();

    res.status(200).json({
      status: "success",
      message: "Tour deleted successfully!",
    });
  },
);

const getToursStats = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const stats = await Tour.aggregate([
      { $match: { ratingsAverage: { $gte: 4.5 } } },
      {
        $group: {
          _id: { $toUpper: "$difficulty" }, // this _id property used to group the data together
          countTours: { $sum: 1 },
          avgRating: { $avg: "$ratingsAverage" },
          countRatings: { $sum: "$ratingsQuantity" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
      {
        $sort: {
          countTours: -1,
        },
      },
      // {
      //     $match: {
      //         _id: { $ne: 'DIFFICULT' }
      //     }
      // }
    ]);

    res.status(200).json({
      status: "success",
      data: {
        stats,
      },
    });
  },
);

const getMonthlyPlan = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body.year) {
      throw new Error("Year is required!");
    }

    const plan = await Tour.aggregate([
      { $unwind: "$startDates" }, // this will create a document for each array element
      {
        $match: {
          startDates: {
            $gte: new Date(`${req.body.year}-01-01`),
            $lte: new Date(`${req.body.year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$startDates" }, // this $month will group the data by month
          count: { $sum: 1 },
          tours: { $push: "$name" }, // this creates array of tour names
        },
      },
      {
        $addFields: {
          month: "$_id",
        },
      },
      {
        $project: {
          _id: 0, // remove _id field from returned document
        },
      },
      {
        $sort: {
          count: -1, // sort descending
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        plan,
      },
    });
  },
);

const getToursWithin = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng?.split(",") || [];

    const radius = calcRadius(Number(distance), unit as DistanceUnit);

    if (!Object.values(DistanceUnit).includes(unit as DistanceUnit)) {
      throw new AppError("Please provide a valid unit : [km, mi, m]", 400);
    }

    if (!lat || !lng) {
      next(
        new AppError(
          "Please provide latitude and longitude in the format lat,lng",
          400,
        ),
      );
    }

    const tours = await Tour.find({
      startLocation: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radius],
        },
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        tours,
      },
    });
  },
);

const getToursDistances = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng?.split(",") || [];

    if (!lat || !lng) {
      next(
        new AppError(
          "Please provide latitude and longitude in the format lat,lng",
          400,
        ),
      );
    }

    // the distance coming out of mongoDB is in meter, so we
    // need to convert it based on the unit param
    const distanceMultiplier =
      unit === "mi" ? 0.000621371 : unit === "km" ? 0.001 : 1;

    // NOTE: the $geoNear operator must be the first operator in the aggregation pipeline
    const distances = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          distanceField: "distance",
          distanceMultiplier,
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        distances,
      },
    });
  },
);

export {
  getAllTours,
  getTour,
  createTourCore,
  updateTour,
  deleteTour,
  getToursStats,
  getMonthlyPlan,
  getToursWithin,
  getToursDistances,
  updateTourGuides,
};

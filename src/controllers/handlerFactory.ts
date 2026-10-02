import { Request, Response } from "express";

import catchAsyncError from "../utils/catchAsyncError";
import { Model } from "mongoose";

const createResource = <T>(model: Model<T>) => {
    return catchAsyncError(async (req: Request, res: Response) => {
        const newResource = await model.create(req.body);

        res.status(201).json({
            status: "success",
            message: "Resource created successfully!",
            data: newResource
        });
    });
}

const updateResource = catchAsyncError(async (req: Request, res: Response) => {
    const updatedResource = await req.doc.set({ ...req.body }).save();

    res.status(200).json({
        status: "success",
        message: "Resource updated successfully!",
        data: updatedResource
    });
});

const deleteResource = catchAsyncError(async (req: Request, res: Response) => {
    await (req.doc).deleteOne();

    res.status(200).json({
        status: "success",
        message: "Resource deleted successfully!"
    });
});

const softDeleteResource = catchAsyncError(async (req: Request, res: Response) => {
    await (req.doc).softDelete();

    res.status(200).json({
        status: "success",
        message: "Resource deleted successfully!"
    });
});

export {
    createResource,
    updateResource,
    deleteResource,
    softDeleteResource
};
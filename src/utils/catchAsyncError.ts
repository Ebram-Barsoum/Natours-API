import { Request, Response, NextFunction } from "express";

type RouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

function catchAsyncError(fn: RouteHandler): RouteHandler {
    return async (req, res, next) => {
        // passing a parameter to the next function makes express 
        // ignores all queueing middlewares and run the global error handler
        return fn(req, res, next).catch(error => next(error));
    }
}

export default catchAsyncError;
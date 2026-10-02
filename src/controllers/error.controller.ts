import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";

const handleDBCastError = (err: any): AppError => {
    const message = `Invalid ${err.path}: ${err.value}.`;

    return new AppError(message, 400); // 400 is bad request
}

const handleDBDuplicateFiledValues = (err: any): AppError => {
    // handle multiple duplicate field errors
    const fields = Object.entries(err.keyValue).map(([key, value]) => `${key}: ${value}`).join(', ');
    const message = `Duplicate fields -> ${fields}. Please use another value.`;

    return new AppError(message, 400);
}

const handleDBValidationError = (err: any): AppError => {
    const fieldsErrors = Object.values(err.errors).map((ele: any) => ele.message).join(', ');

    const message = `Invalid data -> ${fieldsErrors}.`;

    return new AppError(message, 400);
}

const handleTokenError = (err: any): AppError => {
    const message = `${err.message}, Please log in again.`;
    return new AppError(message, 401);
}

const sendDevError = (err: AppError, res: Response): void => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        stack: err.stack
    });
}

const sendProdError = (err: AppError, res: Response) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }
    else { // send generic message, and don't make details leak to client
        console.error('ERROR 🔥:', err);

        res.status(500).json({
            status: "error",
            message: "Internal server error!"
        });
    }
}

// exoress knows that this is an error handler function because it has 4 parameters
const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    let error;

    if (AppError.isAppError(err)) {
        error = err;
    }
    else {
        if (err.name === 'CastError')
            error = handleDBCastError(err);
        else if (err.name === 'ValidationError')
            error = handleDBValidationError(err);
        else if (err.code === 11000)
            error = handleDBDuplicateFiledValues(err);
        else if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError')
            error = handleTokenError(err);
        else error = err;
    };

    if (process.env.NODE_ENV === 'development') {
        sendDevError(error, res);
    }
    else if (process.env.NODE_ENV === 'production') {
        sendProdError(error, res);
    }
}

export { globalErrorHandler };
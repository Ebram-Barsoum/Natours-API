type APIResponseStatus = "fail" | "error";

class AppError extends Error {
    public readonly statusCode: number;
    public readonly status: APIResponseStatus;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);

        this.statusCode = statusCode;
        this.status = (statusCode >= 400 && statusCode < 500) ? "fail" : "error";
        this.isOperational = true;

        // this to show the source code of the problem,
        // not the code that created the error object
        Error.captureStackTrace(this, this.constructor);
    }

    public static isAppError(err: any): err is AppError {
        return (err instanceof AppError
            && typeof err.statusCode === "number"
            && typeof err.status === "string"
            && typeof err.isOperational === "boolean"
        );
    }
}

export default AppError;
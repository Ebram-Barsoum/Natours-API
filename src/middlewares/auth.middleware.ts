import jwt from 'jsonwebtoken';

import AppError from "../utils/appError";
import catchAsyncError from "../utils/catchAsyncError";
import User from '../models/user.model';

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

const protect = catchAsyncError(async (req, res, next) => {
    // 1) Getting token from request header
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization?.split(' ')[1];;
    }

    if (!token) return next(new AppError("You're not authorized to access this route!", 401));

    // 2) Verify token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    //3) Check if user still exists
    const currentUser = await User.findById(decodedToken.id as string).select('+passwordChangedAt');

    if (!currentUser) return next(new AppError("The user belonging to this token does no longer exist.", 401));

    // 4) Check if user changed password after the token was issued
    if (currentUser.isPasswordChangedAfter(decodedToken.iat as number)) {
        return next(new AppError("User recently changed password! Please log in again.", 401));
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
});

const restrictTo = (...roles: string[]) => {
    return (req: any, res: any, next: any) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError("You do not have permission to perform this action", 403));
        }

        next();
    }
}

export { protect, restrictTo };
import { Request, Response } from "express";
import rateLimit from "express-rate-limit";

const handler = (req: Request, res: Response) => {
    res.status(429).json({
        status: "error",
        message: "Too many requests, please try again later!",
        data: {
            retryAfter: `${Math.round(Number(res.getHeader("Retry-After")) / 60)}m`
        }
    });
}

const apiLimiter = rateLimit({
    max: 100,
    windowMs: 60 * 1000 * 5,
    handler
});

export {
    apiLimiter
}
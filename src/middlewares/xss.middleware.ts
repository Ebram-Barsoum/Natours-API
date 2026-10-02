
import { filterXSS } from "xss";
import { Request, Response, NextFunction } from 'express';

const xssSanitizer = (req: Request, res: Response, next: NextFunction) => {
    if (req.body) {
        req.body = JSON.parse(filterXSS(JSON.stringify(req.body), {
            whiteList: {},          // no tags allowed
            stripIgnoreTag: true,   // strip disallowed tags completely
            stripIgnoreTagBody: ['script'], // remove script tag content too
        }));
    }

    next();
};


export {
    xssSanitizer
};
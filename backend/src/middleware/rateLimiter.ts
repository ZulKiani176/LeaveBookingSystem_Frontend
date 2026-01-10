import rateLimit from "express-rate-limit";
import type { Request, Response, NextFunction } from "express";

export const apiLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Disable rate limiting for Cypress / test runs
  if (process.env.NODE_ENV === "test") return next();

  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP. Please try again later.",
  })(req, res, next);
};

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../utils/http.js";

export type JwtPayload = {
  sub: string;
  role: "CUSTOMER" | "ADMIN" | "STAFF";
  storeId?: string;
};

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}

export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, process.env.JWT_SECRET ?? "dev-secret", { expiresIn: "7d" });
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new HttpError(401, "Missing bearer token");
  try {
    req.auth = jwt.verify(header.slice(7), process.env.JWT_SECRET ?? "dev-secret") as JwtPayload;
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth || (req.auth.role !== "ADMIN" && req.auth.role !== "STAFF")) {
    throw new HttpError(403, "Admin access required");
  }
  next();
}

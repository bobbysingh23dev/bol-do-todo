import type { NextFunction, Request, Response } from "express";

import { prisma } from "../../lib/prisma.js";
import { verifyAccessToken } from "../lib/jwt.js";

export type AuthRequest = Request & {
  user?: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
  };
};

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email before continuing",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

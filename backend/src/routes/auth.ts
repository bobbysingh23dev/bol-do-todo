import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";

import { prisma } from "../../lib/prisma.js";
import {
  buildPasswordResetEmail,
  buildVerificationEmail,
  isEmailConfigured,
  sendEmail,
} from "../lib/email.js";
import { signAccessToken } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { createOtp, createRawToken, getTokenExpiry, hashToken } from "../lib/tokens.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/config", (_req: Request, res: Response) => {
  return res.json({
    emailDelivery: isEmailConfigured() ? "live" : "console",
  });
});

const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const emailSchema = z.object({
  email: z.string().trim().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

const verifyEmailSchema = z.object({
  email: z.string().trim().email(),
  otp: z
    .string()
    .trim()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be 6 digits"),
});

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
  };
}

async function createAuthToken(userId: string, type: string, hours: number) {
  const rawToken = type === "email_verify" ? createOtp() : createRawToken();

  await prisma.authToken.deleteMany({
    where: { userId, type },
  });

  await prisma.authToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(rawToken),
      expiresAt: getTokenExpiry(hours),
    },
  });

  return rawToken;
}

router.post("/signup", async (req: Request, res: Response) => {
  try {
    const parsed = signupSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      });
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
      },
    });

    const rawToken = await createAuthToken(user.id, "email_verify", 24);
    const emailContent = buildVerificationEmail(rawToken, user.email);
    await sendEmail(emailContent);

    return res.status(201).json({
      message: "Account created. Enter the OTP sent to your email.",
      user: publicUser(user),
      ...(!isEmailConfigured() && { devOtp: rawToken }),
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Failed to create account" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      });
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const validPassword = await verifyPassword(password, user.passwordHash);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
        code: "EMAIL_NOT_VERIFIED",
        user: publicUser(user),
      });
    }

    const token = signAccessToken({ sub: user.id, email: user.email });

    return res.json({
      message: "Login successful",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Failed to log in" });
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const parsed = emailSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      });
    }

    const normalizedEmail = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      const rawToken = await createAuthToken(user.id, "password_reset", 1);
      const emailContent = buildPasswordResetEmail(rawToken, user.email);
      await sendEmail(emailContent);

      if (!isEmailConfigured()) {
        return res.json({
          message: "If that email exists, a reset link has been sent",
          devResetToken: rawToken,
        });
      }
    }

    return res.json({
      message: "If that email exists, a reset link has been sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Failed to process request" });
  }
});

router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      });
    }

    const { token, password } = parsed.data;
    const tokenHash = hashToken(token);

    const authToken = await prisma.authToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!authToken || authToken.type !== "password_reset") {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    if (authToken.expiresAt < new Date()) {
      await prisma.authToken.delete({ where: { id: authToken.id } });
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: authToken.userId },
        data: { passwordHash },
      }),
      prisma.authToken.delete({ where: { id: authToken.id } }),
    ]);

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Failed to reset password" });
  }
});

router.get("/verify-email", async (req: Request, res: Response) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";

  if (!token) {
    return res.status(400).json({ message: "Verification token is required" });
  }

  return verifyEmailToken(token, res);
});

router.post("/verify-email", async (req: Request, res: Response) => {
  try {
    const parsed = verifyEmailSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      });
    }

    return verifyEmailOtp(parsed.data.email, parsed.data.otp, res);
  } catch (error) {
    console.error("Verify email error:", error);
    return res.status(500).json({ message: "Failed to verify email" });
  }
});

router.post("/resend-verification", async (req: Request, res: Response) => {
  try {
    const parsed = emailSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      });
    }

    const normalizedEmail = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.json({
        message: "If that email exists, a verification code has been sent",
      });
    }

    if (user.emailVerified) {
      return res.json({ message: "Email is already verified" });
    }

    const rawToken = await createAuthToken(user.id, "email_verify", 24);
    const emailContent = buildVerificationEmail(rawToken, user.email);
    await sendEmail(emailContent);

    return res.json({
      message: "Verification code sent",
      ...(!isEmailConfigured() && { devOtp: rawToken }),
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return res
      .status(500)
      .json({ message: "Failed to resend verification email" });
  }
});

async function verifyEmailOtp(email: string, otp: string, res: Response) {
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid email or OTP" });
  }

  if (user.emailVerified) {
    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    return res.json({
      message: "Email already verified",
      token: accessToken,
      user: publicUser(user),
    });
  }

  const tokenHash = hashToken(otp);

  const authToken = await prisma.authToken.findFirst({
    where: {
      userId: user.id,
      type: "email_verify",
      tokenHash,
    },
  });

  if (!authToken) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  if (authToken.expiresAt < new Date()) {
    await prisma.authToken.delete({ where: { id: authToken.id } });
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  const verifiedUser = await prisma.$transaction(async (tx) => {
    await tx.authToken.delete({ where: { id: authToken.id } });
    return tx.user.update({
      where: { id: authToken.userId },
      data: { emailVerified: true },
    });
  });

  const accessToken = signAccessToken({
    sub: verifiedUser.id,
    email: verifiedUser.email,
  });

  return res.json({
    message: "Email verified successfully",
    token: accessToken,
    user: publicUser(verifiedUser),
  });
}

async function verifyEmailToken(token: string, res: Response) {
  const tokenHash = hashToken(token);

  const authToken = await prisma.authToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!authToken || authToken.type !== "email_verify") {
    return res
      .status(400)
      .json({ message: "Invalid or expired verification link" });
  }

  if (authToken.expiresAt < new Date()) {
    await prisma.authToken.delete({ where: { id: authToken.id } });
    return res
      .status(400)
      .json({ message: "Invalid or expired verification link" });
  }

  const user = await prisma.$transaction(async (tx) => {
    await tx.authToken.delete({ where: { id: authToken.id } });
    return tx.user.update({
      where: { id: authToken.userId },
      data: { emailVerified: true },
    });
  });

  const accessToken = signAccessToken({ sub: user.id, email: user.email });

  return res.json({
    message: "Email verified successfully",
    token: accessToken,
    user: publicUser(user),
  });
}

export default router;

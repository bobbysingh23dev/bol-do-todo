import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";

import {
  buildTestEmail,
  isSmtpConfigured,
  sendEmail,
} from "../lib/email.js";

const router = Router();

const testEmailSchema = z.object({
  to: z.string().trim().email("Valid email address is required"),
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = testEmailSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      });
    }

    if (!isSmtpConfigured()) {
      return res.status(503).json({
        message:
          "SMTP is not configured. Add EMAIL_FROM, SMTP_HOST, SMTP_USER, and SMTP_PASS to backend/.env",
        emailDelivery: "console",
      });
    }

    const emailContent = buildTestEmail(parsed.data.to);
    await sendEmail(emailContent);

    return res.json({
      message: "Test email sent successfully",
      to: parsed.data.to,
      emailDelivery: "live",
    });
  } catch (error) {
    console.error("Test email error:", error);
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to send test email",
    });
  }
});

export default router;

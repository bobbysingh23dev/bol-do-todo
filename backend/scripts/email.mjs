#!/usr/bin/env node
/**
 * Mailinator OTP setup helper.
 *
 *   npm run setup:email                          — print Brevo setup steps
 *   npm run test:email -- inbox@mailinator.com   — send test OTP email
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env");

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error("Missing backend/.env — copy from .env.example first.");
    process.exit(1);
  }

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function smtpConfigured() {
  return (
    Boolean(process.env.SMTP_HOST) &&
    Boolean(process.env.SMTP_USER) &&
    Boolean(process.env.SMTP_PASS)
  );
}

function printSetup() {
  console.log(`
Mailinator OTP setup (no Gmail required)
======================================

Brevo free SMTP sends to ANY address including @mailinator.com.

1. Create free account: https://www.brevo.com
2. Settings → Senders, Domains & Dedicated IPs → Senders
   → Add sender → verify the email you want as FROM
3. Settings → SMTP & API → SMTP → Generate new SMTP key
4. Add to backend/.env:

   EMAIL_FROM=BolDo <your-verified-sender@example.com>
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-brevo-login@example.com
   SMTP_PASS=xsmtpsib-xxxxxxxx

5. Restart backend, then test:

   npm run test:email -- waterfall@mailinator.com

6. Sign up in app with that Mailinator address → open inbox → copy 6-digit OTP.

Without SMTP: dev mode returns devOtp in API response (console only, not Mailinator).
Resend free tier does NOT work with Mailinator — use Brevo SMTP instead.
`);
}

async function sendTest(to) {
  loadEnv();

  if (!smtpConfigured()) {
    console.error("SMTP not configured in backend/.env\n");
    printSetup();
    process.exit(1);
  }

  const from = process.env.EMAIL_FROM ?? "BolDo <test@example.com>";
  const otp = String(Math.floor(100000 + Math.random() * 900000));

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  console.log(`Sending test OTP to ${to} via ${process.env.SMTP_HOST}...`);

  try {
    await transporter.verify();
  } catch (err) {
    console.error("SMTP connection failed:", err.message);
    console.error("\nCheck SMTP_USER (Brevo login email) and SMTP_PASS (SMTP key, not API key).");
    process.exit(1);
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject: "BolDo test verification code",
      text: `Your BolDo test code is: ${otp}\n\nIf you see this in Mailinator, OTP delivery works.`,
      html: `<p>Your BolDo test code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px">${otp}</p><p>If you see this in Mailinator, OTP delivery works.</p>`,
    });
  } catch (err) {
    console.error("Send failed:", err.message);
    if (err.message.includes("sender")) {
      console.error("\nVerify EMAIL_FROM matches a verified sender in Brevo dashboard.");
    }
    process.exit(1);
  }

  const inbox = to.split("@")[0];
  console.log(`\n✅ Sent. OTP: ${otp}`);
  if (to.endsWith("@mailinator.com")) {
    console.log(`   Open: https://www.mailinator.com/v4/public/inboxes.jsp?to=${inbox}`);
  }
}

const cmd = process.argv[2];

if (cmd === "test") {
  const to = process.argv[3];
  if (!to) {
    console.error("Usage: npm run test:email -- inbox@mailinator.com");
    process.exit(1);
  }
  await sendTest(to);
} else {
  printSetup();
}

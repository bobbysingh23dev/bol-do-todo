import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export function isSmtpConfigured(): boolean {
  return (
    Boolean(process.env.SMTP_HOST) &&
    Boolean(process.env.SMTP_USER) &&
    Boolean(process.env.SMTP_PASS)
  );
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function isEmailConfigured(): boolean {
  return isSmtpConfigured() || isResendConfigured();
}

const transporter = isSmtpConfigured()
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

async function sendViaResend(input: SendEmailInput, from: string): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend failed: ${body}`);
  }
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const from = process.env.EMAIL_FROM ?? "BolDo <onboarding@resend.dev>";

  if (isResendConfigured()) {
    await sendViaResend(input, from);
    console.log(`📧 Email sent via Resend to ${input.to}`);
    return;
  }

  if (transporter) {
    await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    console.log(`📧 Email sent via SMTP to ${input.to}`);
    return;
  }

  console.log("\n📧 Email (dev mode — not sent)");
  console.log(`To: ${input.to}`);
  console.log(`Subject: ${input.subject}`);
  console.log(input.text);
  console.log("\nAdd SMTP to backend/.env to send to any email address.\n");
}

export function buildVerificationEmail(otp: string, email: string) {
  return {
    subject: "Your BolDo verification code",
    text: `Hi,\n\nYour BolDo verification code is: ${otp}\n\nEnter this 6-digit code in the app to verify your account.\n\nThis code expires in 24 hours.`,
    html: `<p>Hi,</p><p>Your BolDo verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px">${otp}</p><p>Enter this code in the app to verify your account.</p><p>This code expires in 24 hours.</p>`,
    to: email,
  };
}

export function buildPasswordResetEmail(rawToken: string, email: string) {
  const appUrl = process.env.APP_URL ?? "http://localhost:4000";
  const resetUrl = `${appUrl}/api/auth/reset-password?token=${rawToken}`;
  const deepLink = `boldoui://reset-password?token=${rawToken}`;

  return {
    subject: "Reset your BolDo password",
    text: `Hi,\n\nReset your password:\n${resetUrl}\n\nApp link: ${deepLink}\n\nThis link expires in 1 hour.`,
    html: `<p>Hi,</p><p>Reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Or open in app: <code>${deepLink}</code></p><p>This link expires in 1 hour.</p>`,
    to: email,
  };
}

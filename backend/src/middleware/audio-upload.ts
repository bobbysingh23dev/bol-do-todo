import fs from "node:fs";
import path from "node:path";

import multer from "multer";
import type { Request } from "express";

import type { AuthRequest } from "./auth.js";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export function getUploadRoot() {
  return UPLOAD_ROOT;
}

export function resolveAudioPath(relativePath: string) {
  return path.join(UPLOAD_ROOT, relativePath);
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const userId = (req as AuthRequest).user?.id;

    if (!userId) {
      cb(new Error("Authentication required"), "");
      return;
    }

    const dir = path.join(UPLOAD_ROOT, userId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".m4a";
    cb(null, `${Date.now()}${ext}`);
  },
});

export const audioUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype.startsWith("audio/") ||
      file.mimetype === "application/octet-stream"
    ) {
      cb(null, true);
      return;
    }

    cb(new Error("Only audio files are allowed"));
  },
});

export function getRelativeAudioPath(req: Request, filename: string) {
  const userId = (req as AuthRequest).user!.id;
  return path.posix.join(userId, filename);
}

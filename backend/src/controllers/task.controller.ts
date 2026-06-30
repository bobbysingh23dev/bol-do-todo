import type { Response } from "express";
import fs from "node:fs";
import path from "node:path";

import { prisma } from "../lib/prisma.js";
import {
  getRelativeAudioPath,
  resolveAudioPath,
} from "../middleware/audio-upload.js";
import type { AuthRequest } from "../middleware/auth.js";

export async function createTaskFromVoice(req: AuthRequest, res: Response) {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "Audio file is required" });
    }

    const title =
      typeof req.body.title === "string" && req.body.title.trim()
        ? req.body.title.trim()
        : "Voice note";

    const relativePath = getRelativeAudioPath(req, file.filename);

    const task = await prisma.task.create({
      data: {
        userId: req.user!.id,
        title,
        type: "voice",
        audioPath: relativePath,
        status: "pending",
      },
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error("Create voice task error:", error);
    return res.status(500).json({ message: "Failed to save voice note" });
  }
}

export async function streamTaskAudio(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const task = await prisma.task.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!task?.audioPath) {
      return res.status(404).json({ message: "Audio not found" });
    }

    const absolutePath = resolveAudioPath(task.audioPath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: "Audio file missing" });
    }

    const ext = path.extname(absolutePath).toLowerCase();
    const contentType =
      ext === ".mp3"
        ? "audio/mpeg"
        : ext === ".wav"
          ? "audio/wav"
          : ext === ".webm"
            ? "audio/webm"
            : "audio/mp4";

    res.setHeader("Content-Type", contentType);
    return res.sendFile(absolutePath);
  } catch (error) {
    console.error("Stream task audio error:", error);
    return res.status(500).json({ message: "Failed to stream audio" });
  }
}

export async function createTask(req: AuthRequest, res: Response) {
  try {
    const {
      title,
      description,
      type,
      personName,
      amount,
      dueDateText,
      dueAt,
      sourceText,
      generatedMsg,
      audioPath,
    } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const task = await prisma.task.create({
      data: {
        userId: req.user!.id,
        title: title.trim(),
        description,
        type: type || "task",
        personName,
        amount,
        dueDateText,
        dueAt: dueAt ? new Date(dueAt) : null,
        sourceText,
        generatedMsg,
        audioPath,
      },
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error("Create task error:", error);
    return res.status(500).json({ message: "Failed to create task" });
  }
}

export async function listTasks(req: AuthRequest, res: Response) {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });

    return res.json(tasks);
  } catch (error) {
    console.error("Get tasks error:", error);
    return res.status(500).json({ message: "Failed to fetch tasks" });
  }
}

export async function getTask(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const task = await prisma.task.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.json(task);
  } catch (error) {
    console.error("Get task error:", error);
    return res.status(500).json({ message: "Failed to fetch task" });
  }
}

export async function markTaskDone(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const existing = await prisma.task.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = await prisma.task.update({
      where: { id },
      data: { status: "done" },
    });

    return res.json(task);
  } catch (error) {
    console.error("Mark task done error:", error);
    return res.status(500).json({ message: "Failed to update task" });
  }
}

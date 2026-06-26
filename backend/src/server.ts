import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "../lib/prisma.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "BolDo local backend is running 🚀",
  });
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    app: "bol-do-backend",
  });
});

app.post("/api/tasks", async (req: Request, res: Response) => {
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

    if (!title) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    const task = await prisma.task.create({
      data: {
        title,
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

    return res.status(500).json({
      message: "Failed to create task",
    });
  }
});

app.get("/api/tasks", async (_req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(tasks);
  } catch (error) {
    console.error("Get tasks error:", error);

    return res.status(500).json({
      message: "Failed to fetch tasks",
    });
  }
});

app.patch("/api/tasks/:id/done", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid task id",
      });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: "done",
      },
    });

    return res.json(task);
  } catch (error) {
    console.error("Mark task done error:", error);

    return res.status(500).json({
      message: "Failed to update task",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

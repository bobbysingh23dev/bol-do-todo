import { Router } from "express";

import {
  createTask,
  createTaskFromVoice,
  getTask,
  listTasks,
  markTaskDone,
  streamTaskAudio,
} from "../controllers/task.controller.js";
import { audioUpload } from "../middleware/audio-upload.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.post("/voice", audioUpload.single("audio"), createTaskFromVoice);
router.get("/:id/audio", streamTaskAudio);
router.post("/", createTask);
router.get("/", listTasks);
router.get("/:id", getTask);
router.patch("/:id/done", markTaskDone);

export default router;

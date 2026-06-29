import { Router } from "express";

import {
  createTask,
  getTask,
  listTasks,
  markTaskDone,
} from "../controllers/task.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.post("/", createTask);
router.get("/", listTasks);
router.get("/:id", getTask);
router.patch("/:id/done", markTaskDone);

export default router;

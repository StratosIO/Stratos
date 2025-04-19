import { Hono } from "hono";
import { taskController } from "../controllers/taskController.js";
import { authMiddleware } from "../middleware/auth.js";

const tasks = new Hono();

// Apply auth middleware to all routes
tasks.use("/*", authMiddleware);
tasks.post("/", taskController.submitCommand);
tasks.get("/:id", taskController.getTask);
tasks.get("/", taskController.listTasks);
tasks.get("/:id/status", taskController.getTaskStatus);
tasks.delete("/:id", taskController.delete);
tasks.get("/:id/progress", taskController.streamTaskProgress);
tasks.get("/:id/preview", taskController.streamTaskPreview);
export default tasks;

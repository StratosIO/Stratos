import { Hono } from "hono";
import { taskController } from "../controllers/taskController.js";
import { authMiddleware } from "../middleware/auth.js";
import { OUTPUT_CONFIG } from "../types/index.js";
import { serveStatic } from "hono/bun";

const tasks = new Hono();

tasks.get("/:id/progress", taskController.streamTaskProgress);

// Apply auth middleware
tasks.use("/*", authMiddleware);
tasks.post("/", taskController.submitCommand);
tasks.get("/:id", taskController.getTask);
tasks.get("/", taskController.listTasks);
tasks.get("/:id/status", taskController.getTaskStatus);
tasks.delete("/:id", taskController.delete);

tasks.use(
	"/previews/*",
	serveStatic({
		root: OUTPUT_CONFIG.DIR,
		rewriteRequestPath: (path) => {
			return `/previews/${path.split("/").at(-1)}`;
		},
	}),
);

export default tasks;

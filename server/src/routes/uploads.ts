import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { fileController } from "../controllers/fileController.js";
import { authMiddleware } from "../middleware/auth.js";
import { UPLOAD_CONFIG } from "../types/index.js";

const uploads = new Hono();

// Apply auth middleware to all routes
uploads.use("/*", authMiddleware);

uploads.post("/", fileController.upload);
uploads.get("/", fileController.list);
uploads.delete("/:id", fileController.delete);

uploads.use(
	"/thumbnails/*",
	serveStatic({
		root: UPLOAD_CONFIG.DIR,
		rewriteRequestPath: (path) => `/thumbnails/${path.split("/").at(-1)}`,
	}),
);

export default uploads;

import fs from "node:fs/promises";
import path from "node:path";
import sql from "../config/database.js";
import log from "../config/logger.js";
import { OUTPUT_CONFIG, UPLOAD_CONFIG } from "../types/index.js";
import { thumbnailUtils } from "../utils/thumbnailUtils.js";

export const cleanupService = {
	/**
	 * Delete expired files and associated tasks
	 */
	cleanupExpiredFiles: async (): Promise<void> => {
		try {
			log.info("Starting expired files cleanup job");

			// Get all expired files
			const expiredFiles = await sql<{ id: string; file_path: string }[]>`
        SELECT id, file_path
        FROM files
        WHERE expires_at < CURRENT_TIMESTAMP
      `;

			log.info(`Found ${expiredFiles.length} expired files to clean up`);

			// Delete each file from the filesystem and database
			for (const file of expiredFiles) {
				try {
					// Delete file from filesystem
					await fs.unlink(file.file_path);
					log.info(`Deleted file from filesystem: ${file.file_path}`);

					// Delete thumbnail
					await thumbnailUtils.delete(file.id, UPLOAD_CONFIG);

					// Delete from database (this will cascade to task_files)
					await sql`DELETE FROM files WHERE id = ${file.id}`;
					log.info(`Deleted file record from database: ${file.id}`);
				} catch (fileError) {
					log.error(`Error deleting file ${file.id}:`, fileError);
				}
			}

			// Get expired tasks (those without associated files or explicitly expired)
			const expiredTasks = await sql<{ id: string; result_path: string }[]>`
        SELECT id, result_path
        FROM tasks
        WHERE expires_at < CURRENT_TIMESTAMP
        AND NOT EXISTS (
          SELECT 1 FROM task_files WHERE task_id = tasks.id
        )
      `;
			log.info(`Found ${expiredTasks.length} expired tasks to clean up`);

			// Delete task output directories and thumbnails
			for (const task of expiredTasks) {
				try {
					const taskDir = path.join(OUTPUT_CONFIG.DIR, task.id);

					// Check if task directory exists
					const taskDirExists = await fs
						.access(taskDir)
						.then(() => true)
						.catch(() => false);

					if (taskDirExists && taskDir.startsWith(OUTPUT_CONFIG.DIR)) {
						await fs.rm(taskDir, { recursive: true, force: true });
						log.info(`Deleted task output directory: ${taskDir}`);
					}

					// Delete associated thumbnail
					await thumbnailUtils.delete(task.id, OUTPUT_CONFIG);

					// Delete from database
					await sql`DELETE FROM tasks WHERE id = ${task.id}`;
					log.info(`Deleted task record from database: ${task.id}`);
				} catch (taskError) {
					log.error(`Error deleting task ${task.id}:`, taskError);
					// Continue with other tasks even if this one fails
				}
			}

			log.info("Expired files and tasks cleanup completed");
		} catch (error) {
			log.error("Error during cleanup job:", error);
		}
	},

	/**
	 * Schedule the cleanup job to run periodically
	 */
	scheduleCleanupJob: (intervalSeconds: number): NodeJS.Timeout => {
		log.info(`Scheduling cleanup job to run every ${intervalSeconds} seconds`);

		// Run immediately on startup
		cleanupService.cleanupExpiredFiles().catch((err) => {
			log.error("Initial cleanup job failed:", err);
		});

		// Then schedule to run periodically
		return setInterval(() => {
			cleanupService.cleanupExpiredFiles().catch((err) => {
				log.error("Scheduled cleanup job failed:", err);
			});
		}, intervalSeconds * 1000);
	},
};

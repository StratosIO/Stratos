// server/src/utils/previewUtils.ts

import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import log from "../config/logger.js";
import { OUTPUT_CONFIG } from "../types/index.js";
import { PREVIEW_DIR_NAME, PREVIEW_FORMAT } from "../types/index.js";

const execAsync = promisify(exec);

export const previewUtils = {
	getPreviewDirectory: () => {
		return path.join(OUTPUT_CONFIG.DIR, PREVIEW_DIR_NAME);
	},
	ensurePreviewDirectory: async () => {
		try {
			const dir = previewUtils.getPreviewDirectory();
			await fs.mkdir(dir, { recursive: true, mode: OUTPUT_CONFIG.PERMISSIONS });
		} catch (error) {
			log.error("Failed to create preview directory:", error);
			throw new Error("Failed to initialize preview directory");
		}
	},
	generatePreview: async (
		filePath: string,
		taskId: string,
		fileType: string,
	): Promise<string | null> => {
		try {
			await previewUtils.ensurePreviewDirectory();

			const previewPath = path.join(
				previewUtils.getPreviewDirectory(),
				`${taskId}.${PREVIEW_FORMAT}`,
			);

			if (fileType.startsWith("image/")) {
				await execAsync(`ffmpeg -y -i "${filePath}" "${previewPath}"`);
			}
			if (fileType.startsWith("video/")) {
				const seekTime = await (async () => {
					try {
						const { stdout } = await execAsync(
							`ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
						);
						const duration = parseFloat(stdout.trim());
						return duration > 0 ? duration / 2 : 1;
					} catch {
						return 0;
					}
				})();

				await execAsync(
					`ffmpeg -y -i "${filePath}" -ss ${seekTime} -vframes 1 "${previewPath}"`,
				);
			} else {
				return null;
			}
			await fs.access(previewPath);
			log.info(`Preview generated for task ${taskId} at ${previewPath}`);
			return previewPath;
		} catch (error) {
			log.error(`Error generating preview for task ${taskId}:`, error);
			return null;
		}
	},
	deletePreview: async (taskId: string): Promise<void> => {
		try {
			const previewPath = path.join(
				previewUtils.getPreviewDirectory(),
				`${taskId}.${PREVIEW_FORMAT}`,
			);

			await fs.unlink(previewPath);
			log.info(`Preview deleted: ${previewPath}`);
		} catch (error) {
			if (error && typeof error === "object" && "code" in error) {
				if (error.code !== "ENOENT") {
					log.warn(`Error deleting preview for task ${taskId}:`, error);
				}
			} else {
				log.warn(`Error deleting preview for task ${taskId}:`, error);
			}
		}
	},
};

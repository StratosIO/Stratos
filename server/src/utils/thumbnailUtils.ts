import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import log from "../config/logger.js";
import type { UPLOAD_CONFIG, OUTPUT_CONFIG } from "../types/index.js";
import { THUMBNAIL_DIR_NAME, THUMBNAIL_FORMAT } from "../types/index.js";

const execAsync = promisify(exec);

export const thumbnailUtils = {
	getDirectory: (baseConfig: typeof UPLOAD_CONFIG | typeof OUTPUT_CONFIG) => {
		return path.join(baseConfig.DIR, THUMBNAIL_DIR_NAME);
	},
	ensureDirectory: async (baseConfig: typeof UPLOAD_CONFIG | typeof OUTPUT_CONFIG) => {
		try {
			const dir = thumbnailUtils.getDirectory(baseConfig);
			await fs.mkdir(dir, { recursive: true, mode: baseConfig.PERMISSIONS });
		} catch (error) {
			log.error("Failed to create thumbnail directory:", error);
			throw new Error("Failed to initialize thumbnail directory");
		}
	},
	shouldGenerate: (fileType: string): boolean => {
		const supportedTypes = [
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/gif",
			"image/webp",
			"image/avif",
			"video/mp4",
			"video/webm",
			"video/ogg",
			"video/quicktime",
			"video/x-msvideo",
			"video/x-matroska",
		];
		return supportedTypes.includes(fileType.toLowerCase());
	},
	generate: async (
		filePath: string,
		id: string,
		fileType: string,
		baseConfig: typeof UPLOAD_CONFIG | typeof OUTPUT_CONFIG
	): Promise<string | null> => {
		try {
			await thumbnailUtils.ensureDirectory(baseConfig);

			const outputPath = path.join(
				thumbnailUtils.getDirectory(baseConfig),
				`${id}.${THUMBNAIL_FORMAT}`,
			);

			if (fileType.startsWith("image/")) {
				await execAsync(`ffmpeg -y -i "${filePath}" -vframes 1 "${outputPath}"`);
			} else if (fileType.startsWith("video/")) {
				const seekTime = await (async () => {
					try {
						const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`);
						const duration = Number.parseFloat(stdout.trim());
						return duration > 0 ? duration / 2 : 1;
					} catch {
						return 0;
					}
				})();

				await execAsync(`ffmpeg -y -i "${filePath}" -ss ${seekTime} -vframes 1 "${outputPath}"`);
			} else {
				return null;
			}

			await fs.access(outputPath);
			log.info(`Thumbnail generated for id ${id} at ${outputPath}`);
			return outputPath;
		} catch (error) {
			log.error(`Error generating thumbnail for id ${id}:`, error);
			return null;
		}
	},
	delete: async (id: string, baseConfig: typeof UPLOAD_CONFIG | typeof OUTPUT_CONFIG): Promise<void> => {
		try {
			const outputPath = path.join(
				thumbnailUtils.getDirectory(baseConfig),
				`${id}.${THUMBNAIL_FORMAT}`,
			);

			await fs.unlink(outputPath);
			log.info(`Thumbnail deleted: ${outputPath}`);
		} catch (error) {
			if (error && typeof error === "object" && "code" in error) {
				if (error.code !== "ENOENT") {
					log.warn(`Error deleting thumbnail for id ${id}:`, error);
				}
			} else {
				log.warn(`Error deleting thumbnail for id ${id}:`, error);
			}
		}
	},
};

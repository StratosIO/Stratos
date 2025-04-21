import { exec } from "node:child_process";
import { spawn } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs/promises";
import sql from "../config/database.js";
import log from "../config/logger.js";
import { OUTPUT_CONFIG } from "../types/index.js";

const execAsync = promisify(exec);

// Constants for preview generation
const PREVIEW_DIR_NAME = "previews";
const PREVIEW_SIZE_LIMIT = 500 * 1024 * 1024; // 500MB in bytes
const SMALL_FILE_THRESHOLD = 5 * 1024 * 1024; // 5MB in bytes

export const previewService = {
	/**
	 * Ensure the preview directory exists
	 */
	ensurePreviewDirectory: async (taskId: string) => {
		try {
			const previewDir = path.join(OUTPUT_CONFIG.DIR, taskId, PREVIEW_DIR_NAME);
			await fs.mkdir(previewDir, {
				recursive: true,
				mode: OUTPUT_CONFIG.PERMISSIONS,
			});
			return previewDir;
		} catch (error) {
			log.error(
				`Failed to create preview directory for task ${taskId}:`,
				error,
			);
			throw new Error("Failed to create preview directory");
		}
	},

	/**
	 * Check if a file needs a preview based on size and type
	 */
	shouldGeneratePreview: (fileExt: string, fileSize: number): boolean => {
		// Log what we're checking
		log.info(
			`Checking preview generation: fileExt=${fileExt}, fileSize=${fileSize}`,
		);

		// Small files don't need previews
		if (fileSize <= SMALL_FILE_THRESHOLD) {
			log.info(`File too small (${fileSize} bytes), skipping preview`);
			return false;
		}

		// Check file type by extension
		const videoExts = [".mp4", ".webm", ".mkv", ".avi", ".mov", ".flv", ".wmv"];
		const audioExts = [".mp3", ".wav", ".ogg", ".aac", ".flac", ".m4a"];
		const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"];
		const textExts = [".txt", ".json", ".srt", ".vtt"];

		// Check if file extension is in any of our supported types
		if (
			videoExts.includes(fileExt) ||
			audioExts.includes(fileExt) ||
			imageExts.includes(fileExt) ||
			textExts.includes(fileExt)
		) {
			log.info(`File type supported for preview: ${fileExt}`);
			return true;
		}

		// No match found, skip preview
		log.info(`File type not supported for preview: ${fileExt}`);
		return false;
	},

	/**
	 * Generate a preview for a task output file
	 */
	generatePreview: async (taskId: string): Promise<string | null> => {
		try {
			log.info(`Starting preview generation for task ${taskId}`);

			// Get task information
			const [task] = await sql`
            SELECT result_path, id FROM tasks WHERE id = ${taskId}
          `;

			if (!task || !task.result_path) {
				log.warn(`Cannot generate preview for task ${taskId}: No result path`);
				return null;
			}

			const filePath = task.result_path;
			const fileName = path.basename(filePath);
			const fileExt = path.extname(fileName).toLowerCase();

			// Get file info including size
			const stats = await fs.stat(filePath);
			const fileSize = stats.size;

			// Check if we should generate a preview based on extension and size
			if (!previewService.shouldGeneratePreview(fileExt, fileSize)) {
				log.info(
					`Skipping preview generation for task ${taskId}: file size or type doesn't warrant preview`,
				);
				await sql`
              UPDATE tasks 
              SET preview_generated = true 
              WHERE id = ${taskId}
            `;
				return null;
			}

			// Create preview directory
			const previewDir = await previewService.ensurePreviewDirectory(taskId);
			const previewFileName = `preview_${fileName}`;
			const previewPath = path.join(previewDir, previewFileName);

			// Generate preview based on file extension
			const videoExts = [
				".mp4",
				".webm",
				".mkv",
				".avi",
				".mov",
				".flv",
				".wmv",
			];
			const audioExts = [".mp3", ".wav", ".ogg", ".aac", ".flac", ".m4a"];
			const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"];
			const textExts = [".txt", ".json", ".srt", ".vtt"];

			if (videoExts.includes(fileExt)) {
				log.info(`Generating video preview for ${fileName}`);
				await previewService.generateVideoPreview(
					filePath,
					previewPath,
					fileSize,
				);
			} else if (audioExts.includes(fileExt)) {
				log.info(`Generating audio preview for ${fileName}`);
				await previewService.generateAudioPreview(filePath, previewPath);
			} else if (imageExts.includes(fileExt)) {
				log.info(`Generating image preview for ${fileName}`);
				await previewService.generateImagePreview(filePath, previewPath);
			} else if (textExts.includes(fileExt)) {
				log.info(`Generating text preview for ${fileName}`);
				await previewService.generateTextPreview(filePath, previewPath);
			} else {
				// This case shouldn't happen if shouldGeneratePreview is working correctly
				log.warn(`No preview generator for file extension: ${fileExt}`);
				return null;
			}

			// Update task with preview path
			await sql`
            UPDATE tasks 
            SET preview_path = ${previewPath}, 
                preview_generated = true 
            WHERE id = ${taskId}
          `;

			log.info(`Preview generated for task ${taskId} at ${previewPath}`);
			return previewPath;
		} catch (error) {
			log.error(`Error generating preview for task ${taskId}:`, error);
			// Mark as generated but failed
			await sql`
            UPDATE tasks 
            SET preview_generated = true 
            WHERE id = ${taskId}
          `;
			return null;
		}
	},

	/**
	 * Generate video preview
	 */
	generateVideoPreview: async (
		inputPath: string,
		outputPath: string,
		fileSize: number,
	): Promise<void> => {
		// Size-based settings
		let crf;
    let scale; 
    let trimDuration;

		// Get video duration (still useful for trimming)
		let duration = null;
		try {
			const { stdout } = await execAsync(
				`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`,
			);
			duration = Number.parseFloat(stdout.trim());
			log.info(`Video duration: ${duration} seconds`);
		} catch (error) {
			log.warn(`Could not determine video duration: ${error}`);
		}

		// Determine settings purely based on file size
		if (fileSize <= 5 * 1024 * 1024) {
			// Files under 5MB - don't generate preview, serve original
			log.info(
				`File size ${fileSize} bytes is under threshold, no need for preview`,
			);
			await fs.copyFile(inputPath, outputPath);
			return;
		}
    if (fileSize <= 50 * 1024 * 1024) {
			// 5MB - 50MB: Light compression
			crf = 23;
			scale = "scale=1280:-2";
			trimDuration = "";
		} else if (fileSize <= 200 * 1024 * 1024) {
			// 50MB - 200MB: Medium compression
			crf = 24;
			scale = "scale=1280:-2";
			// If we have duration, limit longer videos
			trimDuration = duration && duration > 1800 ? "-t 1800" : ""; // Max 30 min
		} else if (fileSize <= 500 * 1024 * 1024) {
			// 200MB - 500MB: Heavier compression
			crf = 26;
			scale = "scale=1024:-2";
			// More aggressive trimming
			trimDuration = duration && duration > 900 ? "-t 900" : ""; // Max 15 min
		} else {
			// Over 500MB: Maximum compression
			crf = 28;
			scale = "scale=854:-2";
			// Very aggressive trimming
			trimDuration = duration && duration > 600 ? "-t 600" : ""; // Max 10 min
		}

		log.info(
			`Using settings based on size ${fileSize} bytes: crf=${crf}, scale=${scale}, trim=${trimDuration}`,
		);

		// Check file extension to determine codec
		const fileExt = path.extname(outputPath).toLowerCase();
		const isWebM = fileExt === ".webm";

		// Execute ffmpeg command with size-based settings and appropriate codec
		let command;
		if (isWebM) {
			// For WebM output, use VP9 codec and Opus audio
			command = `ffmpeg -i "${inputPath}" ${trimDuration} -vf "${scale}" -c:v libvpx-vp9 -crf ${crf} -b:v 0 -deadline good -c:a libopus -b:a 128k "${outputPath}"`;
		} else {
			// For other outputs (MP4, etc.), use H.264 codec and AAC audio
			command = `ffmpeg -i "${inputPath}" ${trimDuration} -vf "${scale}" -c:v libx264 -crf ${crf} -preset medium -c:a aac -b:a 128k "${outputPath}"`;
		}

		log.info(`Executing preview command: ${command}`);
		await execAsync(command);

		// Check the output size
		const stats = await fs.stat(outputPath);
		log.info(`Generated preview size: ${stats.size} bytes`);

		// If the preview is still too large, reduce quality further
		if (stats.size > PREVIEW_SIZE_LIMIT) {
			log.warn(
				`Preview size exceeds limit (${stats.size} bytes). Regenerating with lower quality.`,
			);

			// More aggressive settings for second pass
			const shorterTrim = duration ? `-t ${Math.min(duration, 300)}` : "-t 300"; // Max 5 minutes

			// Reencode with more aggressive settings based on file type
			let reencodeCommand;
			if (isWebM) {
				reencodeCommand = `ffmpeg -y -i "${inputPath}" ${shorterTrim} -vf "scale=640:-2" -c:v libvpx-vp9 -crf 30 -b:v 0 -deadline good -c:a libopus -b:a 64k "${outputPath}"`;
			} else {
				reencodeCommand = `ffmpeg -y -i "${inputPath}" ${shorterTrim} -vf "scale=640:-2" -c:v libx264 -crf 30 -preset medium -c:a aac -b:a 64k "${outputPath}"`;
			}

			log.info(
				`Re-executing with more aggressive settings: ${reencodeCommand}`,
			);
			await execAsync(reencodeCommand);
		}
	},

	/**
	 * Generate audio preview
	 */
	generateAudioPreview: async (
		inputPath: string,
		outputPath: string,
	): Promise<void> => {
		// For audio, create a lower-bitrate version
		const command = `ffmpeg -i "${inputPath}" -c:a aac -b:a 128k "${outputPath}"`;
		await execAsync(command);
	},

	/**
	 * Generate image preview
	 */
	generateImagePreview: async (
		inputPath: string,
		outputPath: string,
	): Promise<void> => {
		// For images, resize to a reasonable resolution
		const command = `convert "${inputPath}" -resize 1920x1080\\> "${outputPath}"`;
		try {
			await execAsync(command);
		} catch (error) {
			const ffmpegCommand = `ffmpeg -i "${inputPath}" -vf "scale='min(1920,iw):-2'" "${outputPath}"`;
			await execAsync(ffmpegCommand);
		}
	},

	/**
	 * Generate text preview
	 */
	generateTextPreview: async (
		inputPath: string,
		outputPath: string,
	): Promise<void> => {
		const fileContent = await fs.readFile(inputPath, "utf-8");
		const previewContent = fileContent.slice(0, 10240); // First 10KB
		await fs.writeFile(outputPath, previewContent);
	},

	/**
	 * Get preview info for a task
	 */
	getPreviewInfo: async (taskId: string) => {
		const [task] = await sql`
      SELECT preview_path, preview_generated, result_path
      FROM tasks 
      WHERE id = ${taskId}
    `;

		if (!task) {
			return null;
		}

		return {
			available: !!task.preview_path,
			generating: !task.preview_generated && !!task.result_path,
			path: task.preview_path,
			originalPath: task.result_path,
		};
	},
};

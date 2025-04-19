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
	shouldGeneratePreview: (mimeType: string, fileSize: number): boolean => {
		// Small files don't need previews
		if (fileSize <= SMALL_FILE_THRESHOLD) {
			return false;
		}

		// Check file type
		if (mimeType.startsWith("video/")) {
			return true;
		} else if (mimeType.startsWith("audio/")) {
			return true;
		} else if (
			mimeType.startsWith("image/") &&
			fileSize > SMALL_FILE_THRESHOLD
		) {
			return true;
		} else if (
			mimeType.startsWith("text/") &&
			fileSize > SMALL_FILE_THRESHOLD
		) {
			return true;
		}

		// Default to no preview for other types
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

			// Get file info including size and type
			const stats = await fs.stat(filePath);
			const fileSize = stats.size;

			// Get MIME type
			const { stdout: mimeType } = await execAsync(
				`file --mime-type -b "${filePath}"`,
			).catch(() => ({ stdout: "application/octet-stream" }));
			const cleanMimeType = mimeType.trim();

			// Check if we should generate a preview
			if (!previewService.shouldGeneratePreview(cleanMimeType, fileSize)) {
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

			// Generate preview based on file type
			if (cleanMimeType.startsWith("video/")) {
				await previewService.generateVideoPreview(
					filePath,
					previewPath,
					fileSize,
				);
			} else if (cleanMimeType.startsWith("audio/")) {
				await previewService.generateAudioPreview(filePath, previewPath);
			} else if (cleanMimeType.startsWith("image/")) {
				await previewService.generateImagePreview(filePath, previewPath);
			} else if (cleanMimeType.startsWith("text/")) {
				await previewService.generateTextPreview(filePath, previewPath);
			} else {
				log.info(`No preview generator for MIME type: ${cleanMimeType}`);
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
    fileSize: number
  ): Promise<void> => {
    // Determine appropriate settings based on file size
    let crf = 23; // Reasonable quality
    let scale = "scale=1280:-2"; // 720p-ish, preserves aspect ratio
    let trimDuration = "";
    
    // Get video duration
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`
      );
      const duration = parseFloat(stdout.trim());
      log.info(`Video duration: ${duration} seconds`);
      
      // Set trim duration based on file size and original duration
      if (duration > 600 && fileSize > 1 * 1024 * 1024 * 1024) { // > 10min and > 1GB
        trimDuration = "-t 300"; // Limit to 5 minutes for very large files
      } else if (duration > 1200 && fileSize > 500 * 1024 * 1024) { // > 20min and > 500MB
        trimDuration = "-t 600"; // Limit to 10 minutes for large files
      } else if (duration > 1800) { // > 30min
        trimDuration = "-t 900"; // Limit to 15 minutes for medium files
      }
      
      log.info(`Using trim setting: ${trimDuration || "No trim"}`);
    } catch (error) {
      log.warn(`Could not determine video duration: ${error}`);
      // Default trim for large files if we can't get duration
      if (fileSize > 500 * 1024 * 1024) {
        trimDuration = "-t 600"; // 10 minutes
      }
    }
    
    // Execute ffmpeg command with appropriate trimming and quality
    const command = `ffmpeg -i "${inputPath}" ${trimDuration} -vf "${scale}" -c:v libx264 -crf ${crf} -preset medium -c:a aac -b:a 128k "${outputPath}"`;
    
    log.info(`Executing preview command: ${command}`);
    await execAsync(command);
    
    // Check the output size
    const stats = await fs.stat(outputPath);
    log.info(`Generated preview size: ${stats.size} bytes`);
    
    // If the preview is still too large, reduce quality rather than re-encoding
    if (stats.size > PREVIEW_SIZE_LIMIT) {
      log.warn(`Preview size exceeds limit (${stats.size} bytes). Regenerating with lower quality.`);
      
      // Use a more aggressive approach with both trimming and quality reduction
      let shorterTrim = "";
      if (trimDuration) {
        // Cut the duration in half if we already have a trim setting
        const currentDuration = parseInt(trimDuration.replace("-t ", ""), 10);
        shorterTrim = `-t ${Math.floor(currentDuration / 2)}`;
      } else {
        // Default to 5 minutes if no trim was applied before
        shorterTrim = "-t 300";
      }
      
      const reencodeCommand = `ffmpeg -y -i "${inputPath}" ${shorterTrim} -vf "scale=854:-2" -c:v libx264 -crf 28 -preset medium -c:a aac -b:a 96k "${outputPath}"`;
      log.info(`Re-executing with more aggressive settings: ${reencodeCommand}`);
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
			// Fallback to ffmpeg if ImageMagick is not available
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
		// For text files, extract the first N lines
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

import sql from "../config/database.js";
import log from "../config/logger.js";
import path from "node:path";
import fs from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { OUTPUT_CONFIG } from "../types/index.js";
import type { ParsedCommand } from "../types/index.js";
import axios from "axios";

const execAsync = promisify(exec);
const AI_URL = process.env.AI_URL || "http://ai:5001";

export const aiService = {
	/**
	 * Process an AI task based on its type
	 */
	processAITask: async (
		taskId: string,
		commandResult: ParsedCommand,
	): Promise<void> => {
		try {
			// Update task status to processing
			await sql`UPDATE tasks SET status = 'processing' WHERE id = ${taskId}`;

			// Get file paths for all files associated with the task
			const taskFiles = await sql`
				SELECT f.id, f.file_path, f.file_name, f.mime_type
				FROM files f
				JOIN task_files tf ON f.id = tf.file_id
				WHERE tf.task_id = ${taskId}
			`;

			if (taskFiles.length === 0) {
				throw new Error("No files found for task");
			}

			// We'll use the first file as the input
			const inputFile = taskFiles[0];
			const inputFileInfo = {
				file_path: inputFile.file_path,
				file_name: inputFile.file_name,
				mime_type: inputFile.mime_type,
			};

			// Create task-specific output directory if it doesn't exist
			const outputDir = path.join(OUTPUT_CONFIG.DIR, taskId);
			await fs.mkdir(outputDir, { recursive: true });

			// Process according to AI command type
			let resultFilePath = "";

			if (commandResult.command === "transcribe") {
				resultFilePath = await processTranscription(
					commandResult,
					inputFileInfo,
					outputDir,
				);
			} else {
				throw new Error(`Unsupported AI command: ${commandResult.command}`);
			}

			// Update task as completed
			await sql`
				UPDATE tasks 
				SET status = 'completed', 
					result_path = ${resultFilePath}, 
					updated_at = NOW() 
				WHERE id = ${taskId}
			`;

			log.info(`AI Task ${taskId} completed successfully`);
		} catch (error) {
			log.error(`Error executing AI task ${taskId}:`, error);

			// Update task as failed
			await sql`
				UPDATE tasks 
				SET status = 'failed', 
					error = ${String(error)}, 
					updated_at = NOW() 
				WHERE id = ${taskId}
			`;
		}
	},
};

/**
 * Process Transcription task
 */
async function processTranscription(
	commandResult: ParsedCommand,
	inputFile: { file_path: string; file_name: string; mime_type: string },
	outputDir: string,
): Promise<string> {
	const options = commandResult.options || {};
	const language = (options.language as string) || "auto";
	const format = (options.format as string) || "txt";

	log.info(
		`Preparing for transcription: ${inputFile.file_name} with language ${language}`,
	);

	// Generate output filename for extracted audio
	const baseName = path.parse(inputFile.file_name).name;
	const audioFile = `${baseName}-audio.wav`;
	const audioPath = path.join(outputDir, audioFile);

	// Extract audio using FFmpeg
	await extractAudio(inputFile.file_path, audioPath);
	log.info(`Successfully extracted audio to ${audioPath}`);

	// Define output file path for transcription result
	const transcriptionFile = `${baseName}-transcription.${format}`;
	const resultFilePath = path.join(outputDir, transcriptionFile);

	// optionsString : "language-auto-format-txt"
	// safeFilePath	: Replace '/' with '+' in the filePath for URL safety
	const optionsString = Object.entries({ language, format }).map(
		([key, value]) => `${key}-${value}`,
	);
	const safeFilePath = audioPath.replace(/\//g, "+");

	log.info(`Sending file to AI service: transcribe with ${audioPath}`);
	try {
		// Call the external AI service for transcription
		await axios.post(`${AI_URL}/transcribe/${safeFilePath}/${optionsString}`);

		log.info(`Transcription saved at ${resultFilePath}`);

		// Clean up: Delete the temporary audio file since we don't need it anymore
		try {
			await fs.unlink(audioPath);
			log.info(`Cleaned up temporary audio file: ${audioPath}`);
		} catch (cleanupError) {
			// Don't fail the whole operation if cleanup fails
			log.warn(`Failed to clean up audio file ${audioPath}: ${cleanupError}`);
		}
	} catch (error) {
		log.error(`Failed to get transcription from AI service: ${error}`);

		// Create a placeholder file in case of error
		await fs.writeFile(
			resultFilePath,
			`Error transcribing ${inputFile.file_name}: ${error}\n\nAudio file is available at ${audioPath}`,
			"utf8",
		);

		throw new Error(`Transcription service error: ${error}`);
	}
	return resultFilePath;
}

/**
 * Extract audio from a video file using FFmpeg
 */
async function extractAudio(
	videoPath: string,
	outputPath: string,
): Promise<void> {
	const command = `ffmpeg -i "${videoPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${outputPath}"`;

	try {
		await execAsync(command);
	} catch (error) {
		log.error(`FFmpeg audio extraction failed: ${error}`);
		throw new Error("Failed to extract audio from video");
	}
}

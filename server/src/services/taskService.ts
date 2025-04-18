import { v4 as uuidv4 } from "uuid";
import { validate as validateUUID } from "uuid";
import sql from "../config/database.js";
import log from "../config/logger.js";
import { exec } from "node:child_process";
import { spawn } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs/promises";
import { OUTPUT_CONFIG } from "../types/index.js";
import type {
	CommandValidationResult,
	Task,
	TaskFile,
	TaskFilesResult,
	ListOptions,
	TaskListResult,
} from "../types/index.js";
import { eventService } from "./eventService.js";
import { getContentType } from "../utils/fileUtils.js";

const execAsync = promisify(exec);

export const taskService = {
	ensureOutputDirectory: async () => {
		try {
			await fs.mkdir(OUTPUT_CONFIG.DIR, {
				recursive: true,
				mode: OUTPUT_CONFIG.PERMISSIONS,
			});

			// Double-check permissions in case directory already existed
			await fs.chmod(OUTPUT_CONFIG.DIR, OUTPUT_CONFIG.PERMISSIONS);
		} catch (error) {
			log.error("Failed to initialize output directory:", error);
			throw new Error("Failed to initialize output directory");
		}
	},

	validateCommand: async (
		command: string,
	): Promise<CommandValidationResult> => {
		// Extract all potential UUIDs from the command
		const uuidRegex =
			/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
		const potentialFileIds = command.match(uuidRegex) || [];

		// Filter to valid UUIDs
		const fileIds = potentialFileIds.filter((id) => validateUUID(id));

		if (fileIds.length === 0) {
			return {
				isValid: false,
				fileIds: [],
				error: "No valid file IDs found in command",
			};
		}

		// Check if all files exist
		const existingFiles = await sql`
			SELECT id FROM files WHERE id IN ${sql(fileIds.map((id) => id))}
		`;

		const foundIds = existingFiles.map((file) => file.id);
		const missingIds = fileIds.filter((id) => !foundIds.includes(id));

		if (missingIds.length > 0) {
			return {
				isValid: false,
				fileIds,
				error: `Files not found: ${missingIds.join(", ")}`,
			};
		}

		return { isValid: true, fileIds };
	},

	createTask: async (
		command: string,
		fileIds: string[],
		userId: number,
	): Promise<Task> => {
		const taskId = uuidv4();

		// Create task record
		const [row] = await sql`
			INSERT INTO tasks (id, command, status, user_id)
			VALUES (${taskId}, ${command}, 'pending', ${userId})
			RETURNING *
		`;

		// Link files to task
		if (fileIds.length > 0) {
			const values = fileIds.map((fileId) => ({
				task_id: taskId,
				file_id: fileId,
			}));
			await sql`INSERT INTO task_files ${sql(values)}`;
		}

		// Map the database row to Task type
		const task: Task = {
			id: row.id,
			command: row.command,
			status: row.status,
			created_at: row.created_at,
			updated_at: row.updated_at,
			result_path: row.result_path,
			error: row.error,
			user_id: row.user_id,
		};

		return task;
	},
	executeCommand: async (taskId: string): Promise<void> => {
		try {
			// Ensure the output directory exists
			await taskService.ensureOutputDirectory();

			// await sql`UPDATE tasks SET status = 'processing', progress = 0 WHERE id = ${taskId}`;
			await sql`UPDATE tasks SET status = 'processing' WHERE id = ${taskId}`;

			// Get task details
			const [task] = await sql`SELECT * FROM tasks WHERE id = ${taskId}`;
			if (!task) {
				throw new Error("Task not found");
			}

			// Get file paths for all files associated with the task
			const taskFiles = await sql`
      SELECT f.id, f.file_path 
      FROM files f
      JOIN task_files tf ON f.id = tf.file_id
      WHERE tf.task_id = ${taskId}
    `;

			// Create task-specific output directory if it doesn't exist
			const outputDir = path.join(OUTPUT_CONFIG.DIR, taskId);
			await fs.mkdir(outputDir, { recursive: true });

			// Prepare command by replacing file IDs with absolute file paths
			let processedCommand = task.command;
			for (const file of taskFiles) {
				// Use absolute paths instead of relative paths
				const absoluteFilePath = path.resolve(file.file_path);
				processedCommand = processedCommand.replace(
					new RegExp(file.id, "g"),
					absoluteFilePath,
				);
			}

			// Get the duration of the input file for progress calculation
			let duration = null;

			if (taskFiles.length > 0) {
				try {
					const { stdout } = await execAsync(
						`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${taskFiles[0].file_path}"`,
					);
					duration = Number.parseFloat(stdout.trim());
					log.info(`Got duration for task ${taskId}: ${duration} seconds`);
				} catch (error) {
					log.warn(`Could not determine duration for task ${taskId}: ${error}`);
					// Continue execution even if we can't get the duration
				}
			}

			// Execute FFmpeg command using spawn to get real-time output
			log.info(`Executing command for task ${taskId}: ${processedCommand}`);

			// Create child process
			const process = spawn(
				"sh",
				["-c", `cd "${outputDir}" && ${processedCommand}`],
				{
					stdio: ["ignore", "pipe", "pipe"],
				},
			);

			// Progress parsing regex
			const progressRegex = /time=(\d+:\d+:\d+.\d+)/;

			// Listen for stdout data
			process.stdout.on("data", (data) => {
				const output = data.toString();
				log.debug(`FFmpeg stdout for task ${taskId}: ${output}`);
			});

			// Listen for stderr data (FFmpeg outputs progress to stderr)
			process.stderr.on("data", (data) => {
				const output = data.toString();
				// log.debug(`FFmpeg stderr for task ${taskId}: ${output}`);

				// Parse progress if we have duration information
				if (duration) {
					const match = progressRegex.exec(output);
					if (match) {
						const timeStr = match[1];
						log.info(`Progress match found for task ${taskId}: ${timeStr}`);
						// Convert HH:MM:SS.MS to seconds
						const timeParts = timeStr.split(":");
						const seconds =
							Number.parseFloat(timeParts[0]) * 3600 +
							Number.parseFloat(timeParts[1]) * 60 +
							Number.parseFloat(timeParts[2]);

						const progress = Math.min(
							1,
							Math.round((seconds / duration) * 100) / 100,
						);

						eventService.emitTaskProgress(taskId, {
							taskId,
							progress,
							currentTime: seconds,
							totalDuration: duration,
						});
						log.info(
							`Progress event emitted for task ${taskId}: ${progress * 100}%`,
						);
					}
				}
			});

			// Wait for process to complete
			return new Promise((resolve, reject) => {
				process.on("close", async (code) => {
					try {
						if (code === 0) {
							// Find output file(s)
							const outputFiles = await fs.readdir(outputDir);
							const resultPath =
								outputFiles.length > 0
									? path.join(outputDir, outputFiles[0])
									: null;

							// Update task as completed
							await sql`
              UPDATE tasks 
              SET status = 'completed', 
                  result_path = ${resultPath}, 
                  updated_at = NOW() 
              WHERE id = ${taskId}
            `;

							// Emit completion event
							eventService.emitTaskComplete(taskId, {
								taskId,
								status: "completed",
								resultPath,
								files: outputFiles.map((file) => ({
									filename: file,
									path: path.join(outputDir, file),
								})),
							});

							log.info(`Task ${taskId} completed successfully`);
							resolve();
						} else {
							const error = `Process exited with code ${code}`;
							log.error(`Error executing task ${taskId}: ${error}`);

							// Update task as failed
							await sql`
              UPDATE tasks 
              SET status = 'failed', 
                  error = ${error}, 
                  updated_at = NOW() 
              WHERE id = ${taskId}
            `;

							// Emit failure event
							eventService.emitTaskFailed(taskId, error);

							reject(new Error(error));
						}
					} catch (processError) {
						log.error(
							`Error handling task ${taskId} completion: ${processError}`,
						);
						reject(processError);
					}
				});

				// Handle process errors
				process.on("error", async (err) => {
					const errorMessage = `Process error: ${err.message}`;
					log.error(`Error executing task ${taskId}: ${errorMessage}`);

					// Update task as failed
					await sql`
          UPDATE tasks 
          SET status = 'failed', 
              error = ${errorMessage}, 
              updated_at = NOW() 
          WHERE id = ${taskId}
        `;

					// Emit failure event
					eventService.emitTaskFailed(taskId, errorMessage);

					reject(err);
				});
			});
		} catch (error) {
			log.error(`Error executing task ${taskId}:`, error);

			// Update task as failed
			await sql`
      UPDATE tasks 
      SET status = 'failed', 
          error = ${String(error)}, 
          updated_at = NOW() 
      WHERE id = ${taskId}
    `;

			// Emit failure event
			eventService.emitTaskFailed(taskId, String(error));

			throw error;
		}
	},

	getTask: async (taskId: string): Promise<Task | null> => {
		const [row] = await sql`SELECT * FROM tasks WHERE id = ${taskId}`;
		if (!row) return null;

		// Map the database row to Task type
		const task: Task = {
			id: row.id,
			command: row.command,
			status: row.status,
			created_at: row.created_at,
			updated_at: row.updated_at,
			result_path: row.result_path,
			error: row.error,
			user_id: row.user_id,
		};

		return task;
	},
	getTaskFiles: async (taskId: string): Promise<TaskFilesResult> => {
		const outputDir = path.join(OUTPUT_CONFIG.DIR, taskId);

		try {
			const files = await fs.readdir(outputDir);

			if (files.length === 0) {
				return { files: [], single: null };
			}

			// Get task to retrieve user_id
			const [task] = await sql`SELECT user_id FROM tasks WHERE id = ${taskId}`;
			const userId = task ? task.user_id : 0;

			// Get details for each file
			const fileDetails: TaskFile[] = await Promise.all(
				files.map(async (file) => {
					const filePath = path.join(outputDir, file);
					const stats = await fs.stat(filePath);

					return {
						filename: file,
						path: filePath,
						size: stats.size,
						mime_type: getContentType(path.extname(file)),
						user_id: userId,
					};
				}),
			);

			return {
				files: fileDetails,
				single: fileDetails.length === 1 ? fileDetails[0] : null,
			};
		} catch (error: unknown) {
			log.warn(`Error accessing output directory for task ${taskId}:`, error);
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			return { files: [], single: null, error: errorMessage };
		}
	},

	getTaskFile: async (taskId: string, filename: string): Promise<TaskFile> => {
		const filePath = path.join(OUTPUT_CONFIG.DIR, taskId, filename);

		try {
			const stats = await fs.stat(filePath);

			// Get task to retrieve user_id
			const [task] = await sql`SELECT user_id FROM tasks WHERE id = ${taskId}`;
			const userId = task ? task.user_id : 0;

			return {
				filename,
				path: filePath,
				size: stats.size,
				mime_type: getContentType(path.extname(filename)),
				user_id: userId,
			};
		} catch (error) {
			log.warn(`Error accessing file ${filename} for task ${taskId}:`, error);
			throw new Error(`File not found: ${filename}`);
		}
	},

	deleteTask: async (taskId: string): Promise<boolean> => {
		if (!validateUUID(taskId)) {
			throw new Error("Invalid UUID");
		}

		try {
			// check if task exists and get its details
			const [task] = await sql`
				SELECT id, result_path 
				FROM tasks 
				WHERE id = ${taskId}
			`;

			if (!task) {
				return false;
			}

			// Delete task output directory if exists
			const outputDir = path.join(OUTPUT_CONFIG.DIR, taskId);
			try {
				await fs.rm(outputDir, { recursive: true, force: true });
			} catch (error) {
				log.warn(`Error deleting output directory for task ${taskId}:`, error);
			}

			// Delete related records and task from database in a transaction
			await sql.begin(async (sql) => {
				// delete task_files entries
				await sql`
					DELETE FROM task_files 
					WHERE task_id = ${taskId}
				`;
				// delete the task itself
				await sql`
					DELETE FROM tasks 
					WHERE id = ${taskId}
				`;
			});

			return true;
		} catch (error) {
			log.error(`Error deleting task ${taskId}:`, error);
			throw new Error("Failed to delete task");
		}
	},
	listTasks: async (options: ListOptions): Promise<TaskListResult> => {
		const { limit, cursor, userId } = options;

		// Build the base query
		let baseQuery = sql`
			SELECT 
				t.id, 
				t.command, 
				t.status, 
				t.created_at, 
				t.updated_at, 
				t.result_path, 
				t.error,
				t.user_id,
				array_agg(tf.file_id) as file_ids
			FROM tasks t
			LEFT JOIN task_files tf ON t.id = tf.task_id
		`;

		// Add user filtering if userId is provided
		if (userId) {
			if (cursor) {
				baseQuery = sql`${baseQuery} 
					WHERE t.user_id = ${userId} AND (t.created_at, t.id) < (${cursor.timestamp}, ${cursor.id})
					GROUP BY t.id
					ORDER BY t.created_at DESC, t.id DESC
					LIMIT ${limit + 1}`;
			} else {
				baseQuery = sql`${baseQuery} 
					WHERE t.user_id = ${userId}
					GROUP BY t.id
					ORDER BY t.created_at DESC, t.id DESC
					LIMIT ${limit + 1}`;
			}
		} else if (cursor) {
			baseQuery = sql`${baseQuery} 
				WHERE (t.created_at, t.id) < (${cursor.timestamp}, ${cursor.id})
				GROUP BY t.id
				ORDER BY t.created_at DESC, t.id DESC
				LIMIT ${limit + 1}`;
		} else {
			baseQuery = sql`${baseQuery} 
				GROUP BY t.id
				ORDER BY t.created_at DESC, t.id DESC
				LIMIT ${limit + 1}`;
		}

		const rows = await baseQuery;

		// Check if we have more items
		const hasMore = rows.length > limit;
		const items = hasMore ? rows.slice(0, -1) : rows;

		// Generate next cursor if we have more items
		let nextCursor = null;
		if (hasMore && items.length > 0) {
			const lastItem = items[items.length - 1];
			const cursorData = {
				timestamp: lastItem.created_at.toISOString(),
				id: lastItem.id,
			};
			nextCursor = Buffer.from(JSON.stringify(cursorData)).toString("base64");
		}

		// Map rows to Task objects
		const tasks = items.map((row) => ({
			id: row.id,
			command: row.command,
			status: row.status,
			created_at: row.created_at,
			updated_at: row.updated_at,
			result_path: row.result_path,
			error: row.error,
			user_id: row.user_id,
			fileIds: row.file_ids.filter((id: string | null) => id), // Filter out null values
		}));

		return {
			tasks,
			nextCursor,
			hasMore,
		};
	},
};

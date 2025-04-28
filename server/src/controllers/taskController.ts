import type { Context } from "hono";
import { taskService } from "../services/taskService.js";
import { aiService } from "../services/aiService.js";
import {
	parseCommand,
	getBuiltinCommands,
	getBuiltinCommandDetails,
} from "../services/commands/commandParser.js";
import log from "../config/logger.js";
import type { TaskFileDownloadInfo } from "../types/index.js";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../types/index.js";
import { validate as validateUUID } from "uuid";
import { eventService } from "../services/eventService.js";
import { streamSSE } from "hono/streaming";
import fs from "node:fs/promises";
import path from "node:path";
import { getContentType } from "../utils/fileUtils.js";

export const taskController = {
	submitCommand: async (c: Context) => {
		try {
			const body = await c.req.json();
			// Get user from context after authentication middleware
			const userId = c.get("user").userId;

			let commandResult;

			if (typeof body.command === "string") {
				// Parse the command string to determine type and structure
				commandResult = parseCommand(body.command);
			} else {
				const { type = "ffmpeg", command } = body;
				commandResult = {
					type,
					command,
				};
			}

			// Handle parsing errors
			if (commandResult.error) {
				return c.json({ error: commandResult.error }, 400);
			}

			// Special handling for AI commands
			if (commandResult.type === "ai") {
				return await handleAICommand(c, commandResult);
			}

			// Get the actual command to execute for non-AI commands
			let processedCommand = commandResult.command;

			if (
				commandResult.type === "builtin" &&
				commandResult.transformedCommand
			) {
				processedCommand = commandResult.transformedCommand;
			}

			// Validate command and extract file IDs
			const validation = await taskService.validateCommand(processedCommand);

			if (!validation.isValid) {
				return c.json({ error: validation.error }, 400);
			}

			// Create task with user ID
			const task = await taskService.createTask(
				processedCommand,
				validation.fileIds,
				userId,
			);

			// Start processing in background
			taskService.executeCommand(task.id).catch((err) => {
				log.error(`Background task execution failed for ${task.id}:`, err);
			});

			return c.json(
				{
					success: true,
					task: {
						id: task.id,
						status: task.status,
						created_at: task.created_at,
					},
				},
				201,
			);
		} catch (error) {
			log.error("Failed to submit command:", error);
			return c.json({ error: "Failed to process command" }, 500);
		}
	},

	getTaskStatus: async (c: Context) => {
		try {
			const taskId = c.req.param("id");

			if (!validateUUID(taskId)) {
				return c.json({ error: "Invalid task ID" }, 400);
			}

			const task = await taskService.getTask(taskId);

			if (!task) {
				return c.json({ error: "Task not found" }, 404);
			}

			return c.json({
				success: true,
				task: {
					id: task.id,
					status: task.status,
					created_at: task.created_at,
					updated_at: task.updated_at,
					result_path: task.result_path,
					result_size: task.result_size,
					error: task.error,
				},
			});
		} catch (error) {
			log.error("Failed to get task status:", error);
			return c.json({ error: "Failed to retrieve task status" }, 500);
		}
	},

	getBuiltinCommands: async (c: Context) => {
		try {
			const commandName = c.req.query("name");

			// If command name is provided, return details for that command
			if (commandName) {
				const commandDetails = getBuiltinCommandDetails(commandName);
				if (!commandDetails) {
					return c.json({ error: "Command not found" }, 404);
				}

				return c.json({
					success: true,
					command: commandDetails,
				});
			}

			// Otherwise return all commands
			const commands = getBuiltinCommands();
			return c.json({
				success: true,
				commands,
			});
		} catch (error) {
			log.error("Failed to get builtin commands:", error);
			return c.json({ error: "Failed to retrieve builtin commands" }, 500);
		}
	},
	getTask: async (c: Context): Promise<Response> => {
		const taskId = c.req.param("id");

		if (!validateUUID(taskId)) {
			return c.json({ error: "Invalid task ID format" }, 400);
		}

		try {
			// Get task details
			const task = await taskService.getTask(taskId);

			if (!task) {
				return c.json({ error: "Task not found" }, 404);
			}

			// If task isn't completed, just return task info
			if (task.status !== "completed") {
				return c.json({ task });
			}

			// For completed tasks, get output files
			const fileInfo = await taskService.getTaskFiles(taskId);

			// Handle errors accessing files
			if (fileInfo.error) {
				task.error = fileInfo.error;
				return c.json({ task });
			}

			// No files case
			if (fileInfo.files.length === 0) {
				task.files = [];
				return c.json({ task });
			}

			// Single file case - direct download
			if (fileInfo.single) {
				const file = fileInfo.single;

				// Set download headers
				c.header(
					"Content-Disposition",
					`attachment; filename="${file.filename}"`,
				);
				c.header("Content-Length", file.size.toString());
				c.header("Content-Type", file.mime_type);

				// Stream the file
				const fileBuffer = await Bun.file(file.path).arrayBuffer();
				return c.body(fileBuffer);
			}

			// Multiple files case - return metadata with links temporary solution for now
			const filesWithUrls: TaskFileDownloadInfo[] = fileInfo.files.map(
				(file) => ({
					filename: file.filename,
					download_url: `/tasks/${taskId}/files/${encodeURIComponent(file.filename)}`,
					size: file.size,
					mime_type: file.mime_type,
				}),
			);

			task.files = filesWithUrls;
			return c.json({ task });
		} catch (error: unknown) {
			log.error("Error in getTask:", error);
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			return c.json({ error: `Server error: ${errorMessage}` }, 500);
		}
	},

	delete: async (c: Context): Promise<Response> => {
		const taskId = c.req.param("id");

		if (!validateUUID(taskId)) {
			log.warn("Delete task attempted with invalid UUID", { taskId });
			return c.json({ error: "Invalid task ID format" }, 400);
		}

		try {
			const deleted = await taskService.deleteTask(taskId);

			if (!deleted) {
				log.warn("Task not found for deletion", { taskId });
				return c.json({ error: "Task not found" }, 404);
			}

			log.info("Task deleted successfully", { taskId });
			return c.json({ success: true }, 200);
		} catch (error) {
			log.error(`Failed to delete task: ${error}`, {
				taskId,
				error: String(error),
			});
			return c.json({ error: "Failed to delete task" }, 500);
		}
	},
	listTasks: async (c: Context) => {
		try {
			const { limit, cursor } = c.req.query();
			// Get user from context after authentication middleware
			const userId = c.get("user").userId;

			// Parse and validate limit
			const parseLimit = Number.parseInt(limit || String(DEFAULT_PAGE_SIZE));
			const validLimit = Math.min(Math.max(1, parseLimit), MAX_PAGE_SIZE);

			// Parse cursor if provided
			let cursorData;
			if (cursor) {
				try {
					cursorData = JSON.parse(Buffer.from(cursor, "base64").toString());
				} catch (e) {
					return c.json({ error: "Invalid cursor" }, 400);
				}
			}

			const result = await taskService.listTasks({
				limit: validLimit,
				cursor: cursorData,
				userId: userId,
			});

			return c.json({
				success: true,
				data: result.tasks,
				pagination: {
					next_cursor: result.nextCursor,
					has_more: result.hasMore,
				},
			});
		} catch (error) {
			log.error("Failed to list tasks", { error: String(error) });
			return c.json({ error: "Failed to fetch tasks" }, 500);
		}
	},
	streamTaskProgress: async (c: Context) => {
		const taskId = c.req.param("id");

		if (!validateUUID(taskId)) {
			return c.json({ error: "Invalid task ID" }, 400);
		}

		const task = await taskService.getTask(taskId);
		if (!task) {
			return c.json({ error: "Task not found" }, 404);
		}

		c.header("Content-Type", "text/event-stream");
		c.header("Cache-Control", "no-cache");
		c.header("Connection", "keep-alive");
		c.header("Access-Control-Allow-Origin", "*");

		if (task.status === "completed" || task.status === "failed") {
			return streamSSE(c, async (stream) => {
				await stream.writeSSE({
					event: "progress",
					data: "1",
				});
				stream.close();
			});
		}

		return streamSSE(c, async (stream) => {
			let closed = false;
			let resolveKeeper!: () => void;
			const keepAlive = new Promise<void>((resolve) => {
				resolveKeeper = resolve;
			});

			await stream.writeSSE({
				event: "heartbeat",
				data: String(Date.now()),
			});

			const heartbeat = setInterval(() => {
				if (!closed) {
					stream.writeSSE({ event: "heartbeat", data: String(Date.now()) });
				}
			}, 5000);

			const cleanup = () => {
				if (!closed) {
					closed = true;
					clearInterval(heartbeat);
					progressCleanup();
					completeCleanup();
					failedCleanup();
					resolveKeeper();
				}
			};

			stream.onAbort = cleanup;

			const progressCleanup = eventService.onTaskEvent(
				taskId,
				"progress",
				async (data: any) => {
					if (!closed && typeof data?.progress === "number") {
						await stream.writeSSE({
							event: "progress",
							data: String(data.progress),
						});
					}
				},
			);

			const handleTerminalEvent = async () => {
				if (!closed) {
					await stream.writeSSE({
						event: "progress", // frontend will check task status again
						data: "1", // when task progress reach 1
					});
					cleanup();
					stream.close();
				}
			};

			const completeCleanup = eventService.onTaskEvent(taskId, "complete", () =>
				handleTerminalEvent(),
			);

			const failedCleanup = eventService.onTaskEvent(taskId, "failed", () =>
				handleTerminalEvent(),
			);

			await keepAlive;
		});
	},
};

/**
 * Helper function to handle AI command submission
 */
async function handleAICommand(
	c: Context,
	commandResult: any,
): Promise<Response> {
	try {
		// Get user from context after authentication middleware
		const userId = c.get("user").userId;

		// Validate that file exists
		const fileId = commandResult.input;
		const validation = await taskService.validateCommand(fileId);

		if (!validation.isValid) {
			return c.json({ error: validation.error }, 400);
		}

		// Create a task record with original command
		const originalCommand = `/ai-${commandResult.command} ${fileId}`;
		const task = await taskService.createTask(
			originalCommand,
			validation.fileIds,
			userId,
		);

		// Start AI processing in background
		aiService.processAITask(task.id, commandResult).catch((err) => {
			log.error(`Background AI task execution failed for ${task.id}:`, err);
		});

		return c.json(
			{
				success: true,
				task: {
					id: task.id,
					status: task.status,
					created_at: task.created_at,
				},
			},
			201,
		);
	} catch (error) {
		log.error("Failed to process AI command:", error);
		return c.json({ error: "Failed to process AI command" }, 500);
	}
}

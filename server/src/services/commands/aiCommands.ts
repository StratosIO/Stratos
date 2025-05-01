import type { AICommandDefinition } from "../../types/index.js";

/**
 * Definitions for all AI commands
 */
export const AI_COMMANDS: Record<string, AICommandDefinition> = {
	transcribe: {
		name: "transcribe",
		description: "Transcribe audio from a video or audio file to text",
		options: [
			{
				name: "language",
				description: "Source language (auto for automatic detection)",
				type: "string",
				default: "auto",
			},
			{
				name: "format",
				description: "Output format (txt, srt, vtt)",
				type: "string",
				default: "txt",
			},
		],
	},
	slowmotion: {
		name: "slowmotion",
		description: "Create a slow motion version of a video",
		options: [
			{
				name: "speed",
				description: "Speed factor (0.1 to 0.5, where 0.5 is half speed)",
				type: "number",
				default: 0.5,
			},
		],
	},
	fpsboost: {
		name: "fpsboost",
		description: "Increase the frame rate of a video",
		options: [
			{
				name: "factor",
				description: "Frame rate increase factor (2 for double the fps)",
				type: "number",
				default: 2,
			},
		],
	},
	"subtitle": {
		name: "subtitle",
		description: "Transcribe and apply subtitles to a video file",
		options: [
			{
				name: "language",
				description: "Source language (auto for automatic detection)",
				type: "string",
				default: "auto",
			},
			{
				name: "format",
				description: "Output format (mp4, mov, webm)",
				type: "string",
				default: "mp4",
			},
		],
	},
};

/**
 * Get all available AI commands
 */
export function getAICommands() {
	return Object.values(AI_COMMANDS).map((cmd) => ({
		name: cmd.name,
		description: cmd.description,
		options: cmd.options,
	}));
}

/**
 * Get details for a specific AI command
 */
export function getAICommandDetails(commandName: string) {
	if (!commandName) return null;

	const command = AI_COMMANDS[commandName];
	if (!command) return null;

	return {
		name: command.name,
		description: command.description,
		options: command.options,
	};
}

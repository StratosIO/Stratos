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
	slowmo: {
		name: "slowmo",
		description: "Create a slow motion version of a video",
		options: [
			{
				name: "speed",
				description: "Speed factor (0.1 to 1.0, where 0.5 is half speed)",
				type: "number",
				default: 0.5,
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

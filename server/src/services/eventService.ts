import EventEmitter from "node:events";

const eventEmitter = new EventEmitter();

export const eventService = {
	// Emit progress update
	emitTaskProgress: (taskId: string, data: any) => {
		eventEmitter.emit(`task:${taskId}:progress`, data);
	},

	// Emit task completion
	emitTaskComplete: (taskId: string, data: any) => {
		eventEmitter.emit(`task:${taskId}:complete`, data);
	},

	// Emit task failure
	emitTaskFailed: (taskId: string, error: any) => {
		eventEmitter.emit(`task:${taskId}:failed`, error);
	},

	// Listen for task events
	onTaskEvent: (
		taskId: string,
		event: string,
		listener: (data: any) => void,
	) => {
		const eventName = `task:${taskId}:${event}`;
		eventEmitter.on(eventName, listener);
		return () => eventEmitter.off(eventName, listener);
	},
};

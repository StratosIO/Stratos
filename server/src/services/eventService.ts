import EventEmitter from "node:events";
import type {
	TaskProgressEvent,
	TaskCompleteEvent,
	TaskErrorEvent,
	TaskEventType,
} from "../types/index.js";

const eventEmitter = new EventEmitter();

// Type for the event listener function
type TaskEventListener<T> = (data: T) => void;

export const eventService = {
	// Emit progress update
	emitTaskProgress: (taskId: string, data: TaskProgressEvent) => {
		eventEmitter.emit(`task:${taskId}:progress`, data);
	},

	// Emit task completion
	emitTaskComplete: (taskId: string, data: TaskCompleteEvent) => {
		eventEmitter.emit(`task:${taskId}:complete`, data);
	},

	// Emit task failure
	emitTaskFailed: (taskId: string, error: string | TaskErrorEvent) => {
		eventEmitter.emit(`task:${taskId}:failed`, error);
	},

	// Listen for task events
	onTaskEvent: <
		T extends TaskProgressEvent | TaskCompleteEvent | TaskErrorEvent | string,
	>(
		taskId: string,
		event: TaskEventType,
		listener: TaskEventListener<T>,
	) => {
		const eventName = `task:${taskId}:${event}`;
		eventEmitter.on(eventName, listener as (data: unknown) => void);
		return () =>
			eventEmitter.off(eventName, listener as (data: unknown) => void);
	},
};

import log from "../config/logger.js";
import { taskService } from "./taskService.js";

const MAX_CONCURRENT_TASKS = Number(process.env.MAX_CONCURRENT_TASKS || "3");

class TaskQueue {
  private queue: string[] = [];
  private running: Set<string> = new Set();
  private static instance: TaskQueue;

  private constructor() {
    log.info(`Task Queue initialized with max ${MAX_CONCURRENT_TASKS} concurrent tasks`);
  }

  public static getInstance(): TaskQueue {
    if (!TaskQueue.instance) {
      TaskQueue.instance = new TaskQueue();
    }
    return TaskQueue.instance;
  }

  public addTask(taskId: string): void {
    this.queue.push(taskId);
    log.info(`Task ${taskId} added to queue. Queue stats: ${this.getStatsString()}`);
    this.processQueue();
  }

  public removeTask(taskId: string): void {
    this.running.delete(taskId);
    log.info(`Task ${taskId} finished execution. Queue stats: ${this.getStatsString()}`);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    // If we can run more tasks and there are tasks in the queue
    if (this.running.size < MAX_CONCURRENT_TASKS && this.queue.length > 0) {
      const availableSlots = MAX_CONCURRENT_TASKS - this.running.size;
      const tasksToStart = Math.min(availableSlots, this.queue.length);
      
      log.info(`Processing queue: starting ${tasksToStart} tasks, ${this.queue.length - tasksToStart} will remain queued`);
      
      for (let i = 0; i < tasksToStart; i++) {
        const taskId = this.queue.shift();
        if (taskId === undefined) {
            log.warn('Queue unexpectedly empty during processing');
            break;
        }

        this.running.add(taskId);
        
        log.info(`Starting task ${taskId}. Queue stats: ${this.getStatsString()}`);
        
        taskService.executeCommand(taskId)
          .then(() => {
            log.info(`Task ${taskId} completed successfully`);
          })
          .catch(err => {
            log.error(`Task ${taskId} execution failed: ${err.message || String(err)}`);
          })
          .finally(() => {
            this.removeTask(taskId);
          });
      }
    } else if (this.queue.length > 0) {
      log.info(`Queue processing deferred: ${this.running.size}/${MAX_CONCURRENT_TASKS} tasks running, ${this.queue.length} tasks waiting`);
    }
  }

  private getStatsString(): string {
    return `[Running: ${this.running.size}/${MAX_CONCURRENT_TASKS}, Queued: ${this.queue.length}]`;
  }

  public getStats(): { running: number; maxConcurrent: number; queued: number; runningTasks: string[] } {
    return {
      running: this.running.size,
      maxConcurrent: MAX_CONCURRENT_TASKS,
      queued: this.queue.length,
      runningTasks: Array.from(this.running)
    };
  }
}

export const taskQueue = TaskQueue.getInstance();
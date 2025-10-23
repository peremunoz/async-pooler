import type { RetryStrategy } from "./RetryStrategy";
import type { Task } from "./Task";

export interface PoolOptions {
	retryStrategy?: RetryStrategy;
	onProgress?: (completed: number, total: number) => void;
}

/**
 * Controls the execution of asynchronous tasks.
 *
 * @example Simple usage
 * ```ts
 * const pool = new AsyncPool()
 * pool.add(new Task('task1', async () => { ... }))
 * pool.add(new Task('task2', async () => { ... }))
 * const results = await pool.runAll()
 * ```
 *
 * @example With retry strategy and progress callback
 * ```ts
 * const pool = new AsyncPool(3, {
 *   retryStrategy: new ExponentialBackoffStrategy(5, 1000),
 *   onProgress: (completed, total) => {
 *     console.log(`Completed ${completed} of ${total} tasks`)
 *   }
 * })
 * ```
 */
export class AsyncPool {
	private queue: Task<unknown>[] = [];
	private active = 0;
	private completed = 0;
	private results: unknown[] = [];

	/**
	 * Creates an instance of AsyncPool.
	 *
	 * @param concurrency - Maximum number of concurrent tasks.
	 * @param options - Optional configuration options for retries and progress
	 */
	constructor(
		private concurrency: number = 0,
		private options?: PoolOptions,
	) {}

	/**
	 * Adds a new task to the execution queue.
	 *
	 * @typeParam T - The type of the task result.
	 * @param task - The task to be added to the pool.
	 */
	add<T>(task: Task<T>): void {
		this.queue.push(task);
	}

	/**
	 * Runs all tasks in the pool respecting concurrency and retry strategies.
	 *
	 * @returns A promise that resolves to an array of results from the tasks.
	 */
	async runAll(): Promise<unknown[]> {
		return new Promise((resolve) => {
			const runNext = async () => {
				if (this.queue.length === 0 && this.active === 0) {
					return resolve(this.results);
				}

				while (this.active < this.concurrency && this.queue.length) {
					const task = this.queue.shift();
					if (!task) break;
					this.runTask(task).finally(() => runNext());
				}
			};

			runNext();
		});
	}

	/**
	 * Internal task runner with retry logic.
	 *
	 * @internal
	 */
	private async runTask<T>(task: Task<T>) {
		this.active++;
		let attempt = 0;

		const retry = async (): Promise<T> => {
			try {
				const result = await task.run();
				this.results.push(result);
				return result;
			} catch (err) {
				const retryStrategy = this.options?.retryStrategy;
				if (retryStrategy?.shouldRetry(err, attempt)) {
					const delay = retryStrategy.getDelay(attempt);
					attempt++;
					await new Promise((r) => setTimeout(r, delay));
					return retry();
				} else {
					this.results.push(err);
					throw err;
				}
			}
		};

		try {
			await retry();
		} finally {
			this.active--;
			this.completed++;
			this.options?.onProgress?.(
				this.completed,
				this.completed + this.queue.length,
			);
		}
	}
}

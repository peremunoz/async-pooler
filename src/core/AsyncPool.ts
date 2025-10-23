import { isRetryable } from "./Retryable";
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
		private readonly concurrency: number = -1,
		private readonly options?: PoolOptions,
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
		if (this.concurrency <= 0) {
			// No concurrency limit, run all tasks in parallel
			const executions = this.queue.map((task) => this.runTask(task));
			await Promise.all(executions);
			return this.results;
		}
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
	 * Internal task runner that manages active count and progress.
	 *
	 * @internal
	 */
	private async runTask<T>(task: Task<T>): Promise<void> {
		this.active++;

		const globalStrategy = this.options?.retryStrategy;

		// If the task has its own retry mechanism, just run it
		if (isRetryable(task)) {
			await this.execute(task);
		} else {
			// Otherwise, apply the global pool strategy
			await this.runWithGlobalRetry(task, globalStrategy);
		}

		this.active--;
		this.completed++;
		this.options?.onProgress?.(
			this.completed,
			this.completed + this.queue.length,
		);
	}

	/**
	 * Executes a task without any retry logic.
	 *
	 * @internal
	 */
	private async execute<T>(task: Task<T>): Promise<void> {
		try {
			const result = await task.run();
			this.results.push(result);
		} catch (err) {
			this.results.push(err);
		}
	}

	/**
	 * Executes a task with the provided global retry strategy.
	 *
	 * @internal
	 */
	private async runWithGlobalRetry<T>(
		task: Task<T>,
		retryStrategy?: RetryStrategy,
	): Promise<void> {
		let attempt = 0;
		const exec = async (): Promise<void> => {
			try {
				const result = await task.run();
				this.results.push(result);
			} catch (err) {
				if (retryStrategy?.shouldRetry(err, attempt)) {
					const delay = retryStrategy.getDelay(attempt);
					attempt++;
					await new Promise((r) => setTimeout(r, delay));
					return exec();
				}
				this.results.push(err);
			}
		};
		await exec();
	}
}

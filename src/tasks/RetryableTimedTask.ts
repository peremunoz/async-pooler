import type { Retryable } from "../core/Retryable";
import type { RetryStrategy } from "../core/RetryStrategy";
import { TimedTask } from "./TimedTask";

/**
 * A task that supports both retry and timeout features.
 */
export class RetryableTimedTask<T> extends TimedTask<T> implements Retryable {
	/**
	 * Creates a new RetryableTimedTask.
	 * @param id - Unique identifier for the task.
	 * @param executor - The task executor function.
	 * @param timeoutMs - The timeout duration in milliseconds.
	 * @param retryStrategy - The retry strategy to use for this task.
	 */
	constructor(
		id: string,
		executor: () => Promise<T>,
		timeoutMs: number,
		private readonly retryStrategy: RetryStrategy,
	) {
		super(id, executor, timeoutMs);
	}

	hasOwnRetryStrategy(): boolean {
		return true;
	}

	getRetryStrategy(): RetryStrategy {
		return this.retryStrategy;
	}

	override async run(): Promise<T> {
		let attempt = 0;
		const exec = async (): Promise<T> => {
			try {
				return await super.run();
			} catch (err) {
				if (this.retryStrategy.shouldRetry(err, attempt)) {
					const delay = this.retryStrategy.getDelay(attempt);
					attempt++;
					await new Promise((r) => setTimeout(r, delay));
					return exec();
				}
				throw err;
			}
		};
		return exec();
	}
}

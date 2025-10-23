import type { Retryable } from "../core/Retryable";
import type { RetryStrategy } from "../core/RetryStrategy";
import { Task } from "../core/Task";

/**
 * A task that can automatically retry on failure.
 */
export class RetryableTask<T> extends Task<T> implements Retryable {
	/**
	 * Creates a new RetryableTask.
	 * @param id - The task ID.
	 * @param executor - The task executor function.
	 * @param retryStrategy - The retry strategy to use for this task.
	 */
	constructor(
		id: string,
		executor: () => Promise<T>,
		private readonly retryStrategy: RetryStrategy,
	) {
		super(id, executor);
	}

	hasOwnRetryStrategy(): boolean {
		return true;
	}

	getRetryStrategy(): RetryStrategy | undefined {
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

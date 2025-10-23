import type { RetryStrategy } from "..";

/**
 * Implements an exponential backoff retry strategy.
 */
export class ExponentialBackoffStrategy implements RetryStrategy {
	/**
	 * @param maxRetries - The maximum number of retry attempts.
	 * @param baseDelayMs - The base delay (in milliseconds) between retries.
	 */
	constructor(
		private readonly maxRetries: number,
		private readonly baseDelayMs: number = 1000,
	) {}

	shouldRetry(_error: unknown, attempt: number): boolean {
		return attempt < this.maxRetries;
	}

	getDelay(attempt: number): number {
		return this.baseDelayMs * 2 ** (attempt - 1);
	}
}

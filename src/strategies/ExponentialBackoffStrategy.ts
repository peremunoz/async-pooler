import type { RetryStrategy } from "..";

/**
 * Implements an exponential backoff retry strategy.
 */
export class ExponentialBackoffStrategy implements RetryStrategy {
	/**
	 * @param maxRetries - The maximum number of retry attempts.
	 * @param baseDelay - The base delay (in milliseconds) between retries.
	 */
	constructor(
		private readonly maxRetries: number,
		private readonly baseDelay: number = 1000,
	) {}

	shouldRetry(_error: any, attempt: number): boolean {
		return attempt < this.maxRetries;
	}

	getDelay(attempt: number): number {
		return this.baseDelay * 2 ** (attempt - 1);
	}
}

import type { RetryStrategy } from "./RetryStrategy";

/**
 * Interface for tasks that support custom retry strategies.
 */
export interface Retryable {
	/**
	 * Indicates whether the task has its own retry strategy.
	 */
	hasOwnRetryStrategy(): boolean;
	/**
	 * Gets the retry strategy for the task.
	 */
	getRetryStrategy(): RetryStrategy | undefined;
}

/**
 * Type guard to check if an object implements the Retryable interface.
 *
 * @param obj - The object to check.
 * @returns True if the object is Retryable, false otherwise.
 */
export function isRetryable(obj: unknown): obj is Retryable {
	return typeof (obj as { hasOwnRetryStrategy?: unknown }).hasOwnRetryStrategy === "function";
}

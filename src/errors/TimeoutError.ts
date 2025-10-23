/**
 * Error thrown when a task exceeds its allotted timeout duration.
 */
export class TimeoutError extends Error {
	/**
	 * Creates an instance of TimeoutError.
	 * @param id - The identifier of the task that timed out.
	 * @param timeoutMs - The timeout duration in milliseconds.
	 */
	constructor(id: string, timeoutMs: number) {
		super(`Task "${id}" timed out after ${timeoutMs}ms`);
		this.name = "TimeoutError";
		Object.setPrototypeOf(this, TimeoutError.prototype);
	}
}

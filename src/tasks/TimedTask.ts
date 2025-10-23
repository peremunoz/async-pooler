import { Task } from "../core/Task";
import { TimeoutError } from "../errors/TimeoutError";

/**
 * A task that fails if not completed within a timeout.
 */
export class TimedTask<T> extends Task<T> {
	/**
	 * Creates a new TimedTask.
	 * @param id - Unique identifier for the task.
	 * @param executor - The function to be executed for the task.
	 * @param timeoutMs - The timeout duration (in milliseconds) for the task.
	 */
	constructor(
		id: string,
		executor: () => Promise<T>,
		private readonly timeoutMs: number,
	) {
		super(id, executor);
	}

	override async run(): Promise<T> {
		return Promise.race([
			super.run(),
			new Promise<T>((_, reject) =>
				setTimeout(
					() => reject(new TimeoutError(this.id, this.timeoutMs)),
					this.timeoutMs,
				),
			),
		]);
	}
}

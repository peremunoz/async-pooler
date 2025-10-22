/**
 * Represents a task to be executed in the AsyncPool.
 *
 * @typeParam T - The type of the result produced by the task.
 */
export class Task<T> {
  /**
   * @param id - Unique identifier for the task.
   * @param fn - The function to be executed for the task.
   */
  constructor(
    public readonly id: string,
    public readonly fn: () => Promise<T>
  ) {}

  /**
   * Executes the task.
   *
   * @returns The result of the task execution.
   */
  async run(): Promise<T> {
    return this.fn()
  }
}

/**
 * Defines the interface for retry strategies used by the pool.
 */
export interface RetryStrategy {
  /**
   * Whether to retry a failed attempt.
   * @param error - The thrown error.
   * @param attempt - The current attempt number (0-based).
   */
  shouldRetry(error: any, attempt: number): boolean

  /**
   * The delay (in milliseconds) before the next retry.
   * @param attempt - The attempt number.
   */
  getDelay(attempt: number): number
}

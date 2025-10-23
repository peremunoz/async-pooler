import { describe, it, expect, vi } from "vitest";
import { RetryableTask } from "../src/tasks/RetryableTask";
import { ExponentialBackoffStrategy } from "../src/strategies/ExponentialBackoffStrategy";

describe("RetryableTask", () => {
	it("should retry and eventually succeed", async () => {
		// Arrange
		let attempts = 0;
		const fn = vi.fn(async () => {
			if (attempts++ < 2) throw new Error("fail");
			return "ok";
		});
		const task = new RetryableTask(
			"r1",
			fn,
			new ExponentialBackoffStrategy(3, 1),
		);

		// Act
		const result = await task.run();

		// Assert
		expect(result).toBe("ok");
		expect(fn).toHaveBeenCalledTimes(3);
	});

	it("should stop retrying after max retries", async () => {
		const fn = vi.fn(async () => {
			throw new Error("always fail");
		});
		const task = new RetryableTask(
			"r2",
			fn,
			new ExponentialBackoffStrategy(2, 1),
		);

		await expect(task.run()).rejects.toThrow("always fail");
		expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
	});
});

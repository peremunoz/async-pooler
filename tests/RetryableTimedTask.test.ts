import { describe, expect, it, vi } from "vitest";
import { ExponentialBackoffStrategy } from "../src/strategies/ExponentialBackoffStrategy";
import { RetryableTimedTask } from "../src/tasks/RetryableTimedTask";

describe("RetryableTimedTask", () => {
	it("should retry and then succeed within timeout", async () => {
		let attempts = 0;
		const fn = vi.fn(async () => {
			if (attempts++ < 1) throw new Error("fail once");
			return "ok";
		});

		const task = new RetryableTimedTask(
			"rt1",
			fn,
			1000,
			new ExponentialBackoffStrategy(3, 1),
		);

		const result = await task.run();
		expect(result).toBe("ok");
		expect(fn).toHaveBeenCalledTimes(2);
	});

	it("should fail if timeout occurs before success", async () => {
		const fn = vi.fn(async () => {
			await new Promise((r) => setTimeout(r, 300));
			return "too slow";
		});

		const task = new RetryableTimedTask(
			"rt2",
			fn,
			100,
			new ExponentialBackoffStrategy(2, 1),
		);

		await expect(task.run()).rejects.toThrow(/timed out/);
	});
});

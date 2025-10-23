import { describe, expect, it } from "vitest";
import { AsyncPool } from "../core/AsyncPool";
import { Task } from "../core/Task";
import { ExponentialBackoffStrategy } from "../strategies/ExponentialBackoffStrategy";

describe("AsyncPool", () => {
	it("executes tasks with limited concurrency", async () => {
		const pool = new AsyncPool(2);
		const results: number[] = [];

		for (let i = 0; i < 5; i++) {
			pool.add(
				new Task(`t${i}`, async () => {
					await new Promise((r) => setTimeout(r, 50));
					results.push(i);
					return i;
				}),
			);
		}

		const output = await pool.runAll();
		expect(output.length).toBe(5);
		expect(results.length).toBe(5);
	});

	it("retries failed tasks with exponential backoff", async () => {
		const pool = new AsyncPool(2, {
			retryStrategy: new ExponentialBackoffStrategy(3, 10),
		});
		let attemptCount = 0;

		pool.add(
			new Task("retryTask", async () => {
				attemptCount++;
				if (attemptCount < 3) {
					throw new Error("Fail");
				}
				return "Success";
			}),
		);

		const results = await pool.runAll();
		expect(results[0]).toBe("Success");
		expect(attemptCount).toBe(3);
	});
});

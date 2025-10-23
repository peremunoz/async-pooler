import { describe, expect, it } from "vitest";
import { TimedTask } from "../src/tasks/TimedTask";

describe("TimedTask", () => {
	it("should complete before timeout", async () => {
		const task = new TimedTask("t1", async () => "fast", 100);
		const result = await task.run();
		expect(result).toBe("fast");
	});

	it("should fail when exceeding timeout", async () => {
		const task = new TimedTask(
			"t2",
			async () => {
				await new Promise((r) => setTimeout(r, 200));
				return "slow";
			},
			50,
		);

		await expect(task.run()).rejects.toThrow(/timed out/);
	});
});

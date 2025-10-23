import { describe, it, expect } from "vitest";
import { Task } from "../src/core/Task";

describe("Task", () => {
	it("should execute and return result", async () => {
		// Arrange
		const task = new Task("simple", async () => "ok");

		// Act
		const result = await task.run();

		// Assert
		expect(result).toBe("ok");
	});

	it("should throw errors from executor", async () => {
		const task = new Task("error", async () => {
			throw new Error("fail");
		});

		await expect(task.run()).rejects.toThrow("fail");
	});
});

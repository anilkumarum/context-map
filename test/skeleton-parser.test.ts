import { describe, it } from "node:test";
import assert from "node:assert";
import { extractSkeleton } from "../src/core/skeleton-parser.ts";

describe("Core: Skeleton Parser", () => {
	it("should strip function declaration bodies", () => {
		const input = `
    export function calculate(a: number, b: number): number {
        console.log("Calculating...");
        return a + b;
    }
    `;
		const expected = `
    export function calculate(a: number, b: number): number { /* implementation hidden */ }
    `;

		// Normalize whitespace for comparison
		assert.strictEqual(extractSkeleton(input).trim(), expected.trim());
	});

	it("should strip class methods but keep properties", () => {
		const input = `
    class User {
        private id: string;
        constructor(id: string) {
            this.id = id;
        }
        getName(): string {
            return "Alice";
        }
    }`;

		const output = extractSkeleton(input);

		assert.ok(output.includes("private id: string;")); // Prop kept
		assert.ok(output.includes("constructor(id: string) { /* implementation hidden */ }"));
		assert.ok(output.includes("getName(): string { /* implementation hidden */ }"));
		assert.ok(!output.includes('return "Alice"')); // Body removed
	});

	it("should preserve interfaces and types completely", () => {
		const input = `
    interface Config {
        url: string;
        retries: number;
    }
    type ID = string | number;
    `;
		assert.strictEqual(extractSkeleton(input), input);
	});

	it("should handle nested braces in template literals (Edge Case)", () => {
		// If we used Regex, this would likely fail by matching the first '}'
		const input = `
    function logMessage() {
        const msg = \`Hello \${name} -> { nested object }\`;
        console.log(msg);
    }
    `;

		const output = extractSkeleton(input);

		// The body should be stripped, but the parser shouldn't crash
		assert.ok(output.includes("function logMessage() { /* implementation hidden */ }"));
	});

	it("should handle arrow functions with block bodies", () => {
		const input = `const add = (a, b) => { return a + b; };`;
		const output = extractSkeleton(input);
		assert.strictEqual(output, `const add = (a, b) => { /* implementation hidden */ };`);
	});

	it("should IGNORE arrow functions with expression bodies", () => {
		// We decided to keep one-liners as they are usually structural enough
		const input = `const add = (a, b) => a + b;`;
		assert.strictEqual(extractSkeleton(input), input);
	});
});

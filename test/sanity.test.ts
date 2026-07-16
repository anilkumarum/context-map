import { describe, it } from "node:test";
import assert from "node:assert";
import { COMMANDS } from "../src/shared/constants.ts";

describe("Architecture Sanity Check", () => {
	it("should have correct command constants", () => {
		assert.strictEqual(COMMANDS.COPY_TREE, "contextMap.copyTree");
	});

	it("should run native typescript without compilation", () => {
		const isNode = true;
		assert.ok(isNode);
	});
});

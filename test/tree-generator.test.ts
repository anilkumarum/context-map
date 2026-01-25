import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { generateTree } from "../src/core/tree-generator.ts";
import { NodeFileSystem } from "./mocks/node-fs.ts";

const TEST_DIR = "./test-tree-sandbox";

describe("Core: Intelligent Tree Generator", () => {
	const fileSystem = new NodeFileSystem();

	before(async () => {
		await fs.mkdir(path.join(TEST_DIR, "src/components"), { recursive: true });
		await fs.writeFile(
			path.join(TEST_DIR, "src/components/user.ts"),
			"export class UserComponent { /*...*/ } export function init() {}",
		);
		await fs.writeFile(path.join(TEST_DIR, ".gitignore"), "node_modules");
	});

	after(async () => fs.rm(TEST_DIR, { recursive: true, force: true }));

	it("should append export metadata to files", async () => {
		const tree = await generateTree({
			fs: fileSystem,
			rootPath: path.resolve(TEST_DIR),
			targetPath: path.resolve(TEST_DIR, "src"),
		});

		// Verify Output Structure
		// src/
		// └── components
		//     └── user.ts (class UserComponent, func init)
		console.log(tree);
		assert.ok(tree.includes("```Tree"));
		assert.ok(tree.includes("src/")); // The relative root header
		assert.ok(tree.includes("user.ts (class UserComponent, func init)"));
	});
});

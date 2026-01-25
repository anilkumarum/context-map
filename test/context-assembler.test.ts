import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { assembleContext, AssembleMode } from "../src/core/context-assembler.ts";
import { NodeFileSystem } from "./mocks/node-fs.ts";

const TEST_DIR = "./test-assembler-phase2";

describe("Phase 2: Context Assembler", () => {
	const fileSystem = new NodeFileSystem();
	const rootPath = path.resolve(TEST_DIR);
	const srcPath = path.join(rootPath, "src");

	before(async () => {
		await fs.mkdir(path.join(TEST_DIR, "src/utils"), { recursive: true });
		await fs.writeFile(path.join(TEST_DIR, ".gitignore"), "");
		// File 1: TS Class
		await fs.writeFile(
			path.join(TEST_DIR, "src/utils/logger.ts"),
			"export class Logger { log() { console.log('hi'); } }",
		);
		// File 2: Config
		await fs.writeFile(path.join(TEST_DIR, "src/config.json"), '{ "debug": true }');
	});

	after(async () => fs.rm(TEST_DIR, { recursive: true, force: true }));

	it("Menu 1: Tree Simple (Structure Only)", async () => {
		const result = await assembleContext({
			fs: fileSystem,
			rootPath,
			targetFolderPath: srcPath,
			targetFilePaths: [],
			mode: AssembleMode.TreeSimple,
		});

		assert.ok(result.includes("```"));
		assert.ok(result.includes("src/"));
		assert.ok(result.includes("utils"));
		assert.ok(result.includes("logger.ts"));
		// Should NOT have content or metadata
		assert.ok(!result.includes("class Logger"));
		assert.ok(!result.includes("<file"));
	});

	it("Menu 2: Tree Smart (Structure + Metadata)", async () => {
		const result = await assembleContext({
			fs: fileSystem,
			rootPath,
			targetFolderPath: srcPath,
			targetFilePaths: [],
			mode: AssembleMode.TreeSmart,
		});

		assert.ok(result.includes("```"));
		// Should HAVE metadata
		assert.ok(result.includes("logger.ts (class Logger)"));
		// Should NOT have file content blocks
		assert.ok(!result.includes("<file"));
	});

	it("Menu 3: Skeleton (Simple Tree + Skeleton Content)", async () => {
		const result = await assembleContext({
			fs: fileSystem,
			rootPath,
			targetFolderPath: srcPath,
			targetFilePaths: [path.join(TEST_DIR, "src/utils/logger.ts")],
			mode: AssembleMode.Skeleton,
		});
		console.log(result);
		// 1. Tree check
		assert.ok(result.includes("```"));
		assert.ok(result.includes("(class Logger)"), "Tree should contain export summary");

		// 2. Content check
		assert.ok(result.includes('<file path="src/utils/logger.ts">'));
		// Implementation should be hidden
		assert.ok(result.includes("log() { // ... }"));
		assert.ok(!result.includes("console.log('hi')"));
	});

	it("Menu 4: Full (Simple Tree + Full Content)", async () => {
		const result = await assembleContext({
			fs: fileSystem,
			rootPath,
			targetFolderPath: srcPath,
			targetFilePaths: [path.join(TEST_DIR, "src/utils/logger.ts")],
			mode: AssembleMode.Full,
		});

		assert.ok(result.includes('<file path="src/utils/logger.ts">'));
		// Implementation should be present
		assert.ok(result.includes("console.log('hi')"));
	});
});

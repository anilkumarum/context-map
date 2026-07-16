import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { collectFiles } from "../src/core/file-collector.ts";
import { NodeFileSystem } from "./mocks/node-fs.ts";

const TEST_DIR = "./test-collector-phase3";

describe("Phase 3: File Collector", () => {
	const fileSystem = new NodeFileSystem();
	const rootPath = path.resolve(TEST_DIR);

	before(async () => {
		// Setup:
		// src/
		//   main.ts
		//   utils/
		//     helper.ts
		//   ignored.log
		// .gitignore
		await fs.mkdir(path.join(TEST_DIR, "src/utils"), { recursive: true });
		await fs.writeFile(path.join(TEST_DIR, "src/main.ts"), "");
		await fs.writeFile(path.join(TEST_DIR, "src/utils/helper.ts"), "");
		await fs.writeFile(path.join(TEST_DIR, "src/ignored.log"), "");
		await fs.writeFile(path.join(TEST_DIR, ".gitignore"), "*.log");
	});

	after(async () => fs.rm(TEST_DIR, { recursive: true, force: true }));

	it("should Recursively collect files from a folder input", async () => {
		const results = await collectFiles({
			fs: fileSystem,
			rootPath,
			inputPaths: [path.join(rootPath, "src")],
		});

		const relFiles = results.map((p) => path.relative(rootPath, p));

		// Should include nested files
		assert.ok(relFiles.includes(path.join("src", "main.ts")));
		assert.ok(relFiles.includes(path.join("src", "utils", "helper.ts")));

		// Should NOT include ignored files
		assert.ok(!relFiles.includes(path.join("src", "ignored.log")));
	});

	it("should handle mixed inputs (Folder + File)", async () => {
		// Simulate selecting "src/utils" folder AND "src/main.ts" file
		const results = await collectFiles({
			fs: fileSystem,
			rootPath,
			inputPaths: [path.join(rootPath, "src/utils"), path.join(rootPath, "src/main.ts")],
		});

		const relFiles = results.map((p) => path.relative(rootPath, p));

		assert.ok(relFiles.includes(path.join("src", "utils", "helper.ts")));
		assert.ok(relFiles.includes(path.join("src", "main.ts")));
		assert.strictEqual(relFiles.length, 2);
	});
});

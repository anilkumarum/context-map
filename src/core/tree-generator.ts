import ignore from "ignore";
import type { IFileSystem } from "./fs-interface.ts";
import { FileType } from "./fs-interface.ts";
import { scanExports } from "./skeleton-parser.ts";
import { toRelativePath } from "./path-utils.ts";
import { TREE_MODE, type TreeMode } from "./tree-mode.ts";

const TREE_CHARS = {
	BRANCH: "├── ",
	LAST_BRANCH: "└── ",
	VERTICAL: "│   ",
	SPACE: "    ",
} as const;

export interface TreeOptions {
	fs: IFileSystem;
	rootPath: string; // Workspace Root (e.g., /Users/me/project)
	targetPath: string; // The folder user clicked (e.g., /Users/me/project/src/utils)
	maxDepth?: number; // 0 = unlimited
	mode: TreeMode;
	extraIgnorePatterns?: string[]; // Additional gitignore-syntax patterns, additive to .gitignore
}

/**
 * Generates an ASCII tree.
 * - Respects .gitignore
 * - Scoped strictly to targetPath
 * - 'smart' mode adds export summary
 */
export async function generateTree(options: TreeOptions): Promise<string> {
	const { fs, rootPath, targetPath, maxDepth = 9, mode, extraIgnorePatterns = [] } = options;

	// 1. Setup .gitignore from Root
	const gitignoreMatcher = ignore();
	try {
		const gitignoreContent = await fs.readFile(fs.join(rootPath, ".gitignore"));
		if (gitignoreContent) gitignoreMatcher.add(gitignoreContent);
	} catch {
		/* proceed without ignore */
	}
	if (extraIgnorePatterns.length > 0) gitignoreMatcher.add(extraIgnorePatterns);

	// 2. Calculate Header (Relative path from workspace root)
	// e.g., if target is "src/utils", header is "src/utils/"
	const relativeRootRaw = toRelativePath(rootPath, targetPath);
	let relativeRoot = relativeRootRaw === null || relativeRootRaw === "." ? "" : relativeRootRaw;
	if (relativeRoot && !relativeRoot.endsWith("/")) relativeRoot += "/";

	// 3. Recursive Walker
	async function walkDirectory(currentAbsolutePath: string, linePrefix: string, depth: number): Promise<string[]> {
		// maxDepth === 0 means unlimited
		if (maxDepth !== 0 && depth > maxDepth) return [];

		let entries: [string, FileType][];
		try {
			entries = await fs.readDirectory(currentAbsolutePath);
		} catch {
			return [];
		}

		// Sort: Directories first, then Files
		entries.sort((entryA, entryB) => {
			if (entryA[1] === entryB[1]) return entryA[0].localeCompare(entryB[0]);
			return entryA[1] === FileType.Directory ? -1 : 1;
		});

		const outputLines: string[] = [];

		// Filter .gitignore
		const filteredEntries = entries.filter(([entryName]) => {
			if (entryName === ".git" || entryName === ".DS_Store") return false;
			const fullPath = fs.join(currentAbsolutePath, entryName);
			const pathForIgnore = toRelativePath(rootPath, fullPath);
			if (pathForIgnore === null || pathForIgnore === ".") return true; // outside root, don't filter
			return !gitignoreMatcher.ignores(pathForIgnore);
		});

		const totalEntries = filteredEntries.length;

		for (let index = 0; index < totalEntries; index++) {
			const [entryName, entryType] = filteredEntries[index];
			const isLastEntry = index === totalEntries - 1;
			const branchChar = isLastEntry ? TREE_CHARS.LAST_BRANCH : TREE_CHARS.BRANCH;

			let outputLine = `${linePrefix}${branchChar}${entryName}`;

			// SMART MODE: Append metadata
			if (
				mode === TREE_MODE.Smart &&
				entryType === FileType.File &&
				(entryName.endsWith(".ts") || entryName.endsWith(".js") || entryName.endsWith(".tsx"))
			) {
				try {
					const fileContent = await fs.readFile(fs.join(currentAbsolutePath, entryName));
					if (fileContent) {
						const exportNames = scanExports(fileContent);
						if (exportNames.length > 0) {
							// Limit to 3 items to prevent clutter
							const displayNames =
								exportNames.length > 3 ? [...exportNames.slice(0, 3), "..."].join(", ") : exportNames.join(", ");
							outputLine += ` (${displayNames})`;
						}
					}
				} catch {
					/* ignore read errors */
				}
			}

			outputLines.push(outputLine);

			if (entryType === FileType.Directory) {
				const nextPrefix = linePrefix + (isLastEntry ? TREE_CHARS.SPACE : TREE_CHARS.VERTICAL);
				const childLines = await walkDirectory(fs.join(currentAbsolutePath, entryName), nextPrefix, depth + 1);
				outputLines.push(...childLines);
			}
		}

		return outputLines;
	}

	const resultLines = await walkDirectory(targetPath, "", 0);

	return `${relativeRoot}\n${resultLines.join("\n")}`;
}

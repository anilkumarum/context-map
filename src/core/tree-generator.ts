import ignore from "ignore";
import type { IFileSystem } from "./fs-interface.ts";
import { FileType } from "./fs-interface.ts";
import { scanExports } from "./skeleton-parser.ts";

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
	maxDepth?: number;
	mode: "simple" | "smart"; // simple = structure only, smart = includes (class X...)
}

/**
 * Generates an ASCII tree.
 * - Respects .gitignore
 * - Scoped strictly to targetPath
 * - 'smart' mode adds export summary
 */
export async function generateTree(options: TreeOptions): Promise<string> {
	const { fs, rootPath, targetPath, maxDepth = 9, mode } = options;

	// 1. Setup .gitignore from Root
	const ig = ignore();
	try {
		const gitIgnoreContent = await fs.readFile(fs.join(rootPath, ".gitignore"));
		if (gitIgnoreContent) ig.add(gitIgnoreContent);
	} catch {
		/* proceed without ignore */
	}

	// 2. Calculate Header (Relative path from workspace root)
	// e.g., if target is "src/utils", header is "src/utils/"
	let relativeRoot = targetPath.startsWith(rootPath) ? targetPath.slice(rootPath.length + 1) : targetPath;

	if (relativeRoot && !relativeRoot.endsWith("/")) relativeRoot += "/";
	if (relativeRoot === "/") relativeRoot = ""; // Don't show slash for actual root

	// 3. Recursive Walker
	async function walk(currentAbsPath: string, prefix: string, depth: number): Promise<string[]> {
		if (depth > maxDepth) return [];

		let entries: [string, FileType][];
		try {
			entries = await fs.readDirectory(currentAbsPath);
		} catch {
			return [];
		}

		// Sort: Directories first, then Files
		entries.sort((a, b) => {
			if (a[1] === b[1]) return a[0].localeCompare(b[0]);
			return a[1] === FileType.Directory ? -1 : 1;
		});

		const lines: string[] = [];

		// Filter .gitignore
		const filtered = entries.filter(([name]) => {
			if (name === ".git" || name === ".DS_Store") return false;
			// .gitignore expects paths relative to the Git Root (Workspace Root)
			const fullPath = fs.join(currentAbsPath, name);
			const pathForIgnore = fullPath.slice(rootPath.length + 1);
			return !ig.ignores(pathForIgnore);
		});

		const total = filtered.length;

		for (let i = 0; i < total; i++) {
			const [name, type] = filtered[i];
			const isLast = i === total - 1;
			const branch = isLast ? TREE_CHARS.LAST_BRANCH : TREE_CHARS.BRANCH;

			let line = `${prefix}${branch}${name}`;

			// SMART MODE: Append metadata
			if (
				mode === "smart" &&
				type === FileType.File &&
				(name.endsWith(".ts") || name.endsWith(".js") || name.endsWith(".tsx"))
			) {
				try {
					const content = await fs.readFile(fs.join(currentAbsPath, name));
					if (content) {
						const exports = scanExports(content);
						if (exports.length > 0) {
							// Limit to 3 items to prevent clutter
							const display = exports.length > 3 ? [...exports.slice(0, 3), "..."].join(", ") : exports.join(", ");
							line += ` (${display})`;
						}
					}
				} catch {
					/* ignore read errors */
				}
			}

			lines.push(line);

			if (type === FileType.Directory) {
				const nextPrefix = prefix + (isLast ? TREE_CHARS.SPACE : TREE_CHARS.VERTICAL);
				const subLines = await walk(fs.join(currentAbsPath, name), nextPrefix, depth + 1);
				lines.push(...subLines);
			}
		}

		return lines;
	}

	const resultLines = await walk(targetPath, "", 0);

	// Return plain string, let the Assembler wrap it in markdown block if needed
	// or return the block here. User requested "SubMenu 1" style output.
	// We'll return just the content, Assembler adds the ``` if needed.
	return `${relativeRoot}\n${resultLines.join("\n")}`;
}

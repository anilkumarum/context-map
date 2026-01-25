import type { IFileSystem } from "./fs-interface.ts";
import { generateTree } from "./tree-generator.ts";
import { extractSkeleton } from "./skeleton-parser.ts";
import { formatFileBlock, formatTreeBlock } from "./formatter.ts";
import * as path from "node:path"; // Use built-in path for robust checking

export const AssembleMode = {
	TreeSimple: "tree-simple",
	TreeSmart: "tree-smart",
	Skeleton: "skeleton",
	Full: "full",
} as const;

export type AssembleMode = (typeof AssembleMode)[keyof typeof AssembleMode];

interface AssembleOptions {
	fs: IFileSystem;
	rootPath: string;
	targetFolderPath: string;
	targetFilePaths: string[];
	mode: AssembleMode;
}

export async function assembleContext(options: AssembleOptions): Promise<string> {
	const { fs, rootPath, targetFolderPath, targetFilePaths, mode } = options;
	const sections: string[] = [];

	// We want the tree to show (class Logger) when we are also copying the skeleton.
	const useSmartTree = mode === AssembleMode.TreeSmart || mode === AssembleMode.Skeleton;
	const treeMode = useSmartTree ? "smart" : "simple";

	try {
		const tree = await generateTree({
			fs,
			rootPath,
			targetPath: targetFolderPath,
			mode: treeMode,
		});
		sections.push(formatTreeBlock(tree));
	} catch (error) {
		sections.push("```\n(Error generating tree)\n```");
	}

	// 2. Process Files
	if (mode === AssembleMode.Skeleton || mode === AssembleMode.Full) {
		const sortedPaths = [...targetFilePaths].sort();

		for (const rawPath of sortedPaths) {
			// Ensure we are working with Absolute Paths for the check
			// (This handles cases where the caller might pass mixed path types)
			// Note: In VS Code environment, paths are usually absolute URIs, but this is safer.
			const absPath = path.resolve(rawPath);
			const absRoot = path.resolve(rootPath);

			// Calculate relative path for XML attribute
			// If root is "/abc" and file is "/abc/src/main.ts", result is "src/main.ts"
			const relPath = absPath.startsWith(absRoot) ? absPath.slice(absRoot.length + 1) : absPath;

			try {
				const rawContent = await fs.readFile(absPath);
				if (rawContent === null) continue;

				let processedContent = rawContent;

				if (mode === AssembleMode.Skeleton) {
					if (/\.(ts|js|tsx|jsx|mts|cts)$/.test(relPath)) {
						processedContent = extractSkeleton(rawContent);
					}
				}

				sections.push(formatFileBlock(relPath, processedContent));
			} catch (error) {
				sections.push(formatFileBlock(relPath, "(Error reading file)"));
			}
		}
	}

	return sections.join("\n\n");
}

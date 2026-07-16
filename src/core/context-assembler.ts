import type { IFileSystem } from "./fs-interface.ts";
import { generateTree } from "./tree-generator.ts";
import { extractSkeleton } from "./skeleton-parser.ts";
import { formatFileBlock, formatTreeBlock } from "./formatter.ts";
import { toRelativePath } from "./path-utils.ts";
import { TREE_MODE } from "./tree-mode.ts";

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
	suppressTree?: boolean; // <-- Strictly enforced for single-file contexts by the caller (commands.ts)
	maxDepth?: number; // 0 = unlimited, forwarded to generateTree
	extraIgnorePatterns?: string[]; // gitignore-syntax patterns, forwarded to generateTree
}

export async function assembleContext(options: AssembleOptions): Promise<string> {
	const { fs, rootPath, targetFolderPath, targetFilePaths, mode, suppressTree, maxDepth, extraIgnorePatterns } =
		options;
	const sections: string[] = [];

	// 1. Generate Tree
	// Only generate if NOT suppressed.
	if (!suppressTree) {
		const useSmartTree = mode === AssembleMode.TreeSmart || mode === AssembleMode.Skeleton;
		const treeMode = useSmartTree ? TREE_MODE.Smart : TREE_MODE.Simple;

		try {
			const tree = await generateTree({
				fs,
				rootPath,
				targetPath: targetFolderPath,
				mode: treeMode,
				maxDepth,
				extraIgnorePatterns,
			});
			sections.push(formatTreeBlock(tree));
		} catch {
			sections.push("```\n(Error generating tree)\n```");
		}
	}

	// 2. Process Files
	if (mode === AssembleMode.Skeleton || mode === AssembleMode.Full) {
		const sortedPaths = [...targetFilePaths].sort();

		for (const absolutePath of sortedPaths) {
			// targetFilePaths already come in absolute from collectFiles — no need
			// to re-resolve against process.cwd() via node:path (the previous bug).
			const relativePathRaw = toRelativePath(rootPath, absolutePath);
			const relativePath = relativePathRaw === null ? absolutePath : relativePathRaw;

			try {
				const rawContent = await fs.readFile(absolutePath);
				if (rawContent === null) continue;

				let processedContent = rawContent;

				if (mode === AssembleMode.Skeleton) {
					if (/\.(ts|js|tsx|jsx|mts|cts)$/.test(relativePath)) processedContent = extractSkeleton(rawContent);
				}

				sections.push(formatFileBlock(relativePath, processedContent));
			} catch {
				sections.push(formatFileBlock(relativePath, "(Error reading file)"));
			}
		}
	}

	return sections.join("\n\n");
}

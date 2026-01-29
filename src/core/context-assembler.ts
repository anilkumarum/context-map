import type { IFileSystem } from "./fs-interface.ts";
import { generateTree } from "./tree-generator.ts";
import { extractSkeleton } from "./skeleton-parser.ts";
import { formatFileBlock, formatTreeBlock } from "./formatter.ts";
import * as path from "node:path";

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
	suppressTree?: boolean; // <-- NEW OPTIONAL FLAG
}

export async function assembleContext(options: AssembleOptions): Promise<string> {
	const { fs, rootPath, targetFolderPath, targetFilePaths, mode, suppressTree } = options;
	const sections: string[] = [];

	// 1. Generate Tree
	// Only generate if NOT suppressed.
	// We strictly enforce suppression for single-file contexts.
	if (!suppressTree) {
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
	}

	// 2. Process Files
	if (mode === AssembleMode.Skeleton || mode === AssembleMode.Full) {
		const sortedPaths = [...targetFilePaths].sort();

		for (const rawPath of sortedPaths) {
			const absPath = path.resolve(rawPath);
			const absRoot = path.resolve(rootPath);

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

import ignore from "ignore";
import type { IFileSystem } from "./fs-interface.ts";
import { EntryKind, FileType } from "./fs-interface.ts";
import { toRelativePath } from "./path-utils.ts";
import { createConcurrencyLimiter } from "./concurrency-limiter.ts";

const MAX_CONCURRENT_DIRECTORY_READS = 32;

export interface CollectionOptions {
	fs: IFileSystem;
	rootPath: string;
	inputPaths: string[];
	extraIgnorePatterns?: string[];
}

export interface CollectionResult {
	filePaths: string[];
	unreadableInputPaths: string[]; // NEW: surfaced instead of silently swallowed
}

export async function collectFiles(options: CollectionOptions): Promise<CollectionResult> {
	const { fs, rootPath, inputPaths, extraIgnorePatterns = [] } = options;
	const collectedPaths: string[] = [];
	const unreadableInputPaths: string[] = [];
	const visitedPaths = new Set<string>();
	const runWithLimit = createConcurrencyLimiter(MAX_CONCURRENT_DIRECTORY_READS);

	const gitignoreMatcher = ignore();
	try {
		const gitignorePath = fs.join(rootPath, ".gitignore");
		const gitignoreContent = await fs.readFile(gitignorePath);
		if (gitignoreContent) gitignoreMatcher.add(gitignoreContent);
	} catch {
		// No .gitignore found, proceed without it
	}
	if (extraIgnorePatterns.length > 0) gitignoreMatcher.add(extraIgnorePatterns);

	const isIgnored = (absolutePath: string): boolean => {
		const relativePath = toRelativePath(rootPath, absolutePath);
		if (relativePath === null || relativePath === ".") return false;
		if (relativePath === ".git" || relativePath.startsWith(".git/")) return true;
		return gitignoreMatcher.ignores(relativePath);
	};

	const walkDirectory = async (currentPath: string) => {
		if (visitedPaths.has(currentPath)) return;
		visitedPaths.add(currentPath);
		if (isIgnored(currentPath)) return;

		let entries: [string, FileType][];
		try {
			entries = await runWithLimit(() => fs.readDirectory(currentPath));
		} catch {
			return;
		}

		const walkPromises: Promise<void>[] = [];
		for (const [entryName, entryType] of entries) {
			const fullPath = fs.join(currentPath, entryName);
			if (entryType === FileType.Directory) {
				walkPromises.push(walkDirectory(fullPath));
			} else if (entryType === FileType.File) {
				if (!isIgnored(fullPath)) collectedPaths.push(fullPath);
			}
		}
		await Promise.all(walkPromises);
	};

	// 3. Process Inputs — now uses statEntry instead of inferring from a
	// failed readDirectory, so a genuine permission error is distinguishable
	// from an ordinary file.
	await Promise.all(
		inputPaths.map(async (inputPath) => {
			if (isIgnored(inputPath)) return;

			const entryKind = await fs.statEntry(inputPath);

			if (entryKind === EntryKind.Directory) {
				await walkDirectory(inputPath);
			} else if (entryKind === EntryKind.File) {
				collectedPaths.push(inputPath);
			} else {
				unreadableInputPaths.push(inputPath);
			}
		}),
	);

	return {
		filePaths: [...new Set(collectedPaths)].sort(),
		unreadableInputPaths,
	};
}

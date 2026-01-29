import ignore from "ignore";
import type { IFileSystem } from "./fs-interface.ts";
import { FileType } from "./fs-interface.ts";

export interface CollectionOptions {
	fs: IFileSystem;
	rootPath: string; // Workspace Root (used for .gitignore)
	inputPaths: string[]; // Absolute paths selected by the user
}

/**
 * Recursively collects all files from the input paths.
 * - Respects .gitignore
 * - Deduplicates results
 * - Robust against read errors
 */
export async function collectFiles(options: CollectionOptions): Promise<string[]> {
	const { fs, rootPath, inputPaths } = options;
	const results: string[] = [];
	const visited = new Set<string>();

	// 1. Initialize Ignore Manager
	const ig = ignore();
	try {
		const gitIgnorePath = fs.join(rootPath, ".gitignore");
		const content = await fs.readFile(gitIgnorePath);
		if (content) ig.add(content);
	} catch {
		// No .gitignore found, proceed without it
	}

	// Helper: Check if path is ignored
	const isIgnored = (absPath: string): boolean => {
		// If path is outside root (unlikely), don't ignore
		if (!absPath.startsWith(rootPath)) return false;

		const relPath = absPath.slice(rootPath.length + 1);

		// Always ignore .git folder
		if (relPath === ".git" || relPath.startsWith(".git/")) return true;

		return ig.ignores(relPath);
	};

	// 2. Recursive Walker
	const walk = async (currentPath: string) => {
		if (visited.has(currentPath)) return;
		visited.add(currentPath);

		if (isIgnored(currentPath)) return;

		let entries: [string, FileType][];

		try {
			entries = await fs.readDirectory(currentPath);
		} catch (error) {
			// Failed to read directory.
			// It might be a file (if it was an input path), or a permission error.
			// We handle "Input is File" logic in the main loop, so here we just return.
			return;
		}

		const promises: Promise<void>[] = [];

		for (const [name, type] of entries) {
			const fullPath = fs.join(currentPath, name);

			if (type === FileType.Directory) {
				promises.push(walk(fullPath));
			} else if (type === FileType.File) {
				if (!isIgnored(fullPath)) {
					results.push(fullPath);
				}
			}
			// We skip Symlinks to avoid infinite loops for safety
		}

		await Promise.all(promises);
	};

	// 3. Process Inputs
	await Promise.all(
		inputPaths.map(async (path) => {
			if (isIgnored(path)) return;

			// We don't know if input is File or Dir. Try to read as Dir first.
			try {
				await fs.readDirectory(path);
				// It's a directory, walk it
				await walk(path);
			} catch (error) {
				console.log({ error });
				// It's likely a file (or invalid).
				// If it exists (we can read it), add it.
				// For performance, we assume if it was selected in VS Code, it exists.
				results.push(path);
			}
		}),
	);

	// Deduplicate and Sort
	return [...new Set(results)].sort();
}

import * as path from "node:path";

/**
 * Converts an absolute path into a POSIX-style path relative to rootPath.
 *
 * Replaces the unsafe `absolutePath.startsWith(rootPath)` pattern previously
 * used in file-collector.ts, tree-generator.ts, and context-assembler.ts,
 * which incorrectly matched sibling directories (e.g. root "/proj" would
 * also match "/proj2/file.ts", producing a garbage relative path).
 *
 * Always returns forward-slash paths, since the `ignore` package expects
 * POSIX-style patterns regardless of OS (this also fixes gitignore matching
 * being silently broken on Windows, where path.join uses "\").
 *
 * @returns "." if absolutePath === rootPath, a relative POSIX path if inside
 *          rootPath, or null if absolutePath is outside rootPath entirely.
 */
export function toRelativePath(rootPath: string, absolutePath: string): string | null {
	const relative = path.relative(rootPath, absolutePath);

	if (relative === "") return ".";
	if (relative.startsWith("..") || path.isAbsolute(relative)) return null;

	return relative.split(path.sep).join("/");
}

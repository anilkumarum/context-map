/**
 * Abstraction for File System operations.
 * Allows Core logic to run in both Node.js (tests) and VS Code (production).
 */

export const FileType = {
	Unknown: 0,
	File: 1,
	Directory: 2,
	SymbolicLink: 64,
} as const;
export type FileType = (typeof FileType)[keyof typeof FileType];

export const EntryKind = {
	File: "file",
	Directory: "directory",
	NotFoundOrUnreadable: "not-found-or-unreadable",
} as const;
export type EntryKind = (typeof EntryKind)[keyof typeof EntryKind];

export interface IFileSystem {
	readDirectory(path: string): Promise<[string, FileType][]>;
	readFile(path: string): Promise<string | null>;

	/**
	 * Distinguishes "this is a file", "this is a directory", or "missing /
	 * unreadable" (bug #6 fix) — so collectFiles no longer has to infer
	 * file-ness purely from a failed readDirectory call, which silently
	 * mislabels genuine permission errors as ordinary files.
	 */
	statEntry(path: string): Promise<EntryKind>;

	join(...paths: string[]): string;
}

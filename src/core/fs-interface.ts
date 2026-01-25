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

export interface IFileSystem {
	/**
	 * Reads a directory and returns names and types.
	 */
	readDirectory(path: string): Promise<[string, FileType][]>;

	/**
	 * Reads a text file. Returns null if file doesn't exist.
	 */
	readFile(path: string): Promise<string | null>;

	/**
	 * Join path segments (OS agnostic).
	 */
	join(...paths: string[]): string;
}

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { FileType, type IFileSystem } from "../../src/core/fs-interface.ts";

export class NodeFileSystem implements IFileSystem {
	async readDirectory(dirPath: string): Promise<[string, FileType][]> {
		const dirents = await fs.readdir(dirPath, { withFileTypes: true });
		return dirents.map((d) => {
			let type = FileType.Unknown;
			if (d.isFile()) type = FileType.File;
			if (d.isDirectory()) type = FileType.Directory;
			return [d.name, type];
		});
	}

	async readFile(filePath: string): Promise<string | null> {
		try {
			return await fs.readFile(filePath, "utf-8");
		} catch {
			return null;
		}
	}

	join(...paths: string[]): string {
		return path.join(...paths);
	}
}

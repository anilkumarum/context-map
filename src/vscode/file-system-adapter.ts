import * as vscode from "vscode";
import * as path from "node:path";
import { FileType, type IFileSystem } from "../core/fs-interface.ts";

export class VSCodeFileSystem implements IFileSystem {
	async readDirectory(dirPath: string): Promise<[string, FileType][]> {
		const uri = vscode.Uri.file(dirPath);
		try {
			const results = await vscode.workspace.fs.readDirectory(uri);

			return results.map(([name, type]) => {
				let coreType = FileType.Unknown;
				if (type & vscode.FileType.File) coreType = FileType.File;
				if (type & vscode.FileType.Directory) coreType = FileType.Directory;
				if (type & vscode.FileType.SymbolicLink) coreType = FileType.SymbolicLink;
				return [name, coreType];
			});
		} catch {
			// Return empty if directory cannot be read (permission/existence)
			return [];
		}
	}

	async readFile(filePath: string): Promise<string | null> {
		const uri = vscode.Uri.file(filePath);
		try {
			const uint8Array = await vscode.workspace.fs.readFile(uri);
			return new TextDecoder().decode(uint8Array);
		} catch {
			return null;
		}
	}

	join(...paths: string[]): string {
		return path.join(...paths);
	}
}

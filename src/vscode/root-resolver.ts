import * as vscode from "vscode";

/**
 * Resolves the root entry folder for the F1 command flow.
 *
 * Priority:
 * 1. If there's an active editor showing a real (non-untitled) file, use its
 *    parent directory.
 * 2. Otherwise, if <workspaceRoot>/src exists as a direct child, use that.
 * 3. Otherwise, fall back to the workspace root itself.
 */
export async function resolveF1RootFolder(workspaceRoot: string): Promise<string> {
	const activeEditor = vscode.window.activeTextEditor;
	const hasRealActiveFile =
		activeEditor && !activeEditor.document.isUntitled && activeEditor.document.uri.scheme === "file";

	if (hasRealActiveFile) return vscode.Uri.joinPath(activeEditor.document.uri, "..").fsPath;

	const candidateSourceFolder = vscode.Uri.joinPath(vscode.Uri.file(workspaceRoot), "src");
	try {
		const folderStat = await vscode.workspace.fs.stat(candidateSourceFolder);
		if (folderStat.type === vscode.FileType.Directory) return candidateSourceFolder.fsPath;
	} catch {
		// src/ doesn't exist, fall through to workspace root
	}

	return workspaceRoot;
}

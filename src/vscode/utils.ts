import * as vscode from "vscode";

/**
 * Normalizes the selection from VS Code Context Menu.
 *
 * Scenario 1: Right-click a file (clickedUri is defined, selectedUris is undefined/empty).
 * Scenario 2: Select 5 files, right-click one (clickedUri is target, selectedUris has all 5).
 */
export function getSelectedPaths(
	clickedUri: vscode.Uri | undefined,
	selectedUris: vscode.Uri[] | undefined,
): string[] {
	// Priority: Multi-select > Single-click > Empty
	if (selectedUris && Array.isArray(selectedUris) && selectedUris.length > 0) {
		return selectedUris.map((uri) => uri.fsPath);
	}

	if (clickedUri) {
		return [clickedUri.fsPath];
	}

	return [];
}

/**
 * Finds the workspace root for a given file path.
 * Returns the file's own directory if no workspace is open (fallback).
 */
export function getWorkspaceRoot(filePath: string): string {
	if (!filePath) return "";

	const uri = vscode.Uri.file(filePath);
	const folder = vscode.workspace.getWorkspaceFolder(uri);

	if (folder) {
		return folder.uri.fsPath;
	}

	// Fallback: Return directory of the file
	return vscode.Uri.joinPath(uri, "..").fsPath;
}

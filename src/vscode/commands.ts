import * as vscode from "vscode";
import { assembleContext, AssembleMode } from "../core/context-assembler.ts";
import { collectFiles } from "../core/file-collector.ts";
import { VSCodeFileSystem } from "./file-system-adapter.ts";
import { OutputManager } from "./output-manager.ts";
import { getSelectedPaths, getWorkspaceRoot } from "./utils.ts";
import { MESSAGES } from "../shared/constants.ts";

const fs = new VSCodeFileSystem();
const outputManager = new OutputManager();

/**
 * Shared Handler Logic
 */
async function runContextGeneration(
	clickedUri: vscode.Uri,
	selectedUris: vscode.Uri[] | undefined,
	mode: AssembleMode,
): Promise<void> {
	try {
		if (!clickedUri) return;

		const inputPaths = getSelectedPaths(clickedUri, selectedUris);
		const rootPath = getWorkspaceRoot(clickedUri.fsPath);

		// Determine Target Folder for Tree Root (Parent of file, or the folder itself)
		// We try to check if clicked item is a directory.
		let targetFolderPath = clickedUri.fsPath;
		try {
			const stat = await vscode.workspace.fs.stat(clickedUri);
			if ((stat.type & vscode.FileType.Directory) === 0) {
				targetFolderPath = vscode.Uri.joinPath(clickedUri, "..").fsPath;
			}
		} catch {
			targetFolderPath = vscode.Uri.joinPath(clickedUri, "..").fsPath;
		}

		// 1. Collect Files
		const targetFilePaths = await collectFiles({
			fs,
			rootPath,
			inputPaths,
		});

		if (targetFilePaths.length === 0) {
			vscode.window.showWarningMessage("No valid files found.");
			return;
		}

		// 2. Assemble
		const result = await assembleContext({
			fs,
			rootPath,
			targetFolderPath,
			targetFilePaths,
			mode,
		});

		// 3. Output
		const msg =
			mode === AssembleMode.TreeSimple || mode === AssembleMode.TreeSmart
				? MESSAGES.SUCCESS.TREE_COPIED
				: MESSAGES.SUCCESS.CONTEXT_COPIED;

		await outputManager.handleOutput(result, msg);
	} catch (error) {
		console.error(error);
		vscode.window.showErrorMessage(MESSAGES.ERRORS.GENERIC);
	}
}

// --- Exposed Command Handlers ---

// SubMenu 1
export async function copyTreeSimple(uri: vscode.Uri, uris: vscode.Uri[]) {
	await runContextGeneration(uri, uris, AssembleMode.TreeSimple);
}

// SubMenu 2
export async function copyTreeSmart(uri: vscode.Uri, uris: vscode.Uri[]) {
	await runContextGeneration(uri, uris, AssembleMode.TreeSmart);
}

// SubMenu 3
export async function copySkeleton(uri: vscode.Uri, uris: vscode.Uri[]) {
	await runContextGeneration(uri, uris, AssembleMode.Skeleton);
}

// SubMenu 4
export async function copyFull(uri: vscode.Uri, uris: vscode.Uri[]) {
	await runContextGeneration(uri, uris, AssembleMode.Full);
}

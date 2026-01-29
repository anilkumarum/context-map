import * as vscode from "vscode";
import { assembleContext, AssembleMode } from "../core/context-assembler.ts";
import { collectFiles } from "../core/file-collector.ts";
import { VSCodeFileSystem } from "./file-system-adapter.ts";
import { OutputManager } from "./output-manager.ts";
import { getSelectedPaths, getWorkspaceRoot } from "./utils.ts";
import { MESSAGES } from "../shared/constants.ts";

const fs = new VSCodeFileSystem();
const outputManager = new OutputManager();

async function runContextGeneration(
	clickedUri: vscode.Uri,
	selectedUris: vscode.Uri[] | undefined,
	mode: AssembleMode,
): Promise<void> {
	try {
		if (!clickedUri) return;

		// 1. Resolve Paths
		const inputPaths = getSelectedPaths(clickedUri, selectedUris);
		const rootPath = getWorkspaceRoot(clickedUri.fsPath);

		// 2. Determine Tree Root
		// Check if the primary clicked item is a file or folder
		let targetFolderPath = clickedUri.fsPath;
		try {
			const stat = await vscode.workspace.fs.stat(clickedUri);
			if (stat.type === vscode.FileType.File) {
				// If it's a file, set tree root to its parent directory
				// This ensures the tree shows the file's location in context
				targetFolderPath = vscode.Uri.joinPath(clickedUri, "..").fsPath;
			}
		} catch {
			// Fallback if stat fails (unlikely)
			targetFolderPath = vscode.Uri.joinPath(clickedUri, "..").fsPath;
		}

		// 3. Collect Files
		// If inputPaths contains a single file, collectFiles will return just that file (correctly).
		const targetFilePaths = await collectFiles({
			fs,
			rootPath,
			inputPaths,
		});

		if (targetFilePaths.length === 0) {
			vscode.window.showWarningMessage("No valid files found (checked .gitignore).");
			return;
		}

		// 4. Determine if Tree should be shown
		// Logic:
		// - If mode is TreeSimple or TreeSmart, ALWAYS show tree (that's the point).
		// - If mode is Skeleton or Full:
		//    - If 1 file -> HIDE Tree.
		//    - If >1 files -> SHOW Tree (useful context).
		const isTreeOnlyMode = mode === AssembleMode.TreeSimple || mode === AssembleMode.TreeSmart;
		const suppressTree = !isTreeOnlyMode && targetFilePaths.length === 1;

		// 5. Assemble
		const result = await assembleContext({
			fs,
			rootPath,
			targetFolderPath,
			targetFilePaths,
			mode,
			suppressTree,
		});

		// 5. Output
		const msg =
			mode === AssembleMode.TreeSimple || mode === AssembleMode.TreeSmart
				? MESSAGES.SUCCESS.TREE_COPIED
				: MESSAGES.SUCCESS.CONTEXT_COPIED;

		await outputManager.handleOutput(result, msg);
	} catch (error) {
		console.error("Context Generation Failed:", error);
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

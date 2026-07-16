import * as vscode from "vscode";
import { assembleContext, AssembleMode } from "../core/context-assembler.ts";
import { collectFiles } from "../core/file-collector.ts";
import { parseConfigInput } from "../core/config-parser.ts";
import { VSCodeFileSystem } from "./file-system-adapter.ts";
import { OutputManager } from "./output-manager.ts";
import { getSelectedPaths, getWorkspaceRoot } from "./utils.ts";
import { resolveF1RootFolder } from "./root-resolver.ts";
import { showModePicker } from "./mode-picker.ts";
import { showDatalistQuickPick } from "./datalist-quick-pick.ts";
import { readConfigInputHistory, recordConfigInputUsage } from "./config-input-history.ts";
import { MESSAGES } from "../shared/constants.ts";

const fileSystem = new VSCodeFileSystem();
const outputManager = new OutputManager();

interface RunContextGenerationOptions {
	clickedUri: vscode.Uri;
	selectedUris: vscode.Uri[] | undefined;
	mode: AssembleMode;
	maxDepth?: number; // 0 = unlimited
	extraIgnorePatterns?: string[];
}

async function runContextGeneration(options: RunContextGenerationOptions): Promise<void> {
	const { clickedUri, selectedUris, mode, maxDepth, extraIgnorePatterns } = options;

	try {
		if (!clickedUri) return;

		// 1. Resolve Paths
		const inputPaths = getSelectedPaths(clickedUri, selectedUris);
		const rootPath = getWorkspaceRoot(clickedUri.fsPath);

		// 2. Determine Tree Root
		let targetFolderPath = clickedUri.fsPath;
		try {
			const stat = await vscode.workspace.fs.stat(clickedUri);
			if (stat.type === vscode.FileType.File) targetFolderPath = vscode.Uri.joinPath(clickedUri, "..").fsPath;
		} catch {
			targetFolderPath = vscode.Uri.joinPath(clickedUri, "..").fsPath;
		}

		// 3. Collect Files
		const { filePaths: targetFilePaths, unreadableInputPaths } = await collectFiles({
			fs: fileSystem,
			rootPath,
			inputPaths,
			extraIgnorePatterns,
		});

		if (unreadableInputPaths.length > 0) {
			const unreadableNames = unreadableInputPaths.map((unreadablePath) => vscode.Uri.file(unreadablePath).fsPath);
			vscode.window.showWarningMessage(
				`Context Map skipped ${unreadableNames.length} unreadable path(s) (permission denied or missing): ${unreadableNames.join(", ")}`,
			);
		}

		if (targetFilePaths.length === 0) {
			vscode.window.showWarningMessage("No valid files found (checked .gitignore).");
			return;
		}

		// 4. Determine if Tree should be shown
		const isTreeOnlyMode = mode === AssembleMode.TreeSimple || mode === AssembleMode.TreeSmart;
		const suppressTree = !isTreeOnlyMode && targetFilePaths.length === 1;

		// 5. Assemble
		const result = await assembleContext({
			fs: fileSystem,
			rootPath,
			targetFolderPath,
			targetFilePaths,
			mode,
			suppressTree,
			maxDepth,
			extraIgnorePatterns,
		});

		// 6. Output
		const successMessage = isTreeOnlyMode ? MESSAGES.SUCCESS.TREE_COPIED : MESSAGES.SUCCESS.CONTEXT_COPIED;

		await outputManager.handleOutput(result, successMessage);
	} catch (error) {
		console.error("Context Generation Failed:", error);
		vscode.window.showErrorMessage(MESSAGES.ERRORS.GENERIC);
	}
}

// --- Exposed Command Handlers (Explorer context menu) ---

export async function copyTreeSimple(uri: vscode.Uri, uris: vscode.Uri[]) {
	await runContextGeneration({ clickedUri: uri, selectedUris: uris, mode: AssembleMode.TreeSimple });
}

export async function copyTreeSmart(uri: vscode.Uri, uris: vscode.Uri[]) {
	await runContextGeneration({ clickedUri: uri, selectedUris: uris, mode: AssembleMode.TreeSmart });
}

export async function copySkeleton(uri: vscode.Uri, uris: vscode.Uri[]) {
	await runContextGeneration({ clickedUri: uri, selectedUris: uris, mode: AssembleMode.Skeleton });
}

export async function copyFull(uri: vscode.Uri, uris: vscode.Uri[]) {
	await runContextGeneration({ clickedUri: uri, selectedUris: uris, mode: AssembleMode.Full });
}

// --- F1 Command Palette Handler ---

export async function generateCustom(extensionContext: vscode.ExtensionContext): Promise<void> {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		vscode.window.showErrorMessage(MESSAGES.ERRORS.NO_WORKSPACE);
		return;
	}

	const pickedMode = await showModePicker();
	if (!pickedMode) return; // user cancelled

	const historyEntries = readConfigInputHistory(extensionContext);
	const rawConfigInput = await showDatalistQuickPick(historyEntries);
	if (rawConfigInput === undefined) return; // user cancelled

	await recordConfigInputUsage(extensionContext, rawConfigInput);

	const { maxDepth, extraIgnorePatterns } = parseConfigInput(rawConfigInput);

	const rootFolderPath = await resolveF1RootFolder(workspaceFolder.uri.fsPath);
	const rootFolderUri = vscode.Uri.file(rootFolderPath);

	await runContextGeneration({
		clickedUri: rootFolderUri,
		selectedUris: undefined,
		mode: pickedMode,
		maxDepth,
		extraIgnorePatterns,
	});
}

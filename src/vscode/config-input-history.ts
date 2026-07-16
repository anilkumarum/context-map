import * as vscode from "vscode";
import { CONFIG_INPUT_STORAGE_KEY } from "../shared/constants.ts";

const MAX_HISTORY_ENTRIES = 20;

/**
 * Reads the saved config-input history, most-recent-first.
 * Stored in globalState so it's shared across all VS Code windows/workspaces.
 */
export function readConfigInputHistory(extensionContext: vscode.ExtensionContext): string[] {
	return extensionContext.globalState.get<string[]>(CONFIG_INPUT_STORAGE_KEY, []);
}

/**
 * Records a newly used config input at the front of history, deduplicating
 * and capping the list length.
 */
export async function recordConfigInputUsage(
	extensionContext: vscode.ExtensionContext,
	usedValue: string,
): Promise<void> {
	const trimmedValue = usedValue.trim();
	if (trimmedValue === "") return;

	const existingHistory = readConfigInputHistory(extensionContext);
	const deduplicatedHistory = existingHistory.filter((entry) => entry !== trimmedValue);
	const updatedHistory = [trimmedValue, ...deduplicatedHistory].slice(0, MAX_HISTORY_ENTRIES);

	await extensionContext.globalState.update(CONFIG_INPUT_STORAGE_KEY, updatedHistory);
}

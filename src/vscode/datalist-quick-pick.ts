import * as vscode from "vscode";
import { CONFIG_INPUT_PLACEHOLDER, FREE_ENTRY_ITEM_ID } from "../shared/constants.ts";

interface DatalistQuickPickItem extends vscode.QuickPickItem {
	itemId: string;
	resolvedValue: string;
}

const FREE_ENTRY_PREFIX = "Use: ";

/**
 * Shows a QuickPick that behaves like a browser <input list="..."> datalist:
 * the user can either select a past entry from historyEntries, or type a
 * brand-new value and accept it even though it isn't in the list.
 *
 * Returns the chosen/typed string, or undefined if the user cancelled.
 */
export async function showDatalistQuickPick(historyEntries: string[]): Promise<string | undefined> {
	return new Promise((resolve) => {
		const quickPick = vscode.window.createQuickPick<DatalistQuickPickItem>();
		quickPick.placeholder = CONFIG_INPUT_PLACEHOLDER;
		quickPick.items = buildItems(historyEntries, "");

		quickPick.onDidChangeValue((typedValue) => {
			quickPick.items = buildItems(historyEntries, typedValue);
		});

		quickPick.onDidAccept(() => {
			const selectedItem = quickPick.selectedItems[0];
			const resolvedValue = selectedItem ? selectedItem.resolvedValue : quickPick.value;
			quickPick.hide();
			resolve(resolvedValue.trim() === "" ? undefined : resolvedValue);
		});

		quickPick.onDidHide(() => {
			quickPick.dispose();
			resolve(undefined);
		});

		quickPick.show();
	});
}

function buildItems(historyEntries: string[], typedValue: string): DatalistQuickPickItem[] {
	const historyItems: DatalistQuickPickItem[] = historyEntries.map((entry) => ({
		itemId: entry,
		label: entry,
		resolvedValue: entry,
	}));

	const trimmedTypedValue = typedValue.trim();
	const isNewValue = trimmedTypedValue !== "" && !historyEntries.includes(trimmedTypedValue);

	if (!isNewValue) return historyItems;

	const freeEntryItem: DatalistQuickPickItem = {
		itemId: FREE_ENTRY_ITEM_ID,
		label: `${FREE_ENTRY_PREFIX}${trimmedTypedValue}`,
		resolvedValue: trimmedTypedValue,
		alwaysShow: true,
	};

	return [freeEntryItem, ...historyItems];
}

import * as vscode from "vscode";
import { AssembleMode } from "../core/context-assembler.ts";
import { MODE_PICK_ITEM } from "../shared/constants.ts";

const MODE_BY_DESCRIPTION: Record<string, AssembleMode> = {
	[MODE_PICK_ITEM.TreeSimple.description]: AssembleMode.TreeSimple,
	[MODE_PICK_ITEM.TreeSmart.description]: AssembleMode.TreeSmart,
	[MODE_PICK_ITEM.Skeleton.description]: AssembleMode.Skeleton,
	[MODE_PICK_ITEM.Full.description]: AssembleMode.Full,
};

/**
 * Shows a QuickPick for the 4 AssembleModes. Returns undefined if cancelled.
 */
export async function showModePicker(): Promise<AssembleMode | undefined> {
	const pickedItem = await vscode.window.showQuickPick(Object.values(MODE_PICK_ITEM), {
		placeHolder: "Choose what Context Map should generate",
	});

	return pickedItem ? MODE_BY_DESCRIPTION[pickedItem.description] : undefined;
}

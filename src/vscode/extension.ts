import * as vscode from "vscode";
import { COMMANDS } from "../shared/constants.ts";
import { copyTreeSimple, copyTreeSmart, copySkeleton, copyFull } from "./commands.ts";

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand(COMMANDS.COPY_TREE_SIMPLE, copyTreeSimple),
		vscode.commands.registerCommand(COMMANDS.COPY_TREE_SMART, copyTreeSmart),
		vscode.commands.registerCommand(COMMANDS.COPY_SKELETON, copySkeleton),
		vscode.commands.registerCommand(COMMANDS.COPY_FULL, copyFull),
	);
}

export function deactivate() {}

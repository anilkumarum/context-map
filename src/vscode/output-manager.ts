import * as vscode from "vscode";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs/promises";

const MD_LANG_ID = "markdown";

export class OutputManager {
	/**
	 * Output flow:
	 * 1. Copy to Clipboard.
	 * 2. If active editor is Markdown (and not temp), insert there.
	 * 3. Else, open a fresh Temp file.
	 */
	async handleOutput(content: string, successMessage: string): Promise<void> {
		// 1. Clipboard
		await vscode.env.clipboard.writeText(content);

		// 2. Editor Handling
		const activeEditor = vscode.window.activeTextEditor;
		const isMarkdown = activeEditor?.document.languageId === MD_LANG_ID;
		const isUntitled = activeEditor?.document.isUntitled;

		if (activeEditor && isMarkdown && !isUntitled) {
			await this.insertAtCursor(activeEditor, content);
		} else {
			await this.openTempFile(content);
		}

		vscode.window.setStatusBarMessage(successMessage, 3000);
	}

	private async insertAtCursor(editor: vscode.TextEditor, text: string): Promise<void> {
		const selection = editor.selection;
		await editor.edit((editBuilder) => {
			const prefix = selection.start.character === 0 ? "" : "\n";
			editBuilder.replace(selection, `${prefix}${text}\n`);
		});
	}

	private async openTempFile(content: string): Promise<void> {
		// Generate a unique temp file
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const filename = `Context_Map_${timestamp}.md`;
		const tempPath = path.join(os.tmpdir(), filename);

		// Write to disk (Real file = No "Save?" dialog on close)
		await fs.writeFile(tempPath, content);

		const doc = await vscode.workspace.openTextDocument(tempPath);
		await vscode.window.showTextDocument(doc, {
			viewColumn: vscode.ViewColumn.Beside,
			preview: false, // Keep tab open
		});
	}
}

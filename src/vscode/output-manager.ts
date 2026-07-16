import * as vscode from "vscode";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs/promises";

const MD_LANG_ID = "markdown";
const TEMP_FILE_PREFIX = "Context_Map_";
const MAX_RETAINED_TEMP_FILES = 5;

export class OutputManager {
	/**
	 * Output flow:
	 * 1. Copy to Clipboard.
	 * 2. If active editor is Markdown (and not temp), insert there.
	 * 3. Else, open a fresh Temp file.
	 * 4. Prune old Context Map temp files so os.tmpdir() doesn't grow forever
	 *    (bug #10: previously every invocation left a file behind permanently).
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
			await this.pruneOldTempFiles();
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
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const filename = `${TEMP_FILE_PREFIX}${timestamp}.md`;
		const tempPath = path.join(os.tmpdir(), filename);

		await fs.writeFile(tempPath, content);

		const doc = await vscode.workspace.openTextDocument(tempPath);
		await vscode.window.showTextDocument(doc, {
			viewColumn: vscode.ViewColumn.Beside,
			preview: false,
		});
	}

	/**
	 * Keeps only the MAX_RETAINED_TEMP_FILES most recent Context Map temp
	 * files, deleting older ones. Currently-open files are safe to delete
	 * from disk (VS Code keeps unsaved buffers open even if the backing
	 * file disappears), but we only ever prune files older than the newest
	 * MAX_RETAINED_TEMP_FILES, so the one just opened is never touched.
	 */
	private async pruneOldTempFiles(): Promise<void> {
		try {
			const tempDirEntries = await fs.readdir(os.tmpdir());
			const contextMapFiles = tempDirEntries.filter(
				(entryName) => entryName.startsWith(TEMP_FILE_PREFIX) && entryName.endsWith(".md"),
			);

			if (contextMapFiles.length <= MAX_RETAINED_TEMP_FILES) return;

			// Filenames are timestamp-sortable (ISO 8601 with : and . replaced by -),
			// so lexicographic sort matches chronological order.
			const sortedOldestFirst = contextMapFiles.sort();
			const filesToDelete = sortedOldestFirst.slice(0, sortedOldestFirst.length - MAX_RETAINED_TEMP_FILES);

			await Promise.all(filesToDelete.map((filename) => fs.unlink(path.join(os.tmpdir(), filename)).catch(() => {})));
		} catch {
			// Best-effort cleanup; failures here shouldn't disrupt the main flow.
		}
	}
}

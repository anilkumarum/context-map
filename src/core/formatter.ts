/**
 * Formats code context into LLM-friendly structures.
 */

export const TAGS = {
	FILE: "file",
	PATH_ATTR: "path",
} as const;

/**
 * Wraps content in the XML file tag.
 * <file path="src/index.ts"> ... </file>
 */
export function formatFileBlock(relativePath: string, content: string): string {
	return `<${TAGS.FILE} ${TAGS.PATH_ATTR}="${relativePath}">\n${content.trim()}\n</${TAGS.FILE}>`;
}

/**
 * Wraps the directory tree in a markdown code block with a specific label.
 * ```Tree
 * ...
 * ```
 */
export function formatTreeBlock(tree: string): string {
	// Ensure we don't double-wrap if the generator already added ticks (it shouldn't in raw mode, but safety first)
	const cleanTree = tree.replace(/```Tree\n|```/g, "").trim();
	return `\`\`\`\n${cleanTree}\n\`\`\``;
}

export const EXTENSION_ID = {
	NAME: "context-map",
	DisplayName: "Context Map",
} as const;

export const COMMANDS = {
	COPY_TREE_SIMPLE: "contextMap.copyTreeSimple",
	COPY_TREE_SMART: "contextMap.copyTreeSmart",
	COPY_SKELETON: "contextMap.copySkeleton",
	COPY_FULL: "contextMap.copyFull",
	GENERATE_CUSTOM: "contextMap.generateCustom",
} as const;

export const MESSAGES = {
	SUCCESS: {
		TREE_COPIED: "Project Map copied!",
		CONTEXT_COPIED: "Context copied to clipboard!",
	},
	ERRORS: {
		NO_FOLDER: "Please select a folder.",
		NO_WORKSPACE: "Context Map needs an open workspace folder.",
		GENERIC: "Failed to generate context.",
	},
} as const;

export const MODE_PICK_ITEM = {
	TreeSimple: { label: "Copy Tree (Structure Only)", description: "tree-simple" },
	TreeSmart: { label: "Copy Tree (With Exports)", description: "tree-smart" },
	Skeleton: { label: "Copy Code Skeletons", description: "skeleton" },
	Full: { label: "Copy Full Content", description: "full" },
} as const;

export const CONFIG_INPUT_STORAGE_KEY = "contextMap.configInputHistory";

export const CONFIG_INPUT_PLACEHOLDER = 'depth patterns, e.g. "3 *.js|*.test.ts"';

// Sentinel id used to identify the synthetic "use what I typed" QuickPick item,
// distinct from any real history entry.
export const FREE_ENTRY_ITEM_ID = "contextMap.freeEntry";

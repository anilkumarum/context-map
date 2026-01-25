export const EXTENSION_ID = {
	NAME: "context-map",
	DisplayName: "Context Map",
} as const;

export const COMMANDS = {
	COPY_TREE_SIMPLE: "contextMap.copyTreeSimple",
	COPY_TREE_SMART: "contextMap.copyTreeSmart",
	COPY_SKELETON: "contextMap.copySkeleton",
	COPY_FULL: "contextMap.copyFull",
} as const;

export const MESSAGES = {
	SUCCESS: {
		TREE_COPIED: "Project Map copied!",
		CONTEXT_COPIED: "Context copied to clipboard!",
	},
	ERRORS: {
		NO_FOLDER: "Please select a folder.",
		GENERIC: "Failed to generate context.",
	},
} as const;

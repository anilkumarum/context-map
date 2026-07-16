export const TREE_MODE = {
	Simple: "simple",
	Smart: "smart",
} as const;

export type TreeMode = (typeof TREE_MODE)[keyof typeof TREE_MODE];

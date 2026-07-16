export interface ParsedConfigInput {
	maxDepth: number; // 0 = unlimited
	extraIgnorePatterns: string[];
}

const DEFAULT_MAX_DEPTH = 0; // unlimited, per user decision

/**
 * Parses the free-text F1 input into depth + ignore patterns.
 *
 * Format: "<depth> <pattern1>|<pattern2>|..."
 * - Depth is optional; when present it must be the first whitespace-delimited
 *   token and a non-negative integer. "0" means unlimited.
 * - Patterns are pipe-separated and use gitignore syntax.
 * - Surrounding quotes around the pattern segment are optional and stripped.
 *
 * Examples:
 *   "3 *.js|*.test.ts" -> { maxDepth: 3, extraIgnorePatterns: ["*.js", "*.test.ts"] }
 *   "0 *.log"           -> { maxDepth: 0, extraIgnorePatterns: ["*.log"] }
 *   "*.spec.ts"         -> { maxDepth: 0, extraIgnorePatterns: ["*.spec.ts"] }
 *   "5"                 -> { maxDepth: 5, extraIgnorePatterns: [] }
 *   ""                  -> { maxDepth: 0, extraIgnorePatterns: [] }
 */
export function parseConfigInput(rawInput: string): ParsedConfigInput {
	const trimmedInput = rawInput.trim();
	if (trimmedInput === "") return { maxDepth: DEFAULT_MAX_DEPTH, extraIgnorePatterns: [] };

	const firstSpaceIndex = trimmedInput.indexOf(" ");
	const firstToken = firstSpaceIndex === -1 ? trimmedInput : trimmedInput.slice(0, firstSpaceIndex);
	const isDepthToken = /^\d+$/.test(firstToken);

	const maxDepth = isDepthToken ? Number.parseInt(firstToken, 10) : DEFAULT_MAX_DEPTH;
	const patternSegmentRaw = isDepthToken ? trimmedInput.slice(firstSpaceIndex + 1).trim() : trimmedInput;
	const patternSegment = stripSurroundingQuotes(isDepthToken && firstSpaceIndex === -1 ? "" : patternSegmentRaw);

	const extraIgnorePatterns = patternSegment === "" ? [] : patternSegment.split("|").map((pattern) => pattern.trim());

	return { maxDepth, extraIgnorePatterns };
}

function stripSurroundingQuotes(value: string): string {
	const isWrappedInQuotes = value.length >= 2 && value.startsWith('"') && value.endsWith('"');
	return isWrappedInQuotes ? value.slice(1, -1) : value;
}

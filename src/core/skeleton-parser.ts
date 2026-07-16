import ts from "typescript";

interface Replacement {
	start: number;
	end: number;
	text: string;
}

/**
 * Scans top-level exports for the directory tree summary.
 */
export function scanExports(sourceText: string): string[] {
	const sourceFile = ts.createSourceFile("temp.ts", sourceText, ts.ScriptTarget.Latest, true);

	const exports: string[] = [];

	const KIND_TO_LABEL: Record<number, string> = {
		[ts.SyntaxKind.ClassDeclaration]: "class",
		[ts.SyntaxKind.InterfaceDeclaration]: "iface",
		[ts.SyntaxKind.FunctionDeclaration]: "func",
		[ts.SyntaxKind.TypeAliasDeclaration]: "type",
		[ts.SyntaxKind.EnumDeclaration]: "enum",
	};

	ts.forEachChild(sourceFile, (node) => {
		// FIX: Use modern TS API for modifiers
		const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;

		const isExported = modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
		const isDefault = modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);

		if (isExported || isDefault) {
			// Handle Variables (export const x = ...)
			if (ts.isVariableStatement(node)) {
				node.declarationList.declarations.forEach((decl) => {
					if (ts.isIdentifier(decl.name)) {
						exports.push(`const ${decl.name.text}`);
					}
				});
				return;
			}

			// Handle Named Declarations
			const label = KIND_TO_LABEL[node.kind];
			// cast to any to access 'name' safely as we checked kind
			if (label && (node as any).name && ts.isIdentifier((node as any).name)) {
				exports.push(`${label} ${(node as any).name.text}`);
			}
		}
	});

	return exports;
}

/**
 * Parses TypeScript source code and removes implementation details.
 * Retains: Imports, Exports, Interfaces, Types, Class Signatures, Method Signatures.
 * Replaces: Function/Method bodies with a comment or empty block.
 *
 * @param sourceText - The original raw source code.
 * @returns The skeleton code.
 */
export function extractSkeleton(sourceText: string): string {
	// 1. Create AST from source
	// We use latest script target to support modern features like top-level await
	const sourceFile = ts.createSourceFile(
		"temp.ts",
		sourceText,
		ts.ScriptTarget.Latest,
		true, // setParentNodes
	);

	const replacements: Replacement[] = [];

	// 2. Define the visitor to find blocks to strip
	const visit = (node: ts.Node) => {
		// Check for Function-like nodes (Functions, Methods, Constructors, Accessors, ArrowFunctions)
		if (
			ts.isFunctionDeclaration(node) ||
			ts.isMethodDeclaration(node) ||
			ts.isConstructorDeclaration(node) ||
			ts.isGetAccessor(node) ||
			ts.isSetAccessor(node) ||
			ts.isArrowFunction(node) ||
			ts.isFunctionExpression(node)
		) {
			const body = node.body;

			// We only strip Block bodies { ... }
			// We do NOT strip expression bodies (e.g., const add = (a,b) => a + b) as they are usually short.
			if (body && ts.isBlock(body)) {
				// We found a body block. Calculate positions.
				// We want to keep the outer braces if possible, or replace the whole thing.
				// Strategy: Replace everything between the opening '{' and closing '}'

				// body.pos includes leading whitespace/comments, so we use body.getStart()
				const start = body.getStart(sourceFile);
				const end = body.getEnd();

				// Check if the block is already empty or just has comments?
				// For simplicity, we strictly enforce the replacement.

				replacements.push({
					start: start,
					end: end,
					text: "{ // ... }",
				});

				// Do NOT recurse into the body we just stripped.
				return;
			}
		}

		// Continue traversing children (e.g., inside Classes to find methods)
		ts.forEachChild(node, visit);
	};

	// 3. Start Traversal
	visit(sourceFile);

	// 4. Apply replacements
	// IMPORTANT: Apply in reverse order (bottom-up) so indexes don't shift
	replacements.sort((a, b) => b.start - a.start);

	let result = sourceText;
	for (const r of replacements) {
		const head = result.substring(0, r.start);
		const tail = result.substring(r.end);
		result = head + r.text + tail;
	}

	return result;
}

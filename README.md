# Context Map

**Context Map** is a VS Code extension designed for LLM-assisted development. It exports your codebase context in a token-efficient format optimized for AI models like Claude 4.5 Sonnet, GPT-5, and Gemini 3 Pro.

## Features

### 1. 🌲 Copy Folder Tree

Generates a clean ASCII directory tree of the selected folder (or workspace).

- **Smart:** Respects your `.gitignore` automatically.
- **Usage:** Right-click a folder in Explorer -> `Copy Folder Tree`.

### 2. 🦴 Copy Code Skeleton

Extracts the "Shape" of your code without the implementation details.

- **Why:** Saves 60-80% of tokens while giving the AI full knowledge of your types, interfaces, and method signatures.
- **How:** Right-click file(s) -> `Copy Code Skeleton`.
- **Format:** Wraps output in XML tags (`<file path="...">`) for best AI comprehension.

## Architecture

This extension follows a **Functional Core, Imperative Shell** architecture.

- `src/core`: Pure TypeScript logic (AST parsing, Tree generation). Zero VS Code dependencies.
- `src/vscode`: Adapter layer for the VS Code API.

## Requirements

- VS Code 1.100.0+

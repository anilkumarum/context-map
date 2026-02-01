# 🗺️ Context Map for VS Code

> **Stop wasting tokens. Give your AI the Blueprint.**

**Context Map** is the ultimate tool for developers using LLMs (ChatGPT, Claude 3.5 Sonnet, Gemini, DeepSeek). It allows you to export your codebase structure and context in a **token-efficient** format, specifically designed to help AI models understand your architecture without reading every single line of code.

![Context Map Hero Image](https://raw.githubusercontent.com/yourusername/context-map/main/images/hero-banner.png)
_(Caption: Right-click any folder to generate instant context for your AI)_

---

## 🛑 The Problem

When coding with AI, you face two major issues:

1.  **Token Limits:** Pasting your entire project bloats the context window, causing the AI to "forget" earlier instructions or crash.
2.  **Context Blindness:** If you only paste one file, the AI doesn't understand your project structure, types, or utility functions.

## ✅ The Solution

**Context Map** extracts the **Skeleton** of your code. It removes implementation details (function bodies) but keeps the "Shape" (Classes, Interfaces, Methods, Exports).

- **Result:** You give the AI 100% of the architectural context using only 10% of the tokens.

---

## ⚡ Key Features

- **🌲 Intelligent Tree Generation:** Generates ASCII directory trees. Unlike standard `tree` commands, it can peek inside files to list top-level exports (e.g., `(class User, func login)`).
- **🦴 Code Skeletons (The Killer Feature):** Extracts definitions while stripping implementation logic.
  - `function add(a, b) { return a + b }` → `function add(a, b) { // ... }`
- **🚀 Recursive & Smart:** Works on folders or individual files. Automatically respects your `.gitignore`.
- **⚡ Zero-Friction Output:** Opens results in a **Temporary "Notepad" Tab**.
  - No "Save changes?" dialogs when closing.
  - Auto-copies to clipboard.
- ** XML-Wrapped:** Formats output in `<file path="...">` tags, the preferred format for Claude and GPT-4.

---

## 📖 Feature Guide & Output Examples

When you right-click a folder (e.g., `src/`) and select **Context Map**, you get 4 powerful options. Here is what they produce:

### 1. 🌲 Copy Tree (Structure Only)

**Best for:** Starting a new chat to explain file organization.

```text
src/
├── components/
│   ├── header.ts
│   └── footer.ts
└── utils/
    └── api.ts
```

### 2. 🧠 Copy Tree (With Exports)

**Best for:** Asking "Where is the login logic located?"
**Why:** It scans files to show you _what_ is inside them without opening them.

```text
src/
├── components/
│   ├── header.ts (class Header, interface HeaderProps)
│   └── footer.ts (const Footer)
└── utils/
    └── api.ts (func fetchData, class ApiClient)
```

### 3. 🦴 Copy Code Skeletons (Recommended)

**Best for:** "Here is my architecture, write a new feature for me."
**Why:** Provides full type definitions and method signatures but hides the body logic. Massive token savings.

```text
src/
├── utils/
│   └── api.ts (class ApiClient)

<file path="src/utils/api.ts">
export class ApiClient {
    private baseUrl: string;
    constructor(url: string) { // ... }

    async get(endpoint: string): Promise<any> { // ... }

    async post(endpoint: string, data: any): Promise<void> { // ... }
}
</file>
```

### 4. 📄 Copy Full Content

**Best for:** Debugging specific files or refactoring.
**Why:** Standard copy-paste, but formatted recursively with XML tags so the AI knows which file is which.

```text
<file path="src/utils/api.ts">
export class ApiClient {
    private baseUrl: string;
    constructor(url: string) {
        this.baseUrl = url;
    }
    // ... full implementation ...
}
</file>
```

---

## 📸 Visual Tutorial

### Step 1: Right-Click

Navigate to the File Explorer. Select a folder (or a group of files). Right-click and hover over **Context Map**.

![Context Menu Screenshot](https://raw.githubusercontent.com/yourusername/context-map/main/images/context-menu-demo.png)
_(Caption: Clean submenu organizes the 4 export modes)_

### Step 2: Instant Output

The extension instantly generates a temporary markdown file. It is **Read-Only** by default (so you don't accidentally edit it) but acts like a scratchpad.

![Output Window Screenshot](https://raw.githubusercontent.com/yourusername/context-map/main/images/output-preview.png)
_(Caption: Result opens side-by-side. Copy is auto-triggered. Close the tab without saving.)_

---

## ⚙️ How to Configure

### Keyboard Shortcuts

For power users, we provide a default keybinding for the most common action (**Copy Code Skeletons**).

- **Windows/Linux:** `Ctrl` + `Alt` + `T`
- **Mac:** `Cmd` + `Opt` + `T`

> **Note:** This shortcut only triggers when you have a **Folder** selected in the File Explorer.

### Customizing Keys

You can change this in VS Code:

1.  Press `Ctrl+K` `Ctrl+S` (Keyboard Shortcuts).
2.  Search for `contextMap`.
3.  Bind your preferred keys to `contextMap.copySkeleton` or `contextMap.copyTreeSmart`.

---

## 📦 Installation

1.  Open VS Code.
2.  Press `Ctrl+P` / `Cmd+P`.
3.  Type `ext install yourname.context-map`.
4.  (Or search "Context Map" in the Extensions Marketplace).

---

## ❓ FAQ

**Q: Does it send my code to the cloud?**
A: **No.** All processing happens locally on your machine. The text is copied to your clipboard/editor for _you_ to paste into your AI tool.

**Q: Does it work with `.gitignore`?**
A: **Yes.** It automatically detects your `.gitignore` file and excludes `node_modules`, `dist`, `.env`, and other ignored files to keep the context clean.

**Q: Why "Skeletons"?**
A: LLMs are autocomplete engines. If you give them the function signature `saveUser(user: User): Promise<void>`, they usually guess the implementation correctly. You don't need to waste 50 tokens showing the boilerplate code inside.

---

**Enjoy coding with 10x Context!** 🚀
_Built for the AI-Native Developer._

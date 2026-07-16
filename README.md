# Context Map

**Stop pasting your whole codebase into ChatGPT/Claude. Give your AI the blueprint instead.**

Context Map turns any folder or file in your project into a clean, AI-ready summary — copied straight to your clipboard — so you can paste it into ChatGPT, Claude, Gemini, or any other AI chat and get better answers, faster, without burning through token limits.

---

## The problem this solves

If you've ever coded with an AI chat assistant, you've probably run into one of these:

- **You paste too much code**, the AI hits its limit, and it "forgets" what you told it earlier in the conversation.
- **You paste too little code** (just one file), and the AI has no idea about your project structure, your types, or the helper functions you already wrote — so it guesses, and gets it wrong.

Context Map fixes both problems at once. Right-click a folder, pick an option, and you get a compact, well-organized snapshot of your project that gives the AI everything it needs to understand your codebase — using a fraction of the text a full copy-paste would take.

---

## Top features

- **📋 One-click copy, right from the file explorer.** Right-click any folder or file, pick an option, and your project context is instantly on your clipboard — ready to paste into any AI chat.
- **🌲 Instant project trees.** Generate a clean, readable folder structure in seconds, so you (or the AI) can see how your project is organized at a glance.
- **🧠 Smart trees with a peek inside each file.** Instead of just file names, see what's actually defined in each file — classes, functions, types — without opening a single one.
- **🦴 Code Skeletons — the standout feature.** Get the _shape_ of your code (class names, function signatures, types) with the internal logic stripped out. This gives an AI almost all the understanding it needs from a fraction of the text.
- **📄 Full content export**, when you really do want to hand over complete files — still neatly labeled so the AI knows exactly which file is which.
- **🙈 Respects your `.gitignore` automatically.** Your `node_modules`, build folders, and other clutter are never included.
- **🎛️ Custom export command** (via the Command Palette) for when you want to fine-tune how deep the folder tree goes, or exclude extra files/folders just for that one export — without touching your `.gitignore`.
- **🗒️ Smart output handling.** Your result is always copied to the clipboard, and also opened in a temporary file so you can review it — with nothing to save or clean up afterward.

---

## Why use this instead of just copy-pasting?

- **You'll get noticeably better answers from your AI.** Most people copy-paste one file at a time and wonder why the AI keeps suggesting things that don't fit their codebase. Giving it real project context fixes that.
- **You save a huge amount of manual work.** No more opening ten tabs, copying each one, and labeling them so the AI knows what's what — Context Map does all of that in one click.
- **You stay in control of what you share.** You choose the folder, the mode, and (with the custom command) exactly what to include or leave out.
- **It's fast enough to use constantly**, not just for big "let me explain my whole project" moments. Many people reach for it every time they start a new AI conversation about their code.
- **It's completely free**, with no account, sign-up, or configuration required to get started.

---

## How to use it

### The quick way (right-click menu)

1. In the file explorer, right-click any **folder** (or a single file).
2. Choose **Context Map** from the menu.
3. Pick one of the four options:
   - **Copy Tree (Structure Only)** — just the folder layout.
   - **Copy Tree (With Exports)** — folder layout, plus a peek at what each file contains.
   - **Copy Code Skeletons** — the recommended option for most AI coding conversations.
   - **Copy Full Content** — complete file contents, neatly labeled.
4. That's it — the result is already on your clipboard. Paste it straight into your AI chat.

### What each mode actually outputs

**Copy Tree (Structure Only)** — just the shape of your folders:

```text
src/
├── components/
│   ├── header.ts
│   └── footer.ts
└── utils/
    └── api.ts
```

**Copy Tree (With Exports)** — same tree, but with a peek at what's inside each file, so you (or the AI) can find things without opening them:

```text
src/
├── components/
│   ├── header.ts (class Header, interface HeaderProps)
│   └── footer.ts (const Footer)
└── utils/
    └── api.ts (func fetchData, class ApiClient)
```

**Copy Code Skeletons** — the recommended mode. Full type signatures, with the actual logic stripped out, wrapped in tags so the AI knows exactly which file it's reading:

```text
src/
└── utils/
    └── api.ts (class ApiClient)

<file path="src/utils/api.ts">
export class ApiClient {
    private baseUrl: string;
    constructor(url: string) { // ... }
    async get(endpoint: string): Promise<any> { // ... }
    async post(endpoint: string, data: any): Promise<void> { // ... }
}
</file>
```

**Copy Full Content** — complete, unmodified file contents, still labeled so nothing gets mixed up:

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

### The custom way (Command Palette)

Open the Command Palette (**F1**, or **Ctrl+Shift+P** / **Cmd+Shift+P** on Mac) and run:

> **Context Map: Generate (Custom Depth/Ignore)**

This walks you through the same four options, but also lets you set:

- **How deep** the folder tree should go (handy for large projects).
- **Extra files or patterns to skip** for this export only, on top of your `.gitignore`.

Your last few custom settings are remembered in a searchable dropdown, so repeat exports are just a couple of clicks.

#### How to write the depth/ignore input

After picking a mode, you'll get one text box for both settings, in this format:

```text
<depth> <pattern1>|<pattern2>|<pattern3>
```

- **Depth** is a plain number, and it's optional. Leave it out if you don't need it.
- **Ignore patterns** go after the depth, separated by `|` if you have more than one. They use the same syntax as `.gitignore`, and they're added _on top of_ your existing `.gitignore` — they don't replace it.
- **`0` for depth means unlimited** — go as deep as the folder actually goes.
- You can provide just a depth, just patterns, or both, or leave the box empty to use the defaults.

**Examples:**

| You type                     | What it means                                                         | Result                                                                           |
| ---------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `3 *.js\|*.test.ts`          | Go 3 folders deep; also skip any `.js` files and any `.test.ts` files | Tree stops after 3 levels; `.js` and `.test.ts` files never appear in the output |
| `0 *.log`                    | Unlimited depth; skip `.log` files                                    | Full folder tree, no matter how deep, with log files excluded                    |
| `*.spec.ts`                  | No depth limit given; skip `.spec.ts` files                           | Default depth is used, `.spec.ts` files are excluded                             |
| `5`                          | Go 5 folders deep; no extra ignore patterns                           | Tree stops after 5 levels, nothing extra excluded beyond `.gitignore`            |
| _(empty — just press Enter)_ | Use defaults for both                                                 | Unlimited depth, no extra patterns beyond `.gitignore`                           |

A quick real-world one: say you're exporting a large `src/` folder and want to hand the AI just the shape of things, three levels deep, without any of your test files getting in the way:

```text
3 *.test.ts|*.spec.ts
```

That's it — type it once, and it'll show up in your dropdown next time so you can reuse it with a click.

---

## Video Tour

_(Video links coming soon — each one below covers a specific part of the extension.)_

1. **📺 Getting Started** — installing Context Map and generating your first export. `[VIDEO LINK PLACEHOLDER 1]`
2. **📺 Tree vs. Smart Tree vs. Skeleton vs. Full** — what each of the four modes actually gives you, side by side. `[VIDEO LINK PLACEHOLDER 2]`
3. **📺 Code Skeletons in depth** — the featured mode, and why it's the best starting point for most AI conversations. `[VIDEO LINK PLACEHOLDER 3]`
4. **📺 The Custom Command** — setting tree depth and extra ignore patterns from the Command Palette. `[VIDEO LINK PLACEHOLDER 4]`
5. **📺 Real-world workflow** — a full example: exporting a project and pasting it into an AI chat to get a new feature built. `[VIDEO LINK PLACEHOLDER 5]`

---

## Found a bug or have an idea?

Context Map is actively maintained. If something doesn't work right, or you'd like to see a new feature, please open an issue on GitHub:

**👉 [Report a bug or request a feature](https://github.com/anilkumarum/context-map/issues)**

When reporting a bug, it helps a lot if you include:

- What you clicked / which command you ran
- What you expected to happen
- What happened instead

---

## License, pricing & support

- **Price:** Free, with no limitations.
- **License:** [GPL-3.0-only](https://www.gnu.org/licenses/gpl-3.0.html)
- **Support:** Handled entirely through GitHub Issues — see the link above.

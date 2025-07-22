# 🧩 Shadcn + Tailwind CSS Installer for Vite

A CLI tool to quickly install and configure **[shadcn/ui](https://ui.shadcn.dev/)** and **Tailwind CSS** in your **Vite + React** project with support for both **TypeScript** and **JavaScript** setups.

---

## 🚀 Features

- 📦 Installs `tailwindcss`, `@tailwindcss/vite`, and `@shadcn/ui`
- ⚙️ Adds `@` path alias in `tsconfig.json` or `jsconfig.json`
- 🔧 Patches or replaces `vite.config.ts/js` with preconfigured templates
- 🪄 Initializes `shadcn/ui` with `npx shadcn@latest init`
- 🧱 Creates or updates `src/index.css` with `@import "tailwindcss"`
- 🧪 Supports both **TypeScript** and **JavaScript** projects

---

## 📦 Installation

You can use the CLI with `npx` (no install required):

```bash
npx shadcn-vite-installer
```

---

## 🛠️ Usage

In the **root** of your existing **Vite + React** project:

```bash
npx shadcn-vite-installer
```

Detects project language either:

- **JavaScript**
- **TypeScript**

The CLI will handle:

- Installing required dependencies
- Setting up Tailwind + shadcn
- Configuring `vite.config.ts` / `vite.config.js`
- Creating/patching `tsconfig.json`, `jsconfig.json`, `components.json` and `index.css`

---

## 📁 Folder Structure

```
shadcn-vite-installer/
├── bin/
│   └── index.js            # CLI entry point
├── templates/
│   ├── js/
│   │   └── vite.config.js
│   └── ts/
│       ├── vite.config.ts
│       └── tsconfig.app.json
├── package.json
└── README.md
```

---

## 🤝 Contributing

Feel free to open an issue or submit a PR to improve the CLI, add new config options, or support other frameworks like Solid, Vue, etc.

---

## 🧑‍💻 Author

Made with ❤️ by Yash Bhut

---

## 📄 License

[MIT](./LICENSE)

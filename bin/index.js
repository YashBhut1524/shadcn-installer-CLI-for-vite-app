#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse, modify, applyEdits } from "jsonc-parser";
import chalk from "chalk";

// ESM __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Patch or create alias in ts/jsconfig.jsonc config safely
function ensureAliasInJsoncFile(filePath) {
	let text = "";
	if (fs.existsSync(filePath)) {
		text = fs.readFileSync(filePath, "utf-8");
	} else {
		text = "{}";
	}
	let data = parse(text) ?? {};
	let editsNeeded = false;

	data.compilerOptions = data.compilerOptions || {};
	if (!("baseUrl" in data.compilerOptions)) {
		data.compilerOptions.baseUrl = ".";
		editsNeeded = true;
	}
	if (!("paths" in data.compilerOptions)) {
		data.compilerOptions.paths = { "@/*": ["./src/*"] };
		editsNeeded = true;
	} else if (!data.compilerOptions.paths["@/*"]) {
		data.compilerOptions.paths["@/*"] = ["./src/*"];
		editsNeeded = true;
	}

	if (editsNeeded) {
		let edits = modify(text, ["compilerOptions"], data.compilerOptions, {
			formattingOptions: { insertSpaces: true, tabSize: 2 },
		});
		const newText = applyEdits(text, edits);
		fs.writeFileSync(filePath, newText);
	}
}

// Patch or replace Vite config if necessary
function patchViteConfig(viteConfigPath, language, templateDir) {
	if (!fs.existsSync(viteConfigPath)) return false;

	let configText = fs.readFileSync(viteConfigPath, "utf8");
	const hasTailwind = /@tailwindcss\/vite/.test(configText);
	const hasAlias = /alias\s*:\s*{[^}]*@/.test(configText);

	if (!hasTailwind || !hasAlias) {
		const templateFile = path.join(
			templateDir,
			language === "ts" ? "vite.config.ts" : "vite.config.js"
		);
		const newContent = fs.readFileSync(templateFile, "utf8");
		fs.writeFileSync(viteConfigPath, newContent);
		return true;
	}
	return false;
}

// Detect whether the project is using JS or TS
function detectLanguage() {
	const srcDir = path.join(process.cwd(), "src");
	const tsxExists = fs.existsSync(path.join(srcDir, "App.tsx"));
	const jsxExists = fs.existsSync(path.join(srcDir, "App.jsx"));

	if (tsxExists) return "ts";
	if (jsxExists) return "js";

	return "js";
}

async function main() {
	const language = detectLanguage();

	console.log("⚙️ Setting up shadcn/ui and Tailwind CSS, please wait...\n");

	try {
		execSync("npm install tailwindcss @tailwindcss/vite @shadcn/ui", { stdio: "ignore" });
		if (language === "ts") {
			execSync("npm install -D @types/node", { stdio: "ignore" });
		}
	} catch (e) {
		console.error("❌ Error installing dependencies.");
		process.exit(1);
	}

	// src/index.css
	try {
		const indexCSS = path.join(process.cwd(), "src", "index.css");
		fs.writeFileSync(indexCSS, '@import "tailwindcss";\n');
	} catch (e) {
		console.error("❌ Could not write to src/index.css. Make sure you are in the root of a Vite app.");
		process.exit(1);
	}

	const templateDir = path.join(__dirname, "..", "templates", language === "ts" ? "ts" : "js");
	try {
		if (language === "ts") {
			const tsconfigPath = path.join(process.cwd(), "tsconfig.json");
			ensureAliasInJsoncFile(tsconfigPath);

			const tsconfigAppPath = path.join(process.cwd(), "tsconfig.app.json");
			if (fs.existsSync(tsconfigAppPath)) {
				ensureAliasInJsoncFile(tsconfigAppPath);
			} else {
				const tsAppTemplate = path.join(templateDir, "tsconfig.app.json");
				if (fs.existsSync(tsAppTemplate)) {
					fs.copyFileSync(tsAppTemplate, tsconfigAppPath);
					ensureAliasInJsoncFile(tsconfigAppPath);
				}
			}
		} else {
			const jsconfigPath = path.join(process.cwd(), "jsconfig.json");
			ensureAliasInJsoncFile(jsconfigPath);
		}
	} catch (e) {
		console.error("❌ Error patching tsconfig/jsconfig.");
		process.exit(1);
	}

	// Vite config
	try {
		const viteConfigFile = language === "ts" ? "vite.config.ts" : "vite.config.js";
		const viteConfigDst = path.join(process.cwd(), viteConfigFile);
		if (fs.existsSync(viteConfigDst)) {
			patchViteConfig(viteConfigDst, language, templateDir);
		} else {
			const viteConfigSrc = path.join(templateDir, viteConfigFile);
			fs.copyFileSync(viteConfigSrc, viteConfigDst);
		}
	} catch (e) {
		console.error("❌ Error updating vite.config.");
		process.exit(1);
	}

	// shadcn/ui: init
	try {
		execSync("npx shadcn@latest init -y", { stdio: "ignore" });
	} catch (e) {
		console.error("❌ Error during shadcn/ui initialization. Try running 'npx shadcn@latest init' manually.");
		process.exit(1);
	}

	console.log("✅ shadcn/ui and Tailwind CSS are installed and configured!");
	console.log("Now use 'npx shadcn add [component]' as needed, e.g.:");
	console.log("  npx shadcn add button\n");
	console.log("Happy coding! 🚀");
}

main();

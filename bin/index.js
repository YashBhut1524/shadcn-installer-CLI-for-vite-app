#!/usr/bin/env node

import inquirer from "inquirer";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse, modify, applyEdits } from "jsonc-parser";

// ESM __dirname workaround for file paths
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
        // Use jsonc edit calculation to preserve formatting/comments
        let edits = modify(
            text,
            ["compilerOptions"],
            data.compilerOptions,
            { formattingOptions: { insertSpaces: true, tabSize: 2 } }
        );
        const newText = applyEdits(text, edits);
        fs.writeFileSync(filePath, newText);
        console.log(`Updated ${path.basename(filePath)} with required alias.`);
    } else {
        console.log(`${path.basename(filePath)} already has the path alias.`);
    }
}

// Patch or replace Vite config if necessary
function patchViteConfig(viteConfigPath, language, templateDir) {
    if (!fs.existsSync(viteConfigPath)) return false;

    let configText = fs.readFileSync(viteConfigPath, "utf8");

    // Check for @vitejs/plugin-react, @tailwindcss/vite, and the alias "@"
    const hasTailwind = /@tailwindcss\/vite/.test(configText);
    const hasAlias = /alias\s*:\s*{[^}]*@/.test(configText);

    if (!hasTailwind || !hasAlias) {
        // Use template config to fully replace
        const templateFile = path.join(
            templateDir,
            language === "TypeScript" ? "vite.config.ts" : "vite.config.js"
        );
        const newContent = fs.readFileSync(templateFile, "utf8");

        fs.writeFileSync(viteConfigPath, newContent);
        console.log(`Updated ${path.basename(viteConfigPath)} with required plugins and alias.`);
        return true;
    }
    console.log(
        `${path.basename(viteConfigPath)} already contains plugins and alias. No changes needed.`
    );
    return false;
}

async function main() {
    // 1. Prompt
    const { language } = await inquirer.prompt([
        {
            type: "list",
            name: "language",
            message: "Which language does your project use?",
            choices: ["JavaScript", "TypeScript"],
        },
    ]);

    // 2. Install dependencies
    console.log("Installing TailwindCSS, shadcn/ui, and related dependencies...");
    execSync("npm install tailwindcss @tailwindcss/vite @shadcn/ui", { stdio: "inherit" });
    if (language === "TypeScript") {
        execSync("npm install -D @types/node", { stdio: "inherit" });
    }

    // 3. index.css
    const indexCSS = path.join(process.cwd(), "src", "index.css");
    try {
        fs.writeFileSync(indexCSS, '@import "tailwindcss";\n');
    } catch (e) {
        console.error("⚠️  Could not write to src/index.css. Make sure you are in the root of a Vite app.");
        process.exit(1);
    }

    // 4. Alias config
    const templateDir = path.join(__dirname, "..", "templates", language === "TypeScript" ? "ts" : "js");
    if (language === "TypeScript") {
        // tsconfig.json
        const tsconfigPath = path.join(process.cwd(), "tsconfig.json");
        ensureAliasInJsoncFile(tsconfigPath);

        // tsconfig.app.json (patch/create if necessary)
        const tsconfigAppPath = path.join(process.cwd(), "tsconfig.app.json");
        if (fs.existsSync(tsconfigAppPath)) {
            ensureAliasInJsoncFile(tsconfigAppPath);
        } else {
            const tsAppTemplate = path.join(templateDir, "tsconfig.app.json");
            if (fs.existsSync(tsAppTemplate)) {
                fs.copyFileSync(tsAppTemplate, tsconfigAppPath);
                ensureAliasInJsoncFile(tsconfigAppPath);
                console.log("Created tsconfig.app.json with alias.");
            }
        }
    } else {
        // jsconfig.json
        const jsconfigPath = path.join(process.cwd(), "jsconfig.json");
        ensureAliasInJsoncFile(jsconfigPath);
    }

    // 5. Vite config (patch if needed)
    const viteConfigFile = language === "TypeScript" ? "vite.config.ts" : "vite.config.js";
    const viteConfigDst = path.join(process.cwd(), viteConfigFile);

    if (fs.existsSync(viteConfigDst)) {
        patchViteConfig(viteConfigDst, language, templateDir);
    } else {
        const viteConfigSrc = path.join(templateDir, viteConfigFile);
        fs.copyFileSync(viteConfigSrc, viteConfigDst);
        console.log(`Created ${viteConfigFile}`);
    }

    // 6. shadcn/ui: init
    try {
        console.log("\nInitializing shadcn/ui...");
        execSync("npx shadcn@latest init -y", { stdio: "inherit" });
    } catch (e) {
        console.log("⚠️  shadcn init may require user input. If setup is not complete, run 'npx shadcn@latest init' manually.");
    }

    // 7. Success message
    console.log("\n✅ All set! shadcn/ui and TailwindCSS are installed and configured.");
    console.log("You can now use 'npx shadcn add [component]' to install individual components as needed.\n");
    console.log("Example:");
    console.log("  npx shadcn add button");
    console.log("\nHappy coding! 🚀");
}

main();

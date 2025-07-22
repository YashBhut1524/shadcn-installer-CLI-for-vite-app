import { execa } from "execa";
import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const indexCssPath = path.resolve("src/index.css");
const viteConfigPath = (lang) => `vite.config.${lang === "TypeScript" ? "ts" : "js"}`;

export async function setupProject(language) {
    const isTs = language === "TypeScript";

    console.log(chalk.yellow("📦 Installing TailwindCSS and ShadCN..."));
    await execa("npm", ["install", "-D", "tailwindcss", "@tailwindcss/vite"], { stdio: "inherit" });

    console.log(chalk.yellow("📁 Updating src/index.css..."));
    await fs.writeFile(indexCssPath, `@import "tailwindcss";\n`);

    if (isTs) {
        console.log(chalk.green("🛠 Setting up tsconfig.json..."));
        const tsconfig = {
            files: [],
            references: [
                { path: "./tsconfig.app.json" },
                { path: "./tsconfig.node.json" }
            ],
            compilerOptions: {
                baseUrl: ".",
                paths: {
                    "@/*": ["./src/*"]
                }
            }
        };
        const tsconfigApp = {
            compilerOptions: {
                baseUrl: ".",
                paths: {
                    "@/*": ["./src/*"]
                }
            }
        };
        await fs.writeFile("tsconfig.json", JSON.stringify(tsconfig, null, 2));
        await fs.writeFile("tsconfig.app.json", JSON.stringify(tsconfigApp, null, 2));
        await execa("npm", ["install", "-D", "@types/node"], { stdio: "inherit" });
    } else {
        console.log(chalk.green("🛠 Creating jsconfig.json..."));
        const jsconfig = {
            compilerOptions: {
                baseUrl: ".",
                paths: {
                    "@/*": ["./src/*"]
                }
            }
        };
        await fs.writeFile("jsconfig.json", JSON.stringify(jsconfig, null, 2));
    }

    console.log(chalk.magenta("🔧 Modifying vite.config..."));
    const viteConfigContent = `
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
`;
    await fs.writeFile(viteConfigPath(language), viteConfigContent.trim() + "\n");

    console.log(chalk.greenBright("\n✅ Setup Complete! You're ready to use Shadcn + Tailwind!\n"));
}

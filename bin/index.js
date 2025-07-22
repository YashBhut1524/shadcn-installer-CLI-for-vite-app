import inquirer from "inquirer";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const { language } = await inquirer.prompt([
        {
            type: "list",
            name: "language",
            message: "Which language do you want to use?",
            choices: ["JavaScript", "TypeScript"],
        },
    ]);

    // 1. Install Vite, React, Tailwind, and shadcn dependencies
    console.log("Installing Vite, TailwindCSS, shadcn, and dependencies...");
    if (language === "TypeScript") {
        execSync("npm create vite@latest . -- --template react-ts", { stdio: "inherit" });
    } else {
        execSync("npm create vite@latest . -- --template react", { stdio: "inherit" });
    }

    execSync("npm install tailwindcss @tailwindcss/vite @shadcn/ui", { stdio: "inherit" });

    // Install type definitions for TS
    if (language === "TypeScript") {
        execSync("npm install -D @types/node", { stdio: "inherit" });
    }

    // 2. Add Tailwind import to src/index.css
    fs.writeFileSync(path.join(process.cwd(), "src", "index.css"), '@import "tailwindcss";\n');

    // 3. Add config files
    const templateDir = path.join(__dirname, "..", "templates", language === "TypeScript" ? "ts" : "js");
    const files = fs.readdirSync(templateDir);

    files.forEach((file) => {
        const content = fs.readFileSync(path.join(templateDir, file));
        fs.writeFileSync(path.join(process.cwd(), file), content);
    });

    // JS path alias config
    if (language === "JavaScript") {
        fs.writeFileSync(
            path.join(process.cwd(), "jsconfig.json"),
            fs.readFileSync(path.join(templateDir, "jsconfig.json"))
        );
    }

    // 4. Success message
    console.log("\n✅ shadcn, TailwindCSS, and project config installed & ready!");
}

main();

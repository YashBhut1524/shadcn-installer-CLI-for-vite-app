import inquirer from "inquirer";
import chalk from "chalk";
import { setupProject } from "../utils/setupProject.js";

console.log(chalk.cyan("\n✨ Shadcn + Tailwind Installer for Vite ✨\n"));

const { language } = await inquirer.prompt([
    {
        type: "list",
        name: "language",
        message: "Select your preferred language:",
        choices: ["TypeScript", "JavaScript"],
    },
]);

await setupProject(language);

// Script that builds a DOGE project

const chalk = require("chalk");
const fs = require("fs");
const path = require("path");

const projectDir = process.argv[2];
const projectFile = path.join(projectDir, "doge.project.json");

if (!projectDir || !fs.existsSync(projectFile)) {
  console.error(chalk.redBright("Invalid DOGE project :("));
  console.error(
    chalk.redBright(
      "The file 'doge.project.json' was not found in the specified directory"
    )
  );
  return;
}

const project = JSON.parse(fs.readFileSync(projectFile));

console.log(chalk.blueBright(`Building project '${project.project.name}'`));

const outDir = path.join(projectDir, "out");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

console.log(chalk.greenBright(`Finished building '${project.project.name}'`));

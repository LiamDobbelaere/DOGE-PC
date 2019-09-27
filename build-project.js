// Script that builds a DOGE project

const chalk = require("chalk");
const fs = require("fs-extra");
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

let templateHtml = fs.readFileSync(
  path.join(__dirname, "template/index.html"),
  "utf8"
);

const imgLoads = [];
project.sprites.forEach(sprite => {
  imgLoads.push(`this.load.image("${sprite.name}", "assets/${sprite.image}");`);
});

const objectDefs = [];
project.objects.forEach(object => {
  objectDefs.push(
    `function ${
      object.name
    }(self){this.update=function(){${object.events.update
      .split("\n")
      .join("")}}}`
  );
});

const instanceCreates = [];
project.objects.forEach(object => {
  instanceCreates.push(
    `instances.push(new ${object.name}(this.add.image(0, 0, "${object.sprite}")));`
  );
});

templateHtml = templateHtml
  .split(`"$DOGE_LOAD_IMAGE";`)
  .join(imgLoads.join("\n"));

console.log(`Wrote ${imgLoads.length} image load(s)`);

templateHtml = templateHtml
  .split(`("$DOGE_OBJECT_DEFINITIONS");`)
  .join(objectDefs.join("\n"));

console.log(`Wrote ${objectDefs.length} object definition(s)`);

templateHtml = templateHtml
  .split(`"$DOGE_CREATE_INSTANCES";`)
  .join(instanceCreates.join("\n"));

console.log(`Wrote ${instanceCreates.length} instance creator(s)`);

fs.writeFileSync(path.join(outDir, "index.html"), templateHtml);
console.log(chalk.green("Out: index.html"));

fs.copyFileSync(
  path.join(__dirname, "phaser/phaser.min.js"),
  path.join(outDir, "phaser.min.js")
);

console.log(chalk.green("Out: phaser.min.js"));

if (!fs.existsSync(path.join(outDir, "assets"))) {
  fs.mkdirSync(path.join(outDir, "assets"));
}

//Copy sprite assets
project.sprites.forEach(sprite => {
  fs.copyFileSync(
    path.join(projectDir, `sprites/assets/${sprite.image}`),
    path.join(outDir, `assets/${sprite.image}`)
  );
});

console.log(chalk.green("Out: assets"));

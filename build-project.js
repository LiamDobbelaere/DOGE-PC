// Script that builds a DOGE project

const chalk = require("chalk");
const glob = require("glob");
const fs = require("fs-extra");
const path = require("path");

buildProject(process.argv[2]);

function buildProject(projectDir) {
  const startTime = new Date();
  const projectFile = path.join(projectDir, "doge.project.json");

  if (!isValidProject(projectDir, projectFile)) return;

  const outDir = path.join(projectDir, "out");
  const project = JSON.parse(fs.readFileSync(projectFile, "utf8"));
  let htmlTemplate = fs.readFileSync(
    path.join(__dirname, "template/index.html"),
    "utf8"
  );

  console.log(chalk.blueBright(`Building project '${project.project.name}'`));

  createFolderIfNotExists(outDir);

  project.sprites = loadSpriteData(projectDir);
  project.objects = loadObjectData(projectDir);

  const dogeScenePreload = genJsScenePreload(project.sprites);
  const dogeObjects = genJsObjects(project.objects);

  const instanceCreates = [];
  project.objects.forEach(object => {
    instanceCreates.push(
      `instances.push(new ${object.name}(this.add.image(32, 32, "${object.sprite}")));`
    );
  });

  htmlTemplate = htmlTemplate
    .split(`"$DOGE_SCENE_PRELOAD";`)
    .join(dogeScenePreload)
    .split(`("$DOGE_OBJECTS");`)
    .join(dogeObjects)
    .split(`"$DOGE_SCENE_CREATE";`)
    .join(instanceCreates.join("\n"));

  fs.writeFileSync(path.join(outDir, "index.html"), htmlTemplate);
  console.log(chalk.green("Out: index.html"));

  fs.copyFileSync(
    path.join(__dirname, "phaser/phaser.min.js"),
    path.join(outDir, "phaser.min.js")
  );

  console.log(chalk.green("Out: phaser.min.js"));

  createFolderIfNotExists(path.join(outDir, "assets"));

  //Copy sprite assets
  project.sprites.forEach(sprite => {
    fs.copyFileSync(
      path.join(projectDir, `sprites/assets/${sprite.image}`),
      path.join(outDir, `assets/${sprite.image}`)
    );
  });

  console.log(chalk.green("Out: assets"));

  console.log(chalk.green(`Compiled in ${new Date() - startTime}ms`));
}

function loadSpriteData(projectDir) {
  const spriteFiles = glob.sync(path.join(projectDir, "sprites/*.sprite.json"));

  return spriteFiles.map(spriteFile => {
    const sprite = JSON.parse(fs.readFileSync(spriteFile, "utf8"));
    sprite.name = path.basename(spriteFile, ".sprite.json");

    return sprite;
  });
}

function loadObjectData(projectDir) {
  const objectDirectories = glob.sync(path.join(projectDir, "objects/*"));

  return objectDirectories.map(objectDirectory => {
    const objectFile = path.join(objectDirectory, "object.json");
    const object = JSON.parse(fs.readFileSync(objectFile, "utf8"));

    object.name = path.basename(objectDirectory);
    object.events = {};

    const eventScripts = glob.sync(path.join(objectDirectory, "/*.event.js"));
    eventScripts.forEach(eventScript => {
      const eventName = path.basename(eventScript, ".event.js");
      const scriptContents = fs.readFileSync(eventScript, "utf8");

      object.events[eventName] = scriptContents;
    });

    return object;
  });
}

function isValidProject(projectDir, projectFile) {
  if (!projectDir || !fs.existsSync(projectFile)) {
    console.error(chalk.redBright("Invalid DOGE project :("));
    console.error(
      chalk.redBright(
        "The file 'doge.project.json' was not found in the specified directory"
      )
    );

    return false;
  }

  return true;
}

function createFolderIfNotExists(folder) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
}

function genJsScenePreload(sprites) {
  return sprites.map(sprite => {
    return `this.load.image("${sprite.name}", "assets/${sprite.image}");`;
  });
}

function genJsObjects(objects) {
  return objects.map(object => {
    return `function ${object.name}(self){this.step=function(){${object.events.step}}}`;
  });
}

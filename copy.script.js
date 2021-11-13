/**
 * Just copies the utility Points file to sandboxes so that I don't have to deal with that
 */
const sandboxesFolder = "./demo/src/sandboxes/";
const fs = require("fs");

const pointsFile = fs.readFileSync("./demo/src/components/Points.tsx", "utf-8");

fs.readdirSync(sandboxesFolder)
  .filter((file) => file !== ".DS_Store")
  .forEach((file) => {
    fs.writeFileSync(`${sandboxesFolder}${file}/src/Points.tsx`, pointsFile);
  });

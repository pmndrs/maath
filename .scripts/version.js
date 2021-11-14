const semver = require("semver");
const fs = require("fs");
const path = require("path");

const sandboxesFolder = ["demo", "src", "sandboxes"];

const currentV = JSON.parse(
  fs.readFileSync(path.join("packages", "maath", "package.json"), "utf-8")
).version;
const NEW_V = semver.inc(currentV, "prerelease");

function mutateJSONAtPath(mutate, ..._path) {
  const packagePath = path.join(..._path, "package.json");
  const json = fs.readFileSync(packagePath, "utf-8");
  const parsed = JSON.parse(json);

  mutate(parsed);
  fs.writeFileSync(packagePath, JSON.stringify(parsed, null, "  "));
}

// 1. update all versions in the sandboxes
fs.readdirSync(path.join(...sandboxesFolder))
  .filter((file) => file !== ".DS_Store")
  .forEach((file) => {
    mutateJSONAtPath(
      (json) => (json.dependencies.maath = NEW_V),
      ...sandboxesFolder,
      file
    );
  });

// 2. update version in demo
mutateJSONAtPath((json) => (json.dependencies.maath = NEW_V), "demo");

// 3. update version in package
mutateJSONAtPath((json) => (json.version = NEW_V), "packages", "maath");

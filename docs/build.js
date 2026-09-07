import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

// Generates two files from the sources:
//   README.md - the human landing page, from ./README.template.md (tags below)
//   API.md    - the complete, LLM-greppable API reference, generated from every
//               package entrypoint (main + subpaths); one bullet per export
//
// README.template.md tags:
//   <ApiGroups />                                    - clickable overview of every entrypoint group,
//                                                      deep-linking into the generated API.md
//   <TOC />                                          - table of contents from ## headings
//   <Snippet source="./file.ts" select="group" />   - a marked snippet from a doc source file
//   <Snippet source="./file.ts" />                   - the entire doc source file
//   <RenderType type="import('math').Name" />     - a type/function signature, from source
//   <RenderSource type="import('math').Name" />   - the full source of a type/function

const here = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.join(here, "..");
const srcDir = path.join(projectRoot, "src");
const packageJson = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "package.json"), "utf-8"),
);
const packageName = packageJson.name;

// utility to find all .ts files in a directory
function getAllSourceFiles(dir) {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllSourceFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

// One TypeScript program over the whole of src, so cross-file references resolve.
const sourceFiles = getAllSourceFiles(srcDir);
const tsProgram = ts.createProgram(sourceFiles, {
  allowJs: false,
  declaration: true,
  emitDeclarationOnly: true,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  noEmit: true,
});
const checker = tsProgram.getTypeChecker();

// resolve a package import specifier to its source directory, using package.json exports.
// e.g. "math" -> src, "math/shapes" -> src/shapes (types: ./dist/src/shapes/index.d.ts)
function resolveModuleToSourceDir(modulePath) {
  if (modulePath === packageName) return srcDir;
  const subpath = modulePath.replace(`${packageName}/`, "");
  const exportEntry = packageJson.exports?.[`./${subpath}`];
  if (exportEntry?.types) {
    const rel = exportEntry.types
      .replace(/^\.\//, "")
      .replace(/^dist\//, "")
      .replace(/\/index\.d\.ts$/, "")
      .replace(/\.d\.ts$/, "");
    return path.join(projectRoot, rel);
  }
  return path.join(projectRoot, subpath);
}

// map a package.json exports key ("." or "./shapes") to its import specifier and source index file
function entrypoints() {
  const out = [];
  for (const key of Object.keys(packageJson.exports ?? {})) {
    const specifier =
      key === "." ? packageName : `${packageName}/${key.replace("./", "")}`;
    const dir = resolveModuleToSourceDir(specifier);
    const indexFile = path.join(dir, "index.ts");
    if (!fs.existsSync(indexFile)) {
      console.warn(`no index.ts for entrypoint ${specifier} (${indexFile})`);
      continue;
    }
    out.push({ specifier, indexFile });
  }
  return out;
}

const hasExport = (node) =>
  node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

// the top-level exported members (functions, consts, types) declared in a file, in source order
function getExportedMembers(file) {
  const sf = tsProgram.getSourceFile(file);
  const out = [];
  if (!sf) return out;
  sf.forEachChild((node) => {
    if (ts.isFunctionDeclaration(node) && node.name && hasExport(node)) {
      out.push({ name: node.name.text, kind: "value" });
    } else if (ts.isVariableStatement(node) && hasExport(node)) {
      for (const decl of node.declarationList.declarations) {
        if (decl.name && ts.isIdentifier(decl.name))
          out.push({ name: decl.name.text, kind: "value" });
      }
    } else if (
      (ts.isTypeAliasDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isEnumDeclaration(node)) &&
      node.name &&
      hasExport(node)
    ) {
      out.push({ name: node.name.text, kind: "type" });
    }
  });
  return out;
}

// resolve a relative module specifier from an importing file to a { file, isDir } target
function resolveSpecifier(fromFile, spec) {
  const dir = path.dirname(fromFile);
  const leaf = path.resolve(dir, `${spec}.ts`);
  if (fs.existsSync(leaf)) return { file: leaf, isDir: false };
  const idx = path.resolve(dir, spec, "index.ts");
  if (fs.existsSync(idx)) return { file: idx, isDir: true };
  return null;
}

// walk an entrypoint's index.ts (recursing through `export * from './dir'`) and collect its public API:
//   namespaces: `export * as ns from './file'`
//   topItems:   `export * from './leaf'` members, and named `export { x } / export type { X }` re-exports
//   topTypeNames: names surfaced via `export type { X }`, so we can avoid re-documenting them inside a namespace
function collectEntrypointApi(indexFile, acc) {
  const sf = tsProgram.getSourceFile(indexFile);
  if (!sf) {
    console.warn(`couldnt get ts sourcefile for ${indexFile}`);
    return acc;
  }

  sf.forEachChild((node) => {
    if (!ts.isExportDeclaration(node) || !node.moduleSpecifier) return;
    const spec = node.moduleSpecifier.text;
    const resolved = resolveSpecifier(indexFile, spec);

    // `export * ...` (no export clause)
    if (!node.exportClause) {
      if (node.isTypeOnly) return; // `export type * from '...'` — re-surfaces another entry, skip
      if (!resolved) {
        console.warn(`couldnt resolve '${spec}' from ${indexFile}`);
        return;
      }
      if (resolved.isDir) {
        collectEntrypointApi(resolved.file, acc); // recurse, e.g. main -> ./core
      } else {
        for (const m of getExportedMembers(resolved.file)) {
          acc.topItems.push({
            name: m.name,
            kind: m.kind,
            file: resolved.file,
          });
        }
      }
      return;
    }

    // `export * as ns from '...'`
    if (ts.isNamespaceExport(node.exportClause)) {
      const nsName = node.exportClause.name.text;
      if (!resolved) {
        console.warn(`couldnt resolve namespace '${spec}' from ${indexFile}`);
        return;
      }
      acc.namespaces.push({
        name: nsName,
        file: resolved.file,
        members: getExportedMembers(resolved.file),
      });
      return;
    }

    // `export { a, b } from '...'` / `export type { A } from '...'`
    if (ts.isNamedExports(node.exportClause)) {
      for (const el of node.exportClause.elements) {
        const name = el.name.text;
        const isType = node.isTypeOnly || el.isTypeOnly;
        acc.topItems.push({
          name,
          kind: isType ? "type" : "value",
          file: resolved?.file,
        });
        if (isType) acc.topTypeNames.add(name);
      }
    }
  });

  return acc;
}

// GitHub-style anchor slug for a heading/name, e.g. "`fbm`" -> "fbm"
function generateAnchor(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// a stable, collision-free HTML anchor id for an entrypoint group, e.g.
// "math" -> "api-math", "math/shapes" -> "api-math-shapes". Used so the
// <ApiGroups /> overview can link to each group's section in the API docs.
function apiGroupSlug(specifier) {
  return `api-${specifier.replace(/[^\w]+/g, "-")}`;
}

// a stable HTML anchor id for a namespace group within an entrypoint, e.g.
// (math, vec3) -> "api-math-vec3". Lets the <ApiGroups /> chips deep-link to a
// namespace's function grid in the API docs.
function namespaceSlug(specifier, label) {
  return `${apiGroupSlug(specifier)}-${label.toLowerCase()}`;
}

// one-line description for each entrypoint, shown in the <ApiGroups /> overview.
// The exhaustive per-module contents (namespaces + top-level functions) are
// generated; only this prose is authored. Keyed by import specifier.
const API_GROUP_DESCRIPTIONS = {
  math: "Vectors, quaternions, euler angles & matrices",
  "math/shapes": "Shape primitives & spatial queries",
  "math/geometry": "Geometric algorithms",
  "math/time": "Easing & spring animation",
  "math/random": "Seeded random number generators",
  "math/noise": "Perlin, simplex & worley noise, plus fractal helpers",
  "math/color": "Color & colorspace utilities",
  "math/ik": "Inverse kinematics",
};

// the generated full reference lives in a separate file so the README stays a
// landing page; <ApiGroups /> chips deep-link into it (e.g. API.md#api-math-vec3).
const API_DOC_FILE = "API.md";

/* <ApiGroups /> - an exhaustive, clickable overview of every entrypoint in the
 * README: a prose description plus a chip for every namespace and top-level
 * function it exports, each deep-linking into the generated API.md reference. */
function renderApiGroups() {
  let rows = "";
  for (const { specifier, indexFile } of entrypoints()) {
    const description = API_GROUP_DESCRIPTIONS[specifier];
    if (!description)
      console.warn(`no <ApiGroups /> description for entrypoint ${specifier}`);

    // exhaustive contents: every namespace, then every top-level function/const
    // (types are omitted — they mirror the namespaces, e.g. `Vec3` ~ `vec3`)
    const api = collectEntrypointApi(indexFile, {
      namespaces: [],
      topItems: [],
      topTypeNames: new Set(),
    });
    const contents = [
      ...api.namespaces.map((ns) => ({
        name: ns.name,
        anchor: namespaceSlug(specifier, ns.name),
      })),
      ...api.topItems
        .filter((it) => it.kind === "value")
        .map((it) => ({
          name: it.name,
          anchor: generateAnchor(`\`${it.name}\``),
        })),
    ];
    const chips = contents
      .map((c) => `[\`${c.name}\`](${API_DOC_FILE}#${c.anchor})`)
      .join(" ");

    rows += `| [\`${specifier}\`](${API_DOC_FILE}#${apiGroupSlug(specifier)}) | ${description ?? ""} | ${chips} |\n`;
  }
  return `| Import | Description | Contents |\n| --- | --- | --- |\n${rows}`;
}

/* Semantic buckets for the members of a namespace, in display order. Keeps the
 * per-namespace reference scannable instead of a flat source-order dump. The
 * classifier below is heuristic (name-based); tweak it or the source names if a
 * function lands in the wrong bucket. */
const VALUE_CATEGORY_ORDER = [
  "Create",
  "Operations",
  "Transform",
  "Query",
  "Aliases",
];

function classifyMember(name, nsLabel, isAlias) {
  if (isAlias) return "Aliases";
  // predicates, comparisons & accessors
  if (/^(equals|exactEquals|finite|angle|angleTo|luminance)$/.test(name))
    return "Query";
  if (/^(is|get|contains|intersects)[A-Z]/.test(name)) return "Query";
  // construction, conversion & setters
  if (
    /^(create|clone|copy|set|identity|zero|str|reorder|makeSafe|fromValues|setAxes|setAxisAngle|calculateW)$/.test(
      name,
    )
  )
    return "Create";
  if (/^(from|to|set)[A-Z]/.test(name)) return "Create";
  if (/^(lookAt|targetTo|perspective|ortho|frustum|projection)/.test(name))
    return "Create";
  // spatial transforms
  if (/^(transform|rotate)/.test(name)) return "Transform";
  if (/^(translate|applyMatrix4|crossProductMatrix)$/.test(name))
    return "Transform";
  if (name === "scale" && /^mat/.test(nsLabel)) return "Transform";
  // everything else: arithmetic & vector/matrix math
  return "Operations";
}

// render one member as a single greppable bullet: `qualified.signature — summary`.
// Types keep their global name (e.g. `type Vec3 = ...`); functions/aliases are
// qualified with the namespace prefix so `vec3.add` is findable by grep.
// `anchorId`, when set, emits an inline <a id> for deep-linking.
function memberLine(member, prefix, anchorId) {
  const anchor = anchorId ? `<a id="${anchorId}"></a>` : "";
  const signature =
    member.kind === "type" ? member.signature : `${prefix}${member.signature}`;
  const summary = member.summary ? ` — ${member.summary}` : "";
  return `- ${anchor}\`${signature}\`${summary}\n`;
}

// render a list of resolved members, grouped into semantic categories. A single
// populated category renders without a label; several get bold `**Category**`
// dividers. `anchorFor` maps a member to an optional deep-link id.
function renderMemberSections(members, { prefix, anchorFor }) {
  const sections = [];
  const push = (title, list) =>
    list.length > 0 && sections.push({ title, list });

  push(
    "Types",
    members.filter((m) => m.kind === "type"),
  );
  for (const category of VALUE_CATEGORY_ORDER) {
    push(
      category,
      members.filter(
        (m) =>
          m.kind !== "type" &&
          classifyMember(m.name, m.nsLabel, m.kind === "alias") === category,
      ),
    );
  }

  const labelled = sections.length > 1;
  let out = "";
  for (const section of sections) {
    if (labelled) out += `**${section.title}**\n\n`;
    for (const member of section.list)
      out += memberLine(member, prefix, anchorFor(member));
    out += "\n";
  }
  return out;
}

/* The complete API reference body for API.md: one section per entrypoint (h2),
 * one per namespace (h3, fronted with an import snippet), and one greppable
 * bullet per function/type. Anchors here are the deep-link targets for the
 * README's <ApiGroups /> chips (which point at API.md#...). */
function generateApiDocs() {
  let out = "";
  for (const { specifier, indexFile } of entrypoints()) {
    const api = collectEntrypointApi(indexFile, {
      namespaces: [],
      topItems: [],
      topTypeNames: new Set(),
    });

    out += `<a id="${apiGroupSlug(specifier)}"></a>\n\n## \`${specifier}\`\n\n`;

    // top-level members (types + flat re-exported functions). Value items get a
    // stable anchor so <ApiGroups /> chips (e.g. `fbm`, `circumcircle`) resolve.
    const topMembers = api.topItems.map((it) =>
      resolveMember(it.name, it.kind, it.file, null),
    );
    if (topMembers.length > 0) {
      out += renderMemberSections(topMembers, {
        prefix: "",
        anchorFor: (m) =>
          m.kind === "type" ? null : generateAnchor(`\`${m.name}\``),
      });
    }

    // one section per namespace; skip type members already surfaced at the top level
    for (const ns of api.namespaces) {
      const members = ns.members
        .filter((m) => !(m.kind === "type" && api.topTypeNames.has(m.name)))
        .map((m) => resolveMember(m.name, m.kind, ns.file, ns.name));
      if (members.length === 0) continue;
      out += `<a id="${namespaceSlug(specifier, ns.name)}"></a>\n\n### \`${ns.name}\`\n\n`;
      out += `\`\`\`ts\nimport { ${ns.name} } from '${specifier}';\n\`\`\`\n\n`;
      out += renderMemberSections(members, {
        prefix: `${ns.name}.`,
        anchorFor: () => null,
      });
    }
  }
  return out.trimEnd();

  // resolve a member's compact signature + summary, attaching its namespace label
  function resolveMember(name, kind, file, nsLabel) {
    const doc = getCompactMember(name, file) ?? {
      kind: kind === "type" ? "type" : "value",
      signature: name,
      summary: "",
    };
    return { name, nsLabel, ...doc };
  }
}

// a member's one-line signature and JSDoc summary, for the compact reference.
// Returns { kind: 'value'|'type'|'alias', signature, summary }.
function getCompactMember(name, file) {
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: true,
  });
  const oneLine = (node, sf) =>
    printer
      .printNode(ts.EmitHint.Unspecified, node, sf)
      .replace(/\s+/g, " ")
      .trim();
  const summaryOf = (node) => {
    const symbol = node.name && checker.getSymbolAtLocation(node.name);
    if (!symbol) return "";
    // keep only the first line — later lines are usually param/return or legend prose
    const doc = ts.displayPartsToString(
      symbol.getDocumentationComment(checker),
    );
    return (
      doc
        .split("\n")[0]
        // resolve `{@link target}` / `{@link target|text}` to plain text, and [[wiki]] links
        .replace(/\{@link\s+([^}|]+?)(?:\s*\|[^}]*)?\}/g, "$1")
        .replace(/\[\[([^\]]+)\]\]/g, "$1")
        .replace(/\s+/g, " ")
        .trim()
        // drop a trailing dangling comma/colon left by cutting a wrapped sentence
        .replace(/[,:;]$/, "")
    );
  };
  const typeParamsOf = (node) =>
    node.typeParameters
      ? `<${node.typeParameters.map((p) => p.getText(node.getSourceFile())).join(", ")}>`
      : "";
  const fnSignature = (nameNode, fn, sf) => {
    const sigNode = ts.factory.createFunctionDeclaration(
      undefined,
      fn.asteriskToken,
      nameNode,
      fn.typeParameters,
      fn.parameters,
      fn.type,
      undefined,
    );
    return oneLine(sigNode, sf)
      .replace(/^function /, "")
      .replace(/;$/, "");
  };

  let found = null;
  function visit(node, sf) {
    if (found) return;
    if (
      ts.isFunctionDeclaration(node) &&
      node.name?.text === name &&
      hasExport(node)
    ) {
      found = {
        kind: "value",
        signature: fnSignature(node.name, node, sf),
        summary: summaryOf(node),
      };
    } else if (ts.isVariableStatement(node) && hasExport(node)) {
      for (const decl of node.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name) || decl.name.text !== name) continue;
        if (
          decl.initializer &&
          (ts.isArrowFunction(decl.initializer) ||
            ts.isFunctionExpression(decl.initializer))
        ) {
          found = {
            kind: "value",
            signature: fnSignature(decl.name, decl.initializer, sf),
            summary: summaryOf(decl),
          };
        } else if (decl.initializer && ts.isIdentifier(decl.initializer)) {
          // `export const len = length` — an alias
          found = {
            kind: "alias",
            signature: `${name} = ${decl.initializer.text}`,
            summary: `Alias for \`${decl.initializer.text}\``,
          };
        } else if (
          decl.initializer &&
          (ts.isNumericLiteral(decl.initializer) ||
            ts.isStringLiteralLike(decl.initializer))
        ) {
          found = {
            kind: "value",
            signature: `${name} = ${decl.initializer.getText(sf)}`,
            summary: summaryOf(decl),
          };
        } else {
          const type = decl.type ? `: ${oneLine(decl.type, sf)}` : "";
          found = {
            kind: "value",
            signature: `${name}${type}`,
            summary: summaryOf(decl),
          };
        }
      }
    } else if (
      ts.isEnumDeclaration(node) &&
      node.name?.text === name &&
      hasExport(node)
    ) {
      // an enum's members are the whole point of it - a bare `enum JointType` tells a reader
      // nothing, so list them the way a type alias lists its fields
      const members = node.members
        .map((m) => m.name.getText(sf))
        .join(" | ");
      found = {
        kind: "type",
        signature: `enum ${name} = ${members}`,
        summary: summaryOf(node),
      };
    } else if (
      (ts.isTypeAliasDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isClassDeclaration(node)) &&
      node.name?.text === name &&
      hasExport(node)
    ) {
      const signature = ts.isTypeAliasDeclaration(node)
        ? `type ${name}${typeParamsOf(node)} = ${oneLine(node.type, sf)}`
        : `${ts.isInterfaceDeclaration(node) ? "interface" : "class"} ${name}${typeParamsOf(node)}`;
      found = { kind: "type", signature, summary: summaryOf(node) };
    }
    ts.forEachChild(node, (child) => visit(child, sf));
  }
  for (const f of filesToSearch(file)) {
    const sf = tsProgram.getSourceFile(f);
    if (sf) visit(sf, sf);
    if (found) break;
  }
  return found;
}

/* Example galleries read from examples/src/examples.json, screenshots from
 * examples/public/screenshots/<key>.png, linking to the live examples browser. */
const EXAMPLES_COLS = 3;
const EXAMPLE_PAGES_BASE = "https://pmndrs.github.io/math/examples/#";
const examplesJsonPath = path.join(here, "../examples/src/examples.json");

function loadExamples() {
  if (!fs.existsSync(examplesJsonPath)) {
    console.warn(`examples.json not found: ${examplesJsonPath}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(examplesJsonPath, "utf-8"));
}

function exampleCell(data, key, width = 180, height = 120) {
  const title = data[key].title || key;
  const img = `./examples/public/screenshots/${key}.png`;
  const href = `${EXAMPLE_PAGES_BASE}${key}`;
  return (
    `    <td align="center">\n` +
    `      <a href="${href}">\n` +
    `        <img src="${img}" width="${width}" height="${height}" style="object-fit:cover;"/><br/>\n` +
    `        ${title}\n` +
    `      </a>\n` +
    `    </td>`
  );
}

/* <Examples /> - a full gallery grid of every example in examples.json */
function renderExamples() {
  const data = loadExamples();
  if (!data) return "";
  const keys = Object.keys(data);
  let out = "<table>\n";
  for (let i = 0; i < keys.length; i += EXAMPLES_COLS) {
    out += "  <tr>\n";
    for (let j = 0; j < EXAMPLES_COLS && i + j < keys.length; ++j) {
      out += `${exampleCell(data, keys[i + j])}\n`;
    }
    out += "  </tr>\n";
  }
  return `${out}</table>`;
}

/* <ExamplesTable ids="a,b,c" /> - a one-row table of specific examples */
function renderExamplesTable(idsStr) {
  const data = loadExamples();
  if (!data) return "";
  const ids = idsStr
    .split(",")
    .map((s) => s.trim())
    .filter(
      (id) => data[id] || console.warn(`example '${id}' not in examples.json`),
    );
  if (ids.length === 0) return "";
  const cells = ids.map((id) => exampleCell(data, id, 200, 133)).join("\n");
  return `<table>\n  <tr>\n${cells}\n  </tr>\n</table>`;
}

const readmeTemplatePath = path.join(here, "./README.template.md");
const readmeOutPath = path.join(here, "../README.md");
let readmeText = fs.readFileSync(readmeTemplatePath, "utf-8");

/* <ApiGroups /> - clickable overview of every entrypoint group */
readmeText = readmeText.replace(/<ApiGroups\s*\/>/g, () => renderApiGroups());

/* <Examples /> - gallery grid of every example */
readmeText = readmeText.replace(/<Examples\s*\/>/g, () => renderExamples());

/* <ExamplesTable ids="a,b,c" /> - inline one-row table for a section */
readmeText = readmeText.replace(
  /<ExamplesTable\s+ids=["'](.+?)["']\s*\/>/g,
  (_full, ids) => renderExamplesTable(ids),
);

/* <TOC /> */
const tocLines = [];
for (const match of readmeText.matchAll(/^(#{2,2})\s+(.*)$/gm)) {
  const level = match[1].length - 1;
  const title = match[2].trim();
  if (title === "Table of Contents") continue;
  const anchor = generateAnchor(title);
  tocLines.push(`${"  ".repeat(level - 1)}- [${title}](#${anchor})`);
}
readmeText = readmeText.replace(/<TOC\s*\/>/g, tocLines.join("\n"));

/* <RenderType type="import('math/x').TypeName" /> */
readmeText = readmeText.replace(
  /<RenderType\s+type=["']import\(['"]([^'"]+)['"]\)\.(\w+)["']\s*\/>/g,
  (fullMatch, modulePath, typeName) => {
    const typeDef = getType(
      typeName,
      findFileForModuleMember(modulePath, typeName),
    );
    if (!typeDef) {
      console.warn(`Type ${typeName} not found in module ${modulePath}`);
      return fullMatch;
    }
    return `\`\`\`ts\n${typeDef}\n\`\`\``;
  },
);

/* <RenderSource type="import('math/x').TypeName" /> */
readmeText = readmeText.replace(
  /<RenderSource\s+type=["']import\(['"]([^'"]+)['"]\)\.(\w+)["']\s*\/>/g,
  (fullMatch, modulePath, typeName) => {
    const typeDef = getSource(
      typeName,
      findFileForModuleMember(modulePath, typeName),
    );
    if (!typeDef) {
      console.warn(`Type ${typeName} not found in module ${modulePath}`);
      return fullMatch;
    }
    return `\`\`\`ts\n${typeDef}\n\`\`\``;
  },
);

/* <Snippet source="./file.ts" select="group" /> */
readmeText = readmeText.replace(
  /<Snippet\s+source=["'](.+?)["']\s+select=["'](.+?)["']\s*\/>/g,
  (fullMatch, sourcePath, groupName) => {
    const absSourcePath = path.join(here, sourcePath);
    if (!fs.existsSync(absSourcePath)) {
      console.warn(`Snippet source file not found: ${absSourcePath}`);
      return fullMatch;
    }
    const sourceText = fs.readFileSync(absSourcePath, "utf-8");
    const groupRegex = new RegExp(
      String.raw`^([ \t]*)\/\*[ \t]*SNIPPET_START:[ \t]*${groupName}[ \t]*\*\/[\r\n]+([\s\S]*?)[ \t]*^\1\/\*[ \t]*SNIPPET_END:[ \t]*${groupName}[ \t]*\*\/`,
      "gm",
    );
    const matches = Array.from(sourceText.matchAll(groupRegex));
    if (matches.length === 0) {
      console.warn(`Snippet group '${groupName}' not found in ${sourcePath}`);
      return fullMatch;
    }
    const parts = matches.map((match) => {
      const baseIndent = match[1] || "";
      let code = match[2];
      if (baseIndent)
        code = code.replace(new RegExp(`^${baseIndent}`, "gm"), "");
      code = code.replace(/^.*\/\*[ \t]*SNIPPET_START:[^*]*\*\/.*\n?/gm, "");
      code = code.replace(/^.*\/\*[ \t]*SNIPPET_END:[^*]*\*\/.*\n?/gm, "");
      return code;
    });
    let code = parts.join("");
    code = code.replace(/^\s*\n|\n\s*$/g, "");
    return `\`\`\`ts\n${code}\n\`\`\``;
  },
);

/* <Snippet source="./file.ts" /> - without select, use entire file */
readmeText = readmeText.replace(
  /<Snippet\s+source=["'](.+?)["']\s*\/>/g,
  (fullMatch, sourcePath) => {
    const absSourcePath = path.join(here, sourcePath);
    if (!fs.existsSync(absSourcePath)) {
      console.warn(`Snippet source file not found: ${absSourcePath}`);
      return fullMatch;
    }
    let sourceText = fs.readFileSync(absSourcePath, "utf-8");
    sourceText = sourceText.replace(
      /^[ \t]*\/\*[ \t]*SNIPPET_START:[^*]*\*\/.*\n?/gm,
      "",
    );
    sourceText = sourceText.replace(
      /^[ \t]*\/\*[ \t]*SNIPPET_END:[^*]*\*\/.*\n?/gm,
      "",
    );
    sourceText = sourceText.replace(/^\s*\n|\n\s*$/g, "");
    return `\`\`\`ts\n${sourceText}\n\`\`\``;
  },
);

/* write README */
fs.writeFileSync(readmeOutPath, readmeText, "utf-8");
console.log(`wrote ${path.relative(projectRoot, readmeOutPath)}`);

/* write API.md - the generated, LLM-greppable full reference */
fs.writeFileSync(path.join(projectRoot, API_DOC_FILE), buildApiMd(), "utf-8");
console.log(`wrote ${API_DOC_FILE}`);

// assemble API.md: a conventions preamble + module map + the full reference body
function buildApiMd() {
  const moduleList = entrypoints()
    .map(({ specifier }) => {
      const blurb = (API_GROUP_DESCRIPTIONS[specifier] ?? "").split(" — ")[0];
      return `- [\`${specifier}\`](#${apiGroupSlug(specifier)})${blurb ? ` — ${blurb}` : ""}`;
    })
    .join("\n");

  const preamble = `# math — API reference

Complete reference for every export in \`${packageName}\`, grouped by module. For an
overview, installation, and examples, see the [README](./README.md).

## Modules

${moduleList}

---

`;

  return `${preamble}${generateApiDocs()}\n`;
}

/* utils */

// best-effort resolution of a RenderType/RenderSource module member to its declaring file
function findFileForModuleMember(modulePath, name) {
  const dir = resolveModuleToSourceDir(modulePath);
  const files = fs.existsSync(dir) ? getAllSourceFiles(dir) : sourceFiles;
  for (const file of files) {
    if (getExportedMembers(file).some((m) => m.name === name)) return file;
  }
  return undefined;
}

// the full source text of a declaration (type/interface/class/function/const), searched in `file` then everywhere
function getSource(typeName, file = null) {
  let found = null;
  function visit(node, fileText) {
    if (
      (ts.isTypeAliasDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isClassDeclaration(node)) &&
      node.name &&
      node.name.text === typeName
    ) {
      found = fileText.slice(node.getFullStart(), node.getEnd());
    }
    if (
      ts.isFunctionDeclaration(node) &&
      node.name &&
      node.name.text === typeName &&
      hasExport(node)
    ) {
      found = fileText.slice(node.getFullStart(), node.getEnd());
    }
    if (ts.isVariableStatement(node) && hasExport(node)) {
      for (const decl of node.declarationList.declarations) {
        if (
          decl.name &&
          ts.isIdentifier(decl.name) &&
          decl.name.text === typeName
        ) {
          found = fileText.slice(node.getFullStart(), node.getEnd());
        }
      }
    }
    ts.forEachChild(node, (child) => visit(child, fileText));
  }
  for (const f of filesToSearch(file)) {
    const sf = tsProgram.getSourceFile(f);
    if (sf) visit(sf, sf.getFullText());
    if (found) break;
  }
  return found ? found.trimStart() : null;
}

// a printed signature (functions) or the declaration (types), searched in `file` then everywhere
function getType(typeName, file = null) {
  let found = null;
  function visit(node, fileText) {
    if (
      (ts.isTypeAliasDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isClassDeclaration(node)) &&
      node.name &&
      node.name.text === typeName
    ) {
      const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
      found = printer.printNode(
        ts.EmitHint.Unspecified,
        node,
        node.getSourceFile(),
      );
    }
    if (
      ts.isFunctionDeclaration(node) &&
      node.name &&
      node.name.text === typeName &&
      hasExport(node)
    ) {
      const jsDoc = ts
        .getJSDocCommentsAndTags(node)
        .map((doc) => fileText.slice(doc.pos, doc.end))
        .join("");
      const sig = checker.getSignatureFromDeclaration(node);
      let sigStr = "";
      if (sig) {
        const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
        const sigNode = ts.factory.createFunctionDeclaration(
          // fresh modifier (not node.modifiers) so the printer doesn't re-emit the
          // JSDoc already prepended above via the original modifier's source position
          [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
          node.asteriskToken,
          node.name,
          node.typeParameters,
          node.parameters,
          node.type,
          undefined,
        );
        sigStr = printer.printNode(
          ts.EmitHint.Unspecified,
          sigNode,
          node.getSourceFile(),
        );
      }
      found = (jsDoc ? `${jsDoc}\n` : "") + sigStr;
    }
    if (ts.isVariableStatement(node) && hasExport(node)) {
      for (const decl of node.declarationList.declarations) {
        if (
          !decl.name ||
          !ts.isIdentifier(decl.name) ||
          decl.name.text !== typeName
        )
          continue;
        const jsDoc = ts
          .getJSDocCommentsAndTags(node)
          .map((doc) => fileText.slice(doc.pos, doc.end))
          .join("");
        const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
        if (
          decl.initializer &&
          (ts.isFunctionExpression(decl.initializer) ||
            ts.isArrowFunction(decl.initializer))
        ) {
          // exported const arrow/function expression -> print its signature
          const func = decl.initializer;
          const sigNode = ts.factory.createFunctionDeclaration(
            [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
            undefined,
            decl.name,
            func.typeParameters,
            func.parameters,
            func.type,
            undefined,
          );
          found =
            (jsDoc ? `${jsDoc}\n` : "") +
            printer.printNode(
              ts.EmitHint.Unspecified,
              sigNode,
              node.getSourceFile(),
            );
        } else {
          // plain exported const -> print the declaration
          const varNode = ts.factory.createVariableStatement(
            [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
            ts.factory.createVariableDeclarationList(
              [
                ts.factory.createVariableDeclaration(
                  decl.name,
                  undefined,
                  decl.type,
                  decl.initializer,
                ),
              ],
              node.declarationList.flags,
            ),
          );
          found =
            (jsDoc ? `${jsDoc}\n` : "") +
            printer.printNode(
              ts.EmitHint.Unspecified,
              varNode,
              node.getSourceFile(),
            );
        }
      }
    }
    ts.forEachChild(node, (child) => visit(child, fileText));
  }
  for (const f of filesToSearch(file)) {
    const sf = tsProgram.getSourceFile(f);
    if (sf) visit(sf, sf.getFullText());
    if (found) break;
  }
  return found;
}

// search order: the declaring file first (if known), then every source file as a fallback
function filesToSearch(file) {
  if (file) return [file, ...sourceFiles.filter((f) => f !== file)];
  return sourceFiles;
}

#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

// Point to your specs directory
const TEST_DIR = path.resolve(__dirname, "../specs");

class TestNode {
  constructor(file, line, title, isOnly, isSkipped) {
    this.file = file;
    this.line = line;
    this.title = title;
    this.isOnly = isOnly;
    this.isSkipped = isSkipped;
  }
}

// Utility: get full callee chain, e.g. ['test','describe','serial','only']
function getCalleeChain(node) {
  if (!node) return [];
  if (node.type === "Identifier") return [node.name];
  if (node.type === "MemberExpression") {
    return [...getCalleeChain(node.object), node.property.name];
  }
  return [];
}

function collectTests(rootDir) {
  const results = [];

  function walk(dir) {
    fs.readdirSync(dir).forEach((name) => {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) {
        walk(full);
      } else if (/\.spec\.js$/.test(full)) {
        parseFile(full);
      }
    });
  }

  function parseFile(filePath) {
    const src = fs.readFileSync(filePath, "utf-8");
    const ast = parser.parse(src, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });

    const describeStack = [];

    traverse(ast, {
      CallExpression: {
        enter(pathNode) {
          const { node } = pathNode;
          const chain = getCalleeChain(node.callee);

          // Handle test.describe cases (including serial, skip, only, fixme)
          if (chain[0] === "test" && chain[1] === "describe") {
            const titleArg = node.arguments[0];
            const descTitle = titleArg && titleArg.type === "StringLiteral" ? titleArg.value : "<unknown describe>";
            // detect modifiers in describe chain (e.g., .serial, .only, .skip, .fixme)
            const modifiers = chain.slice(2);
            const mod = modifiers.find((m) => ["only", "skip", "fixme"].includes(m)) || null;
            describeStack.push({ title: descTitle, modifier: mod });
            return;
          }

          // Handle individual tests: test(), test.only(), test.skip(), etc.
          if (chain[0] !== "test") return;
          const testModifiers = chain.slice(1);
          let kind = "normal";
          const found = testModifiers.find((m) => ["only", "skip", "fixme", "fail"].includes(m));
          if (found) kind = found;

          if (!kind) return;

          const titleArg = node.arguments[0];
          if (!titleArg || titleArg.type !== "StringLiteral") return;

          // Build full title path
          const fullTitle = [...describeStack.map((d) => d.title), titleArg.value].join(" ");

          // Determine skip/only flags
          const inOnlyDesc = describeStack.some((d) => d.modifier === "only");
          const inSkipDesc = describeStack.some((d) => ["skip", "fixme"].includes(d.modifier));

          const isOnly = kind === "only" || inOnlyDesc;
          const isSkipped = ["skip", "fixme"].includes(kind) || inSkipDesc;

          results.push(
            new TestNode(path.relative(process.cwd(), filePath), titleArg.loc.start.line, fullTitle, isOnly, isSkipped)
          );
        },
        exit(pathNode) {
          const { node } = pathNode;
          const chain = getCalleeChain(node.callee);
          if (chain[0] === "test" && chain[1] === "describe") {
            describeStack.pop();
          }
        },
      },
    });
  }

  walk(rootDir);
  return results;
}

// Only-tests logic: if any only-tests exist, run them; otherwise run all non-skipped
function filterTests(tests) {
  const onlyTests = tests.filter((t) => t.isOnly && !t.isSkipped);
  if (onlyTests.length) return onlyTests;
  return tests.filter((t) => !t.isSkipped);
}

const all = collectTests(TEST_DIR);
const toRun = filterTests(all);
console.log(JSON.stringify(toRun, null, 2));

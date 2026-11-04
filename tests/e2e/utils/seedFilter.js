import fs from "fs";
import path from "path";

const VALUE_FLAGS = new Set([
  "-c",
  "--config",
  "-g",
  "--grep",
  "--grep-invert",
  "-j",
  "--workers",
  "--project",
  "--retries",
  "--timeout",
  "--reporter",
  "--shard",
  "--max-failures",
  "--repeat-each",
  "--output",
  "--trace",
  "--tsconfig",
]);

const asRegex = (text) => new RegExp(text, "i");

/** What the command line selects: file filters and the --grep pattern, both optional. */
const parseSelection = (argv) => {
  const args = argv.slice(argv.indexOf("test") + 1);
  const files = [];
  let grep = null;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const [flag, inline] = arg.split(/=(.*)/s);
    if (flag === "-g" || flag === "--grep") {
      grep = inline ?? args[++i];
    } else if (VALUE_FLAGS.has(flag)) {
      if (inline === undefined) i++;
    } else if (!arg.startsWith("-")) {
      files.push(arg);
    }
  }
  return { files, grep };
};

/**
 * Keeps the tests the run will execute, so seeding covers only their TCs.
 * E2E_SEED_ALL=1 seeds everything; a selection that matches nothing seeds everything too.
 */
export const selectedTests = (tests, argv = process.argv) => {
  if (process.env.E2E_SEED_ALL) return tests;
  const { files, grep } = parseSelection(argv);
  if (!files.length && !grep) return tests;
  const fileMatchers = files.map(asRegex);
  const grepMatcher = grep ? asRegex(grep) : null;
  const picked = tests.filter(
    ({ file, title }) =>
      (!fileMatchers.length || fileMatchers.some((m) => m.test(file))) &&
      (!grepMatcher || grepMatcher.test(`${file} ${title}`)),
  );
  return picked.length ? picked : tests;
};

/**
 * The fixtures a group of specs share. A spec that reads another case's data names it in
 * `const FIXTURE = "TC<n>"`, and that case may not be among the selected tests.
 */
export const sharedFixtures = (tests) => {
  const ids = new Set();
  for (const file of new Set(tests.map((test) => test.file))) {
    const source = fs.readFileSync(path.resolve(__dirname, "..", file), "utf8");
    for (const [, id] of source.matchAll(/\bFIXTURE\s*=\s*"(TC\d+)"/g)) {
      ids.add(id);
    }
  }
  return ids;
};

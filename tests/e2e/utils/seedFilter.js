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

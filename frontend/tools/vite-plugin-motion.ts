/**
 * Vite plugin: `import("@/assets/motions/add-time?motion")` loads a help motion
 * folder as one lazy chunk. base.css is scoped to [data-motion="<name>"] and
 * each scene-<id>.js is wrapped as `export default function (kit) { … }`.
 */
import { existsSync, readFileSync } from "node:fs";
import type { Plugin } from "vite";

const MOTION = "?motion";
const SCENE = "?motion-scene";
const STYLE = "?motion-style";
const PREFIX = "\0motion:";

// The project has no Node types, so paths are joined by hand (POSIX only, like
// the ids Vite passes plugins).
const dirname = (path: string) => path.slice(0, path.lastIndexOf("/"));
const basename = (path: string) => path.slice(path.lastIndexOf("/") + 1);
const resolvePath = (from: string, to: string) =>
  decodeURIComponent(new URL(to, `file://${from}/`).pathname).replace(
    /\/$/,
    "",
  );

export default function motionPlugin(): Plugin {
  return {
    name: "motion",
    enforce: "pre",
    resolveId(source, importer) {
      if (!source.endsWith(MOTION) || !importer) return null;
      return (
        PREFIX +
        resolvePath(
          dirname(importer.split("?")[0]),
          source.slice(0, -MOTION.length),
        )
      );
    },
    load(id) {
      if (!id.startsWith(PREFIX)) return null;
      const dir = id.slice(PREFIX.length);
      const name = basename(dir);
      const path = (file: string) => {
        const full = `${dir}/${file}`;
        if (!existsSync(full))
          this.error(`Motion "${name}": ${file} is missing`);
        return full;
      };

      const manifestPath = path("scenes.json");
      this.addWatchFile(manifestPath);
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
        width?: number;
        height?: number;
        scenes: { id: string; dur: number }[];
      };
      if (!manifest.scenes?.length) this.error(`Motion "${name}": no scenes`);
      if (
        (manifest.width ?? 1920) !== 1920 ||
        (manifest.height ?? 1080) !== 1080
      )
        this.error(`Motion "${name}": the stage must be 1920×1080`);

      const scenePaths = manifest.scenes.map(({ id }) =>
        path(`scene-${id}.js`),
      );
      const cssPath = `${dir}/base.css`;

      return [
        existsSync(cssPath) && `import ${JSON.stringify(cssPath + STYLE)};`,
        ...scenePaths.map(
          (scene, i) =>
            `import scene${i} from ${JSON.stringify(scene + SCENE)};`,
        ),
        `export const name = ${JSON.stringify(name)};`,
        `export const manifest = ${JSON.stringify({
          scenes: manifest.scenes.map(({ id, dur }) => ({ id, dur })),
        })};`,
        `export const scenes = [${scenePaths.map((_, i) => `scene${i}`).join(", ")}];`,
      ]
        .filter(Boolean)
        .join("\n");
    },
    transform(code, id) {
      // Both wrappers open on the file's first line, so no line moves and
      // `map: null` keeps the original lines in source maps.
      if (id.endsWith(SCENE)) {
        return { code: `export default function (kit) {${code}\n}`, map: null };
      }
      if (id.endsWith(STYLE)) {
        const scope = `[data-motion="${basename(dirname(id))}"]`;
        return {
          code: `@scope (${scope}) {${code.replace(/#stage\b/g, ":scope")}\n}`,
          map: null,
        };
      }
      return null;
    },
  };
}

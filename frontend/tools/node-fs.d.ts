// The frontend has no Node types (they would retype timers across src/); this
// declares the two calls vite-plugin-motion.ts makes.
declare module "node:fs" {
  export function existsSync(path: string): boolean;
  export function readFileSync(path: string, encoding: "utf8"): string;
}

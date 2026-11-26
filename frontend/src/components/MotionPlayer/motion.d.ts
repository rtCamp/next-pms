/** Modules produced by tools/vite-plugin-motion.ts. */
declare module "*?motion" {
  type MotionModule = import("@/components/MotionPlayer/kit").MotionModule;

  export const name: MotionModule["name"];
  export const manifest: MotionModule["manifest"];
  export const scenes: MotionModule["scenes"];
}

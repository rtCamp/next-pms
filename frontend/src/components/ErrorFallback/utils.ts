// Vue's error types for building a component: setup, render, update and the
// create and mount hooks. Dev builds pass the name, production builds a link
// ending in the code.
const RENDER_ERRORS = new Map([
  ["0", "setup function"],
  ["1", "render function"],
  ["15", "component update"],
  ["bc", "beforeCreate hook"],
  ["c", "created hook"],
  ["bm", "beforeMount hook"],
  ["m", "mounted hook"],
]);

/** Whether `errorCaptured`'s `info` names an error while building a component. */
export function isRenderError(info: string): boolean {
  const code = info.match(/#runtime-(\w+)$/)?.[1];
  return code
    ? RENDER_ERRORS.has(code)
    : [...RENDER_ERRORS.values()].includes(info);
}

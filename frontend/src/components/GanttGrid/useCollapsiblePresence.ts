import { onScopeDispose, readonly, ref, watch } from "vue";

const EXIT_BUFFER_MS = 50;

/**
 * Keeps a row's child rows mounted while they are open or animating their height.
 * Opening mounts them collapsed and turns `visible` on two frames later, so the height
 * transition runs; closing turns `visible` off and unmounts them when the transition
 * ends (or a little after its duration, if no `transitionend` arrives).
 */
export function useCollapsiblePresence(
  open: () => boolean,
  durationMs: number,
) {
  const rendered = ref(open());
  const visible = ref(open());
  let frame: number | undefined;
  let timeout: number | undefined;

  function clearScheduled() {
    if (frame !== undefined) cancelAnimationFrame(frame);
    if (timeout !== undefined) window.clearTimeout(timeout);
    frame = undefined;
    timeout = undefined;
  }

  watch(open, (isOpen) => {
    clearScheduled();
    if (isOpen) {
      rendered.value = true;
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          frame = undefined;
          visible.value = true;
        });
      });
      return;
    }
    visible.value = false;
    if (!rendered.value) return;
    timeout = window.setTimeout(() => {
      timeout = undefined;
      rendered.value = false;
    }, durationMs + EXIT_BUFFER_MS);
  });

  function onTransitionEnd(event: TransitionEvent) {
    if (event.propertyName !== "height" || open()) return;
    // An interrupted transition ends early; the exit isn't done yet.
    if (event.elapsedTime * 1000 < durationMs - 16) return;
    clearScheduled();
    rendered.value = false;
  }

  onScopeDispose(clearScheduled);

  return {
    /** The child rows are in the DOM. */
    rendered: readonly(rendered),
    /** The child rows are at full height. */
    visible: readonly(visible),
    onTransitionEnd,
  };
}

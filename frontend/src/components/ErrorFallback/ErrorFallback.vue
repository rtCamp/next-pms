<script setup lang="ts">
import { onErrorCaptured, ref } from "vue";
import type { ErrorFallbackSlotProps } from "./types";

defineSlots<{
  default?: () => unknown;
  fallback?: (props: ErrorFallbackSlotProps) => unknown;
}>();

const error = ref<Error | null>(null);

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

function isRenderError(info: string): boolean {
  const code = info.match(/#runtime-(\w+)$/)?.[1];
  return code
    ? RENDER_ERRORS.has(code)
    : [...RENDER_ERRORS.values()].includes(info);
}

onErrorCaptured((err, _instance, info) => {
  // As React's error boundaries: an error in an event handler or a watcher
  // leaves the content in place and goes on to the app's error handler.
  if (!isRenderError(info)) return;
  error.value = err instanceof Error ? err : new Error(String(err));
  console.error("Uncaught error:", err);
  // Stop propagation so a parent boundary or the app error handler doesn't
  // handle the same error again.
  return false;
});

function reset() {
  error.value = null;
}
</script>

<template>
  <slot v-if="error" name="fallback" :error="error" :reset="reset">
    <div
      role="alert"
      class="flex size-full flex-col items-center justify-center gap-1 p-2"
    >
      <p class="text-sm font-medium text-ink-gray-7">Something went wrong</p>
      <p v-if="error.message" class="break-words text-sm text-ink-gray-5">
        {{ error.message }}
      </p>
    </div>
  </slot>
  <slot v-else />
</template>

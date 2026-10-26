<script setup lang="ts">
import { onErrorCaptured, ref } from "vue";
import type { ErrorFallbackSlotProps } from "./types";
import { isRenderError } from "./utils";

defineSlots<{
  default?: () => unknown;
  fallback?: (props: ErrorFallbackSlotProps) => unknown;
}>();

const error = ref<Error | null>(null);

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

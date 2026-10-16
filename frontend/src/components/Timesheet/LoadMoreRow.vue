<script setup lang="ts">
import { onBeforeUnmount, ref, useTemplateRef, watch } from "vue";
import { Skeleton } from "frappe-ui";
import type { LoadMoreRowProps } from "./types";

const props = withDefaults(defineProps<LoadMoreRowProps>(), {
  loading: false,
  hasMore: false,
  empty: false,
  emptyText: "No timesheet for this week",
  count: 1,
});

const emit = defineEmits<{
  /** The placeholder row came into view while more rows can load. */
  loadMore: [];
}>();

const placeholder = useTemplateRef<HTMLElement>("placeholder");
const visible = ref(false);
let observer: IntersectionObserver | undefined;

watch(placeholder, (element) => {
  observer?.disconnect();
  visible.value = false;
  if (!element) return;
  observer = new IntersectionObserver(([entry]) => {
    visible.value = Boolean(entry?.isIntersecting);
  });
  observer.observe(element);
});

onBeforeUnmount(() => observer?.disconnect());

// Still in view once a page arrives means the rows don't fill the area yet.
watch(
  () => [visible.value, props.loading, props.hasMore] as const,
  ([isVisible, loading, hasMore]) => {
    if (isVisible && !loading && hasMore) emit("loadMore");
  },
);
</script>

<template>
  <div
    v-if="loading || hasMore"
    ref="placeholder"
    role="status"
    aria-label="Loading more"
  >
    <div class="flex flex-col gap-px">
      <Skeleton
        v-for="index in count"
        :key="index"
        class="h-11 w-full shrink-0 rounded-none"
      />
    </div>
  </div>
  <div
    v-else-if="empty"
    class="flex h-11 items-center justify-center border-b border-outline-gray-1"
  >
    <p class="text-center text-base text-ink-gray-5">{{ emptyText }}</p>
  </div>
</template>

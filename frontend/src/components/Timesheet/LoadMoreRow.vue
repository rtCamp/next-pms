<script setup lang="ts">
import { shallowRef, useTemplateRef } from "vue";
import { Skeleton } from "frappe-ui";
import { useInfiniteScroll } from "@/composables/useInfiniteScroll";
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

useInfiniteScroll({
  root: shallowRef(null),
  sentinel: useTemplateRef<HTMLElement>("placeholder"),
  // The rows live in the parent; a request ending is when a page may have arrived.
  count: () => Number(props.loading),
  canLoad: () => !props.loading && props.hasMore,
  load: () => emit("loadMore"),
});
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

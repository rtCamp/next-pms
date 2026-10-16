<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { Avatar } from "frappe-ui";
import { formatProjectDate } from "@/utils/date";
import RagDot from "../cells/RagDot.vue";
import { CLICK_DRAG_THRESHOLD_PX } from "../constants";
import type { KanbanProjectItem } from "../types";

const props = defineProps<{ project: KanbanProjectItem }>();

const router = useRouter();

const dateRange = computed(() =>
  [props.project.start_date, props.project.end_date]
    .filter((date): date is string => Boolean(date))
    .map(formatProjectDate)
    .join(" - "),
);

const people = computed(() => [
  { icon: "lucide-headset", person: props.project.project_manager },
  { icon: "lucide-code", person: props.project.engineering_manager },
]);

function open() {
  router.push(`/projects/${encodeURIComponent(props.project.name)}`);
}

// A press that ends where it started is a click; one that moved was a drag.
let pressStart: { x: number; y: number } | null = null;
function onPointerDown(event: PointerEvent) {
  pressStart = { x: event.clientX, y: event.clientY };
}
function onPointerUp(event: PointerEvent) {
  const start = pressStart;
  pressStart = null;
  if (!start) return;
  const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
  if (moved <= CLICK_DRAG_THRESHOLD_PX) open();
}
</script>

<template>
  <div
    role="link"
    tabindex="0"
    :aria-label="project.project_name"
    class="flex w-full cursor-pointer flex-col gap-2.5 rounded-8 border border-outline-elevation-2 bg-surface-base pb-3 shadow-sm hover:bg-surface-gray-2 focus:outline-none focus-visible:ring focus-visible:ring-outline-gray-3"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @keydown.enter.prevent="open"
    @keydown.space.prevent="open"
  >
    <div
      class="flex w-full items-center gap-2 rounded-t-8 border-b border-outline-gray-1 px-3.5 py-3"
    >
      <RagDot :status="project.rag_status" />
      <span
        class="min-w-0 flex-1 truncate text-base-medium leading-tighter text-ink-gray-7"
        >{{ project.project_name }}</span
      >
    </div>
    <div
      class="flex w-full flex-col gap-3.5 px-4 text-base leading-tighter text-ink-gray-6"
    >
      <div class="flex w-full items-center gap-2">
        <span class="lucide-calendar size-4 shrink-0" aria-hidden="true" />
        <span class="truncate">{{ dateRange || "N/A" }}</span>
      </div>
      <div
        v-for="row in people"
        :key="row.icon"
        class="flex w-full items-center gap-2"
      >
        <span class="size-4 shrink-0" :class="row.icon" aria-hidden="true" />
        <template v-if="row.person">
          <Avatar
            size="xs"
            shape="circle"
            :image="row.person.image ?? undefined"
            :label="row.person.full_name"
          />
          <span class="truncate">{{ row.person.full_name }}</span>
        </template>
        <span v-else class="truncate">N/A</span>
      </div>
      <div class="flex w-full items-center gap-2">
        <span class="lucide-layout-grid size-4 shrink-0" aria-hidden="true" />
        <span class="truncate">{{ project.billing_type ?? "N/A" }}</span>
      </div>
    </div>
  </div>
</template>

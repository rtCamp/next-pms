<script setup lang="ts">
import { computed } from "vue";
import { Dropdown } from "frappe-ui";
import type { ProjectView } from "./types";
import { useProjectViews } from "./useProjectViews";
import ViewIcon from "./ViewIcon.vue";

const views = useProjectViews();

function viewOption(view: ProjectView) {
  return {
    label: view.label,
    viewIcon: view.icon,
    selected: views.activeView?.name === view.name,
    onClick: () => views.applyView(view),
  };
}

const options = computed(() => [
  {
    group: "Views",
    hideLabel: true,
    options: views.builtInViews.map(viewOption),
  },
]);
</script>

<template>
  <Dropdown :options="options" align="start">
    <template #default>
      <button
        type="button"
        class="flex min-w-0 items-center gap-1 rounded-4 px-0.5 py-1 text-lg-medium text-ink-gray-9"
        :aria-label="`View: ${views.activeView?.label ?? ''}`"
      >
        <ViewIcon :icon="views.activeView?.icon" />
        <span class="truncate">{{ views.activeView?.label }}</span>
        <span class="lucide-chevron-down size-4 shrink-0" aria-hidden="true" />
      </button>
    </template>
    <template #item-prefix="{ item }">
      <ViewIcon :icon="item.viewIcon" />
    </template>
  </Dropdown>
</template>

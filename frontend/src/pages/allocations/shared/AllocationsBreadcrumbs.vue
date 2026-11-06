<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { Dropdown } from "frappe-ui";
import { ALLOCATIONS_VIEWS } from "./constants";

const route = useRoute();

const activeView = computed(
  () =>
    ALLOCATIONS_VIEWS.find((view) => view.routeName === route.name) ??
    ALLOCATIONS_VIEWS[0],
);

const viewOptions = computed(() =>
  ALLOCATIONS_VIEWS.map((view) => ({
    label: view.label,
    icon: view.icon,
    selected: view.key === activeView.value.key,
    route: { name: view.routeName },
  })),
);
</script>

<template>
  <nav aria-label="Breadcrumb" class="flex min-w-0 items-center">
    <span class="px-0.5 py-1 text-lg-medium text-ink-gray-5">Allocations</span>
    <span class="mx-0.5 text-base text-ink-gray-4" aria-hidden="true">/</span>
    <Dropdown :options="viewOptions" align="start">
      <button
        type="button"
        class="flex items-center gap-1 rounded-4 px-0.5 py-1 text-lg-medium text-ink-gray-9 hover:bg-surface-gray-2"
      >
        <span :class="[activeView.icon, 'size-4']" aria-hidden="true" />
        {{ activeView.label }}
        <span class="lucide-chevron-down size-4" aria-hidden="true" />
      </button>
    </Dropdown>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { SidebarItem } from "frappe-ui";
import type { NavItem } from "./sidebarSections";
import { usePreloadRoute } from "./usePreloadRoute";

const props = defineProps<{
  label: string;
  items: NavItem[];
  sidebarCollapsed: boolean;
}>();

const route = useRoute();
const router = useRouter();
const preload = usePreloadRoute();
// SidebarItem marks the active item by route name; open the section holding it.
const hasActiveItem = computed(() =>
  props.items.some((item) => {
    const name = router.resolve(item.to).name;
    return name !== undefined && name === route.name;
  }),
);

const closed = ref(!hasActiveItem.value);
watch(
  () => route.path,
  () => {
    if (hasActiveItem.value) closed.value = false;
  },
);

const headingId = useId();
const bodyId = useId();
</script>

<template>
  <div>
    <hr class="mt-2 h-1 border-t border-outline-gray-2" />
    <div class="mt-2 flex flex-col">
      <h3
        v-if="!sidebarCollapsed"
        :id="headingId"
        class="text-sm text-ink-gray-6"
      >
        <button
          type="button"
          class="flex h-7 w-full items-center gap-1 rounded-4 px-4 focus-visible:ring-0 focus-visible:focus-ring"
          :aria-expanded="!closed"
          :aria-controls="bodyId"
          @click="closed = !closed"
        >
          <span
            aria-hidden="true"
            class="lucide-chevron-down size-4 transition-transform duration-300 ease-in-out"
            :class="{ '-rotate-90': closed }"
          />
          {{ label }}
        </button>
      </h3>
      <div
        v-show="sidebarCollapsed || !closed"
        :id="bodyId"
        role="group"
        :aria-labelledby="sidebarCollapsed ? undefined : headingId"
        :aria-label="sidebarCollapsed ? label : undefined"
        class="flex flex-col gap-0.5"
      >
        <SidebarItem
          v-for="item in items"
          :key="item.to"
          :class="{ 'pl-4': !sidebarCollapsed }"
          :label="item.label"
          :icon="item.icon"
          :route="item.to"
          @mouseenter="preload(item.to)"
          @focusin="preload(item.to)"
        >
          <span class="truncate text-base leading-tighter">{{
            item.label
          }}</span>
        </SidebarItem>
      </div>
    </div>
  </div>
</template>

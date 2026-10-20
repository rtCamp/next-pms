<script setup lang="ts">
import { computed, ref } from "vue";
import { Combobox } from "frappe-ui";
import { useEmployeeLookup } from "@/composables/useEmployeeLookup";
import MemberHoverCard from "./MemberHoverCard.vue";
import { managerOptions } from "./sidebar";
import type { AboutMember, ManagerRole } from "./types";
import { useProjectSidebar } from "./useProjectSidebar";

const props = defineProps<{
  managerRole: ManagerRole;
  label: string;
  manager?: AboutMember;
  /** Only employees whose user has one of these roles. */
  roles?: string[];
}>();

const { updateManager, isBusy } = useProjectSidebar();

const query = ref("");
const open = ref(false);

const lookup = useEmployeeLookup({
  enabled: open,
  // In input mode the combobox puts the selected label in the query; not a search.
  query: () => (query.value === props.manager?.name ? "" : query.value),
  roles: props.roles,
});

const options = computed(() => managerOptions(lookup.options, props.manager));
const busy = computed(() => isBusy(`manager:${props.managerRole}`));

const value = computed({
  get: () => props.manager?.userId ?? null,
  set: (userId) => {
    const next = userId ? String(userId) : null;
    if (next !== (props.manager?.userId ?? null)) {
      updateManager(props.managerRole, next);
    }
  },
});
</script>

<template>
  <MemberHoverCard :member="manager">
    <div
      class="col-span-2 grid grid-cols-subgrid items-center gap-2"
      :class="{ 'cursor-pointer': manager }"
    >
      <span class="text-nowrap">{{ label }}</span>
      <!-- eslint-disable better-tailwindcss/no-restricted-classes -- React's 12rem container query; no container-query plugin in the preset -->
      <Combobox
        v-model="value"
        v-model:query="query"
        v-model:open="open"
        class="col-span-2 min-w-0 [@container(min-width:12rem)]:col-span-1"
        variant="ghost"
        size="md"
        :options="options"
        :loading="lookup.loading || busy"
        :disabled="busy"
        :filterable="false"
        open-on-focus
        placeholder="N/A"
        :aria-label="label"
      />
      <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
    </div>
  </MemberHoverCard>
</template>

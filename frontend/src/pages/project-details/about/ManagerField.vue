<script setup lang="ts">
import { computed, ref } from "vue";
import { Combobox } from "frappe-ui";
import { useEmployeeLookup } from "@/composables/useEmployeeLookup";
import { errorMessage } from "@/utils/errors";
import MemberHoverCard from "./MemberHoverCard.vue";
import { managerOptions } from "./sidebar";
import type { AboutMember, ManagerRole } from "./types";
import { useProjectSidebar } from "./useProjectSidebar";

defineOptions({ inheritAttrs: false });

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
const menuHost = ref<HTMLElement>();

const lookup = useEmployeeLookup({
  enabled: open,
  // In input mode the combobox puts the selected label in the query; not a search.
  query: () => (query.value === props.manager?.name ? "" : query.value),
  roles: props.roles,
});

const options = computed(() => managerOptions(lookup.options, props.manager));
const searchError = computed(() =>
  lookup.error ? errorMessage(lookup.error) : null,
);
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
        :portal-to="menuHost"
      >
        <!-- The current manager is always an option, so the list may not be empty. -->
        <template v-if="searchError && !options.length" #empty>
          <span role="alert" class="text-ink-red-6">{{ searchError }}</span>
        </template>
        <template v-else-if="searchError" #footer>
          <p role="alert" class="px-3 py-1.5 text-base text-ink-red-6">
            {{ searchError }}
          </p>
        </template>
      </Combobox>
      <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
    </div>
  </MemberHoverCard>
  <!-- Outside the hover card's trigger, so leaving the field for the list still closes the card. -->
  <!-- eslint-disable better-tailwindcss/no-restricted-classes -- Combobox has no prop for its list's width or row height; the list renders in here to keep React's (field-wide, 28px rows) -->
  <div
    ref="menuHost"
    class="absolute [&_[data-slot=content]]:w-[--reka-combobox-trigger-width] [&_[data-slot=item]]:min-h-7 [&_[data-slot=item]>div]:min-h-7 [&_[data-slot=item]>div]:py-1"
  />
  <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
</template>

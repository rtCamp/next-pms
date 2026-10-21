<script setup lang="ts">
import { computed } from "vue";
import { Button, Dropdown } from "frappe-ui";
import dayjs from "dayjs";
import type { ProjectRepositoryConnection } from "@/pages/project-details/types";

const props = defineProps<{
  row: ProjectRepositoryConnection;
  busy: boolean;
}>();
const emit = defineEmits<{ unlink: [] }>();

const created = computed(() =>
  props.row.creation ? dayjs(props.row.creation).format("MMM D, YYYY") : "",
);

const options = [
  {
    label: "Unlink repository",
    icon: "lucide-unlink",
    theme: "red" as const,
    onClick: () => emit("unlink"),
  },
];
</script>

<template>
  <!-- eslint-disable better-tailwindcss/no-restricted-classes -- React's column widths; no grid-cols scale step for them -->
  <div
    role="row"
    class="grid grid-cols-[1fr_120px_40px] items-center gap-2 border-b border-outline-gray-1 p-2 text-ink-gray-7 last:border-b-0"
  >
    <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
    <div role="cell" class="flex min-w-0 items-center gap-2">
      <template v-if="row.github_repository">
        <span
          class="lucide-git-branch size-4 shrink-0 text-ink-gray-6"
          aria-hidden="true"
        />
        <a
          :href="`https://github.com/${row.github_repository}`"
          target="_blank"
          rel="noopener noreferrer"
          class="truncate text-base-medium leading-tighter text-ink-gray-7"
        >
          {{ row.github_repository }}
        </a>
      </template>
      <span v-else class="truncate text-base leading-tighter text-ink-gray-6">
        N/A
      </span>
    </div>
    <div role="cell" class="truncate text-base leading-tighter text-ink-gray-6">
      {{ created }}
    </div>
    <div role="cell" class="flex justify-end">
      <Button
        v-if="busy"
        variant="ghost"
        icon="lucide-ellipsis"
        label="Repository actions"
        loading
        disabled
      />
      <Dropdown v-else :options="options" side="bottom" align="end">
        <Button
          variant="ghost"
          icon="lucide-ellipsis"
          label="Repository actions"
        />
      </Dropdown>
    </div>
  </div>
</template>

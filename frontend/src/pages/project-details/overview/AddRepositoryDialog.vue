<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Button, Dialog, Spinner, TextInput } from "frappe-ui";
import { errorMessage } from "@/utils/errors";
import { useRepositoryLookup } from "./useRepositoryLookup";

const open = defineModel<boolean>("open", { required: true });

const props = defineProps<{
  connectedIds: Set<string>;
  isBusy: (key: string) => boolean;
  /** Connects the repository; resolves whether it worked. */
  connect: (repositoryId: string) => Promise<boolean>;
}>();

const query = ref("");
watch(open, (isOpen) => {
  if (!isOpen) query.value = "";
});

const lookup = useRepositoryLookup({ enabled: open, query });

const rows = computed(() =>
  lookup.options.map((option) => ({
    ...option,
    connected: props.connectedIds.has(option.value),
    busy: props.isBusy(`add:${option.value}`),
  })),
);

async function add(repositoryId: string) {
  if (await props.connect(repositoryId)) open.value = false;
}
</script>

<template>
  <Dialog
    v-model:open="open"
    title="Connect a GitHub repository"
    size="lg"
    position="top"
  >
    <div class="flex flex-col gap-3">
      <TextInput
        v-model="query"
        type="search"
        variant="subtle"
        placeholder="Search repositories"
        aria-label="Search repositories"
      >
        <template #prefix>
          <span
            class="lucide-search size-4 text-ink-gray-5"
            aria-hidden="true"
          />
        </template>
      </TextInput>

      <!-- eslint-disable better-tailwindcss/no-restricted-classes -- a thin scrollbar as React's list; no utility for scrollbar-width -->
      <div
        class="h-55 overflow-y-auto rounded-6 border border-outline-gray-2 px-2.5 py-2 [scrollbar-width:thin]"
      >
        <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
        <div
          v-if="lookup.loading && !rows.length"
          class="flex h-full items-center justify-center"
        >
          <Spinner class="size-4" />
        </div>
        <p
          v-else-if="lookup.error"
          role="alert"
          class="py-6 text-center text-base leading-tighter text-ink-red-6"
        >
          {{ errorMessage(lookup.error) }}
        </p>
        <p
          v-else-if="!rows.length"
          class="py-6 text-center text-base leading-tighter text-ink-gray-5"
        >
          No matching repositories
        </p>
        <ul
          v-else
          class="flex flex-col divide-y divide-outline-gray-1 pb-2"
          aria-label="GitHub repositories"
        >
          <li
            v-for="row in rows"
            :key="row.value"
            class="flex items-center gap-1 py-2 first:pt-0 last:pb-0"
          >
            <div class="flex min-w-0 flex-1 flex-col">
              <span
                class="truncate text-base-medium leading-tighter text-ink-gray-7"
              >
                {{ row.label }}
              </span>
              <span class="truncate text-sm text-ink-gray-5">
                {{ row.fullPath }}
              </span>
            </div>
            <Button
              v-if="row.connected"
              variant="subtle"
              theme="gray"
              label="Connected"
              disabled
            />
            <Button
              v-else
              variant="subtle"
              theme="gray"
              :aria-label="`Add ${row.fullPath}`"
              :loading="row.busy"
              @click="add(row.value)"
            >
              Add
            </Button>
          </li>
        </ul>
      </div>
    </div>
  </Dialog>
</template>

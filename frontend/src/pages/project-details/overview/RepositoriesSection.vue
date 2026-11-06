<script setup lang="ts">
import { ref } from "vue";
import { Button } from "frappe-ui";
import AddRepositoryDialog from "./AddRepositoryDialog.vue";
import OverviewSection from "./OverviewSection.vue";
import RepositoryRow from "./RepositoryRow.vue";
import { useRepositoryConnections } from "./useRepositoryConnections";

const { rows, connectedIds, isBusy, add, unlink } = useRepositoryConnections();

const dialogOpen = ref(false);
</script>

<template>
  <OverviewSection title="Project repository connections">
    <template #actions>
      <Button
        variant="ghost"
        icon="lucide-plus"
        label="Connect repository"
        @click="dialogOpen = true"
      />
    </template>
    <div role="table" aria-label="Repository connections" class="rounded-5">
      <div role="rowgroup">
        <!-- eslint-disable better-tailwindcss/no-restricted-classes -- React's column widths; no grid-cols scale step for them -->
        <div
          role="row"
          class="grid grid-cols-[1fr_120px_40px] items-center gap-2 border-b border-outline-gray-1 px-2 py-1.5 text-sm text-ink-gray-5"
        >
          <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
          <span role="columnheader" class="flex h-7 items-center truncate">
            Repository name
          </span>
          <span role="columnheader" class="flex h-7 items-center truncate">
            Created on
          </span>
          <span role="columnheader" class="sr-only">Actions</span>
        </div>
      </div>
      <p
        v-if="!rows.length"
        class="py-10 text-center text-sm leading-tighter text-ink-gray-4"
      >
        No repositories connected
      </p>
      <div v-else role="rowgroup">
        <RepositoryRow
          v-for="(row, index) in rows"
          :key="row.name ?? index"
          :row="row"
          :busy="Boolean(row.name) && isBusy(`unlink:${row.name}`)"
          @unlink="row.name && unlink(row.name)"
        />
      </div>
    </div>
    <AddRepositoryDialog
      v-model:open="dialogOpen"
      :connected-ids="connectedIds"
      :is-busy="isBusy"
      :connect="add"
    />
  </OverviewSection>
</template>

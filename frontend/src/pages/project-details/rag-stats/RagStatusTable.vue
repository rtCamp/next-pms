<script setup lang="ts">
import { dayjs, Tooltip } from "frappe-ui";
import {
  List,
  ListCell,
  ListHeader,
  ListHeaderCell,
  ListRow,
  ListRows,
} from "frappe-ui/list";
import TruncatedText from "@/pages/project-details/TruncatedText.vue";
import type { RagColumn, RagHistory, RagTrigger } from "./types";

defineProps<{
  label: string;
  columns: RagColumn[];
  rows: (RagTrigger | RagHistory)[];
  rowKey: (row: RagTrigger | RagHistory) => string;
  emptyMessage: string;
}>();

function formatDate(date: string | null | undefined) {
  return date ? dayjs(date).format("MMM D, YYYY") : "—";
}
</script>

<template>
  <List :columns="columns.map((column) => column.width)" :aria-label="label">
    <ListHeader>
      <ListHeaderCell v-for="column in columns" :key="column.key">
        {{ column.label }}
      </ListHeaderCell>
    </ListHeader>
    <p v-if="!rows.length" class="p-2 text-base text-ink-gray-5">
      {{ emptyMessage }}
    </p>
    <ListRows v-else v-slot="{ item }" :items="rows" :row-key="rowKey">
      <ListRow>
        <ListCell
          v-for="column in columns"
          :key="column.key"
          class="min-w-0 text-base text-ink-gray-6"
        >
          <TruncatedText v-if="column.key === 'type'" :text="item.type_label" />
          <template v-else-if="column.key === 'trigger_date'">
            <Tooltip
              v-if="item.trigger_date && item.date_precision === 'Approximate'"
              text="Approximate date — refreshed on the weekly RAG recompute."
            >
              <span>~{{ formatDate(item.trigger_date) }}</span>
            </Tooltip>
            <template v-else>{{ formatDate(item.trigger_date) }}</template>
          </template>
          <template v-else-if="column.key === 'clear_date'">
            {{ formatDate((item as RagHistory).clear_date) }}
          </template>
          <span v-else class="truncate">{{ item.alert }}</span>
        </ListCell>
      </ListRow>
    </ListRows>
  </List>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Button, Spinner } from "frappe-ui";
import {
  List,
  ListCell,
  ListHeader,
  ListHeaderCell,
  ListRow,
  ListRows,
} from "frappe-ui/list";
import type { ProjectReportRow } from "@/pages/project-details/types";
import { REPORT_COLUMNS } from "./constants";
import { formatGeneratedOn, sortReports } from "./utils";

const props = defineProps<{ reports: ProjectReportRow[] }>();
defineEmits<{ resync: [] }>();

const rows = computed(() => sortReports(props.reports));
</script>

<template>
  <section class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl-semibold text-ink-gray-8">Project Reports</h2>
      <Button
        v-if="reports.length"
        variant="subtle"
        label="Resync"
        @click="$emit('resync')"
      />
    </div>

    <p v-if="!rows.length" class="text-base text-ink-gray-5">
      No reports generated yet.
    </p>
    <div v-else class="overflow-x-auto">
      <List
        :columns="REPORT_COLUMNS.map((column) => column.width)"
        aria-label="Project reports"
        class="min-w-min list-gap-4 list-row-px-2"
      >
        <ListHeader class="data-[slot=list-header]:h-6">
          <ListHeaderCell
            v-for="column in REPORT_COLUMNS"
            :key="column.key"
            :class="column.align === 'right' && 'justify-end'"
          >
            {{ column.label }}
          </ListHeaderCell>
        </ListHeader>
        <ListRows v-slot="{ item }" :items="rows" row-key="id">
          <ListRow class="min-h-11 items-start py-2.5">
            <ListCell
              class="min-w-0 items-start pt-0.5 text-base text-ink-gray-7"
            >
              <span class="truncate">{{ item.index }}</span>
            </ListCell>
            <ListCell
              class="min-w-0 items-start pt-0.5 text-base text-ink-gray-7"
            >
              <span class="truncate">{{ item.date_range }}</span>
            </ListCell>
            <ListCell
              class="min-w-0 items-start pt-0.5 text-base text-ink-gray-7"
            >
              <span class="truncate">
                {{ formatGeneratedOn(item.generated_on) }}
              </span>
            </ListCell>
            <ListCell
              class="min-w-0 items-start pt-0.5 text-base text-ink-gray-7"
            >
              <span
                v-if="item.status === 'Generating'"
                class="flex items-center gap-2"
              >
                <Spinner class="size-3.5" />
                Generating...
              </span>
              <div
                v-else-if="item.status === 'Failed'"
                class="flex w-full min-w-0 flex-col gap-1"
              >
                <span class="font-semibold leading-tight text-ink-red-6">
                  Failed
                </span>
                <p
                  v-if="item.failure_reason"
                  class="line-clamp-3 break-words text-xs leading-relaxed text-ink-gray-7"
                  :title="item.failure_reason"
                >
                  {{ item.failure_reason }}
                </p>
                <span
                  v-if="item.run_id"
                  class="shrink-0 select-all truncate font-mono text-2xs text-ink-gray-5"
                >
                  Trace ID: {{ item.run_id }}
                </span>
              </div>
              <span v-else class="truncate">{{ item.status }}</span>
            </ListCell>
            <ListCell class="justify-end">
              <Button
                v-if="item.status === 'Done' && item.report_link"
                variant="ghost"
                icon="lucide-arrow-up-right"
                label="View Report"
                :href="item.report_link"
              />
            </ListCell>
          </ListRow>
        </ListRows>
      </List>
    </div>
  </section>
</template>

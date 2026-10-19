<script setup lang="ts">
import { computed, ref } from "vue";
import { Avatar, Button, dialog, toast } from "frappe-ui";
import {
  List,
  ListCell,
  ListHeader,
  ListHeaderCell,
  ListRow,
  ListRows,
} from "frappe-ui/list";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import RateDialog from "./RateDialog.vue";
import {
  formatRateDate,
  toFlatRate,
  toRateRows,
  withEditedRate,
  withRate,
  type RateInput,
  type RateRow,
} from "./rates";
import RowActions from "./RowActions.vue";
import { withoutRow } from "./contracts";
import { useTracking } from "./useTracking";

const COLUMNS = [
  { key: "name", label: "Members", width: "minmax(0,1fr)" },
  { key: "amount", label: "Hourly rates", width: "104px", right: true },
  { key: "date", label: "Valid from", width: "120px" },
  { key: "actions", label: "", width: "28px", right: true },
] as const;

const { doc, setValue, reload: reloadProject } = useProjectDetails();
const { tracking, reload: reloadTracking, money } = useTracking();

type Item =
  | ({ kind: "flat"; id: string } & ReturnType<typeof toFlatRate>)
  | ({ kind: "member" } & RateRow);

const items = computed<Item[] | null>(() => {
  const rates = tracking.value?.project_rates;
  if (!rates) return null;
  const [flat, ...members] = rates;
  return [
    ...(flat
      ? [{ kind: "flat" as const, id: "flat-rate", ...toFlatRate(flat, money) }]
      : []),
    ...toRateRows(members, money).map((row) => ({
      kind: "member" as const,
      ...row,
    })),
  ];
});

const addOpen = ref(false);
const editing = ref<RateRow | null>(null);
const editOpen = computed({
  get: () => editing.value !== null,
  set: (value) => {
    if (!value) editing.value = null;
  },
});
const editInitial = computed(() =>
  editing.value
    ? {
        employee: editing.value.employee,
        employeeName: editing.value.employeeName,
        hourlyRate: String(editing.value.hourlyRate),
        validFrom: editing.value.date,
      }
    : undefined,
);

const current = () => doc.value?.custom_project_billing_team ?? [];

async function write(rows: ReturnType<typeof current>, message: string) {
  await setValue({ custom_project_billing_team: rows });
  reloadProject();
  await reloadTracking();
  toast.success(message);
}

const add = (input: RateInput) =>
  write(withRate(current(), input), "Project Rate Added");

const edit = (input: RateInput) =>
  write(
    withEditedRate(current(), editing.value?.id ?? "", input),
    "Rate updated",
  );

function remove(row: RateRow) {
  dialog.danger({
    title: "Delete rate",
    message: `Are you sure you want to delete the rate for ${row.employeeName}? This action cannot be undone.`,
    confirmLabel: "Delete",
    onConfirm: () => write(withoutRow(current(), row.id), "Rate deleted"),
  });
}
</script>

<template>
  <section
    v-if="items"
    aria-label="Project rates"
    class="flex min-w-0 flex-1 flex-col gap-3 rounded-7 border border-outline-gray-1 bg-surface-elevation-1 p-3"
  >
    <div class="flex items-center justify-between">
      <h3 class="text-base-semibold text-ink-gray-8">Project rates</h3>
      <Button
        variant="subtle"
        icon="lucide-plus"
        label="Add project rate"
        @click="addOpen = true"
      />
    </div>
    <List
      :columns="COLUMNS.map((column) => column.width)"
      aria-label="Project rates"
    >
      <ListHeader>
        <ListHeaderCell
          v-for="column in COLUMNS"
          :key="column.key"
          :class="'right' in column && 'justify-end'"
        >
          {{ column.label }}
        </ListHeaderCell>
      </ListHeader>
      <p v-if="!items.length" class="py-10 text-center text-sm text-ink-gray-4">
        No project rates yet
      </p>
      <ListRows v-else v-slot="{ item }" :items="items" row-key="id">
        <ListRow
          v-if="item.kind === 'flat'"
          class="rounded-5 bg-surface-gray-2"
        >
          <ListCell class="min-w-0">
            <span class="truncate text-base-medium text-ink-gray-7">
              Flat rate
            </span>
          </ListCell>
          <ListCell class="justify-end text-base tabular-nums text-ink-gray-6">
            <span class="truncate">{{ item.amount }}</span>
          </ListCell>
          <ListCell class="text-base tabular-nums text-ink-gray-6">
            <span class="truncate">{{ formatRateDate(item.date) }}</span>
          </ListCell>
          <ListCell />
        </ListRow>
        <ListRow v-else>
          <ListCell class="min-w-0 gap-2">
            <Avatar size="xs" :label="item.employeeName" :image="item.image" />
            <span class="truncate text-base-medium text-ink-gray-7">
              {{ item.employeeName }}
            </span>
          </ListCell>
          <ListCell class="justify-end text-base tabular-nums text-ink-gray-6">
            <span class="truncate">{{ item.amount }}</span>
          </ListCell>
          <ListCell class="text-base tabular-nums text-ink-gray-6">
            <span class="truncate">{{ formatRateDate(item.date) }}</span>
          </ListCell>
          <ListCell class="justify-end">
            <RowActions
              :label="`Rate actions for ${item.employeeName}`"
              @edit="editing = item"
              @delete="remove(item)"
            />
          </ListCell>
        </ListRow>
      </ListRows>
    </List>
    <RateDialog v-model:open="addOpen" mode="add" :save="add" />
    <RateDialog
      v-model:open="editOpen"
      mode="edit"
      :initial="editInitial"
      :save="edit"
    />
  </section>
</template>

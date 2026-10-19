<script setup lang="ts">
import { computed, ref } from "vue";
import { Button, dialog, toast } from "frappe-ui";
import {
  List,
  ListCell,
  ListHeader,
  ListHeaderCell,
  ListRow,
  ListRows,
} from "frappe-ui/list";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import ContractDialog from "./ContractDialog.vue";
import {
  formatContractDate,
  toContractRows,
  withContract,
  withEditedContract,
  withoutRow,
  type ContractForm,
  type ContractInput,
  type ContractRow,
} from "./contracts";
import RowActions from "./RowActions.vue";
import { useTracking } from "./useTracking";

const COLUMNS = [
  { key: "startDate", label: "Start date", width: "88px" },
  { key: "endDate", label: "End date", width: "88px" },
  { key: "hoursBought", label: "Hours bought", width: "88px", right: true },
  { key: "hoursUsed", label: "Hours used", width: "88px", right: true },
  { key: "hoursLeft", label: "Hours left", width: "88px", right: true },
  { key: "salesOrder", label: "Sales order", width: "minmax(0,1fr)" },
  { key: "salesInvoice", label: "Sales invoice", width: "minmax(0,1fr)" },
  { key: "actions", label: "", width: "28px", right: true },
] as const;

const { doc, setValue } = useProjectDetails();
const { tracking, reload: reloadTracking } = useTracking();

const rows = computed(() =>
  tracking.value?.contracts ? toContractRows(tracking.value.contracts) : null,
);

const addOpen = ref(false);
const editing = ref<ContractRow | null>(null);
const editOpen = computed({
  get: () => editing.value !== null,
  set: (value) => {
    if (!value) editing.value = null;
  },
});
const editInitial = computed<Partial<ContractForm> | undefined>(() =>
  editing.value
    ? {
        startDate: editing.value.startDate,
        endDate: editing.value.endDate,
        hoursBought: String(editing.value.hoursBoughtRaw),
        salesOrder: editing.value.salesOrder,
        salesInvoice: editing.value.salesInvoice,
      }
    : undefined,
);

const current = () => doc.value?.custom_project_budget_hours ?? [];

async function write(
  rows: ReturnType<typeof current>,
  message: string,
): Promise<void> {
  await setValue({ custom_project_budget_hours: rows });
  await reloadTracking();
  toast.success(message);
}

const add = (input: ContractInput) =>
  write(withContract(current(), input), "Contract added");

const edit = (input: ContractInput) =>
  write(
    withEditedContract(current(), editing.value?.name ?? "", input),
    "Contract updated",
  );

function remove(row: ContractRow) {
  dialog.danger({
    title: "Delete contract",
    message:
      "Are you sure you want to delete this contract? This action cannot be undone.",
    confirmLabel: "Delete",
    onConfirm: () => write(withoutRow(current(), row.name), "Contract deleted"),
  });
}
</script>

<template>
  <section
    v-if="rows"
    aria-label="Contracts"
    class="flex min-w-0 flex-1 flex-col gap-3 rounded-7 border border-outline-gray-1 bg-surface-elevation-1 p-3"
  >
    <div class="flex items-center justify-between">
      <h3 class="text-base-semibold text-ink-gray-8">Contracts</h3>
      <Button
        variant="subtle"
        icon="lucide-plus"
        label="Add contract"
        @click="addOpen = true"
      />
    </div>
    <List
      :columns="COLUMNS.map((column) => column.width)"
      aria-label="Contracts"
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
      <p v-if="!rows.length" class="py-10 text-center text-sm text-ink-gray-4">
        No contracts yet
      </p>
      <ListRows v-else v-slot="{ item }" :items="rows" row-key="id">
        <ListRow>
          <ListCell class="min-w-0 text-base text-ink-gray-6">
            <span class="truncate">{{
              formatContractDate(item.startDate)
            }}</span>
          </ListCell>
          <ListCell class="min-w-0 text-base text-ink-gray-6">
            <span class="truncate">{{ formatContractDate(item.endDate) }}</span>
          </ListCell>
          <ListCell class="min-w-0 justify-end text-base text-ink-gray-6">
            <span class="truncate">{{ item.hoursBought }}</span>
          </ListCell>
          <ListCell class="min-w-0 justify-end text-base text-ink-gray-6">
            <span class="truncate">{{ item.hoursUsed }}</span>
          </ListCell>
          <ListCell class="min-w-0 justify-end text-base text-ink-gray-6">
            <span class="truncate">{{ item.hoursLeft }}</span>
          </ListCell>
          <ListCell class="min-w-0 text-base text-ink-gray-6">
            <span class="truncate">{{ item.salesOrder }}</span>
          </ListCell>
          <ListCell class="min-w-0 text-base text-ink-gray-6">
            <span class="truncate">{{ item.salesInvoice }}</span>
          </ListCell>
          <ListCell class="justify-end">
            <RowActions
              label="Contract actions"
              @edit="editing = item"
              @delete="remove(item)"
            />
          </ListCell>
        </ListRow>
      </ListRows>
    </List>
    <ContractDialog v-model:open="addOpen" mode="add" :save="add" />
    <ContractDialog
      v-model:open="editOpen"
      mode="edit"
      :initial="editInitial"
      :save="edit"
    />
  </section>
</template>

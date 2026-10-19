<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  Button,
  Combobox,
  DatePicker,
  Dialog,
  dayjs,
  ErrorMessage,
  TextInput,
} from "frappe-ui";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { errorMessage } from "@/utils/errors";
import {
  validateContract,
  type ContractErrors,
  type ContractForm,
  type ContractInput,
} from "./contracts";
import { useSalesDocLookup } from "./useSalesDocLookup";

const props = defineProps<{
  mode: "add" | "edit";
  initial?: Partial<ContractForm>;
  save: (input: ContractInput) => Promise<void>;
}>();
const open = defineModel<boolean>("open", { required: true });

const { doc } = useProjectDetails();

const form = reactive<ContractForm>(emptyForm());
const errors = reactive<ContractErrors>({});
const submitError = ref("");
const submitting = ref(false);
const orderQuery = ref("");
const invoiceQuery = ref("");

function emptyForm(): ContractForm {
  const today = dayjs().format("YYYY-MM-DD");
  return {
    startDate: today,
    endDate: today,
    hoursBought: "",
    salesOrder: "",
    salesInvoice: "",
    ...props.initial,
  };
}

watch(open, (isOpen) => {
  if (!isOpen) return;
  Object.assign(form, emptyForm());
  for (const key of Object.keys(errors))
    delete errors[key as keyof ContractForm];
  submitError.value = "";
  orderQuery.value = "";
  invoiceQuery.value = "";
});

for (const key of Object.keys(emptyForm()) as (keyof ContractForm)[]) {
  watch(
    () => form[key],
    () => delete errors[key],
  );
}

const customer = () => doc.value?.customer;
// In input mode the combobox puts the selected label in the query; not a search.
const orderLookup = useSalesDocLookup({
  doctype: "Sales Order",
  customer,
  enabled: open,
  query: () => (orderQuery.value === form.salesOrder ? "" : orderQuery.value),
});
const invoiceLookup = useSalesDocLookup({
  doctype: "Sales Invoice",
  customer,
  enabled: open,
  query: () =>
    invoiceQuery.value === form.salesInvoice ? "" : invoiceQuery.value,
});

const salesOrder = computed({
  get: () => form.salesOrder || null,
  set: (value) => (form.salesOrder = value ? String(value) : ""),
});
const salesInvoice = computed({
  get: () => form.salesInvoice || null,
  set: (value) => (form.salesInvoice = value ? String(value) : ""),
});

const isEdit = computed(() => props.mode === "edit");

async function submit() {
  submitError.value = "";
  Object.assign(errors, validateContract(form));
  if (Object.keys(errors).length) return;
  submitting.value = true;
  try {
    await props.save({
      startDate: form.startDate,
      endDate: form.endDate,
      hoursBought: Number(form.hoursBought),
      salesOrder: form.salesOrder || undefined,
      salesInvoice: form.salesInvoice || undefined,
    });
  } catch (error) {
    submitError.value = errorMessage(error);
    return;
  } finally {
    submitting.value = false;
  }
  open.value = false;
}
</script>

<template>
  <Dialog
    v-model:open="open"
    :title="isEdit ? 'Edit contract' : 'Add contract'"
    size="sm"
    position="top"
    :dismissible="!submitting"
  >
    <form class="space-y-4" novalidate @submit.prevent="submit">
      <div class="flex w-full gap-4">
        <DatePicker
          v-model="form.startDate"
          class="flex-1"
          label="Start date"
          required
          :error="errors.startDate"
          variant="outline"
          placeholder="Select date"
          format="MMM D, YYYY"
        />
        <DatePicker
          v-model="form.endDate"
          class="flex-1"
          label="End date"
          required
          :error="errors.endDate"
          variant="outline"
          placeholder="Select date"
          format="MMM D, YYYY"
        />
      </div>
      <TextInput
        v-model="form.hoursBought"
        label="Hours bought"
        required
        :error="errors.hoursBought"
        type="number"
        variant="outline"
        size="md"
        placeholder="Enter hours"
      />
      <Combobox
        v-model="salesOrder"
        v-model:query="orderQuery"
        label="Sales order"
        variant="outline"
        size="md"
        :options="orderLookup.options"
        :loading="orderLookup.loading"
        :filterable="false"
        open-on-focus
        placeholder="Select sales order"
      />
      <Combobox
        v-model="salesInvoice"
        v-model:query="invoiceQuery"
        label="Sales invoice"
        variant="outline"
        size="md"
        :options="invoiceLookup.options"
        :loading="invoiceLookup.loading"
        :filterable="false"
        open-on-focus
        placeholder="Select sales invoice"
      />
      <ErrorMessage v-if="submitError" :message="submitError" />
    </form>

    <template #actions>
      <Button
        class="w-full"
        variant="solid"
        :label="isEdit ? 'Save changes' : 'Add contract'"
        :loading="submitting"
        :disabled="submitting"
        @click="submit"
      />
    </template>
  </Dialog>
</template>

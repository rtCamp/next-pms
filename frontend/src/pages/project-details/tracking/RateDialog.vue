<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  Avatar,
  Button,
  Combobox,
  DatePicker,
  Dialog,
  dayjs,
  ErrorMessage,
  TextInput,
} from "frappe-ui";
import { useRemoteLookup } from "@/composables/useRemoteLookup";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { errorMessage } from "@/utils/errors";
import {
  validateRate,
  type RateErrors,
  type RateForm,
  type RateInput,
} from "./rates";

const props = defineProps<{
  mode: "add" | "edit";
  initial?: Partial<RateForm> & { employeeName?: string };
  save: (input: RateInput) => Promise<void>;
}>();
const open = defineModel<boolean>("open", { required: true });

const { projectId } = useProjectDetails();

const form = reactive<RateForm>(emptyForm());
const employeeLabel = ref("");
const errors = reactive<RateErrors>({});
const submitError = ref("");
const submitting = ref(false);
const query = ref("");

function emptyForm(): RateForm {
  return {
    employee: props.initial?.employee ?? "",
    hourlyRate: props.initial?.hourlyRate ?? "",
    validFrom: props.initial?.validFrom ?? dayjs().format("YYYY-MM-DD"),
  };
}

watch(open, (isOpen) => {
  if (!isOpen) return;
  Object.assign(form, emptyForm());
  employeeLabel.value = props.initial?.employeeName ?? form.employee;
  for (const key of Object.keys(errors)) delete errors[key as keyof RateForm];
  submitError.value = "";
  query.value = "";
});

for (const key of Object.keys(emptyForm()) as (keyof RateForm)[]) {
  watch(
    () => form[key],
    () => delete errors[key],
  );
}

interface EmployeeItem {
  name: string;
  employee_name: string;
  image?: string | null;
}

const lookup = useRemoteLookup<{ data: EmployeeItem[] } | null, EmployeeItem>({
  method: "next_pms.timesheet.api.employee.get_employee_list",
  enabled: open,
  // In input mode the combobox puts the selected label in the query; not a search.
  query: () => (query.value === employeeLabel.value ? "" : query.value),
  selected: () =>
    form.employee
      ? { value: form.employee, label: employeeLabel.value || form.employee }
      : null,
  params: (search) => ({
    employee_name: search || undefined,
    page_length: 20,
    start: 0,
    project: JSON.stringify([projectId.value]),
  }),
  getItems: (response) => response?.data ?? [],
  toOption: (employee) => ({
    label: employee.employee_name,
    value: employee.name,
    image: employee.image ?? undefined,
  }),
});

const employee = computed({
  get: () => form.employee || null,
  set: (value) => {
    form.employee = value ? String(value) : "";
    employeeLabel.value =
      lookup.options.find((option) => option.value === form.employee)?.label ??
      form.employee;
  },
});

const noMembers = computed(
  () => !lookup.loading && !query.value && lookup.options.length === 0,
);
const isEdit = computed(() => props.mode === "edit");

async function submit() {
  submitError.value = "";
  Object.assign(errors, validateRate(form));
  if (Object.keys(errors).length) return;
  submitting.value = true;
  try {
    await props.save({
      employee: form.employee,
      hourlyRate: Number(form.hourlyRate),
      validFrom: form.validFrom,
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
    :title="isEdit ? 'Edit project rate' : 'Add project rate'"
    size="sm"
    position="top"
    :dismissible="!submitting"
  >
    <form class="space-y-4" novalidate @submit.prevent="submit">
      <Combobox
        v-model="employee"
        v-model:query="query"
        label="Member"
        required
        :error="errors.employee"
        variant="outline"
        size="md"
        :options="lookup.options"
        :loading="lookup.loading"
        :filterable="false"
        open-on-focus
        placeholder="Select member"
        :empty-text="
          noMembers
            ? 'This project doesn\'t have any assigned team members'
            : undefined
        "
      >
        <template #item-prefix="{ item }">
          <Avatar
            size="xs"
            shape="circle"
            :label="item.label"
            :image="item.image"
          />
        </template>
      </Combobox>
      <TextInput
        v-model="form.hourlyRate"
        label="Hourly rate"
        required
        :error="errors.hourlyRate"
        type="number"
        variant="outline"
        size="md"
        placeholder="0"
      >
        <template #suffix>
          <span class="pr-2 text-sm text-ink-gray-5">/h</span>
        </template>
      </TextInput>
      <DatePicker
        v-model="form.validFrom"
        label="Valid from"
        required
        :error="errors.validFrom"
        variant="outline"
        placeholder="Select date"
        format="YYYY-MM-DD"
      >
        <template #suffix>
          <span class="lucide-calendar size-4" aria-hidden="true" />
        </template>
      </DatePicker>
      <ErrorMessage v-if="submitError" :message="submitError" />
    </form>

    <template #actions>
      <Button
        class="w-full"
        variant="solid"
        :label="isEdit ? 'Save changes' : 'Add rate'"
        :loading="submitting"
        :disabled="submitting"
        @click="submit"
      />
    </template>
  </Dialog>
</template>

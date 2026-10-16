<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  Button,
  Combobox,
  Dialog,
  ErrorMessage,
  Select,
  TextInput,
  toast,
  useDoctype,
} from "frappe-ui";
import { useDoctypeLinkLookup } from "@/composables/useDoctypeLinkLookup";
import { useProjectPhases } from "@/composables/useProjectPhases";
import type { LookupOption } from "@/composables/useRemoteLookup";
import { errorMessage } from "@/utils/errors";

const props = defineProps<{
  /** Phase to start with, e.g. from a kanban column's add button. */
  phase?: string;
}>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ saved: [] }>();

interface ProjectForm {
  projectName: string;
  phase: string;
  company: string;
  companyLabel: string;
  customer: string;
  customerLabel: string;
}
type FormErrors = Partial<Record<keyof ProjectForm, string>>;

const projectPhases = useProjectPhases();
const phaseOptions = computed(() =>
  projectPhases.phases.map(({ phase }) => ({ label: phase, value: phase })),
);

const form = reactive<ProjectForm>(emptyForm());
const errors = reactive<FormErrors>({});
const submitError = ref("");
const submitting = ref(false);

function emptyForm(): ProjectForm {
  return {
    projectName: "",
    phase: props.phase || projectPhases.phases[0]?.phase || "",
    company: "",
    companyLabel: "",
    customer: "",
    customerLabel: "",
  };
}

watch(open, (isOpen) => {
  if (!isOpen) return;
  Object.assign(form, emptyForm());
  for (const key of Object.keys(errors))
    delete errors[key as keyof ProjectForm];
  submitError.value = "";
  companyQuery.value = "";
  customerQuery.value = "";
});

// The phases may arrive after the dialog opens.
watch(
  () => projectPhases.phases[0]?.phase,
  (first) => {
    if (!form.phase && first) form.phase = first;
  },
);

// A field's error goes away once the user changes it; the rest stay until the
// next submit, as in the React form.
for (const key of Object.keys(emptyForm()) as (keyof ProjectForm)[]) {
  watch(
    () => form[key],
    () => delete errors[key],
  );
}

function selectedOption(value: string, label: string): LookupOption | null {
  return value ? { value, label: label || value } : null;
}

const companyQuery = ref("");
const companyLookup = useDoctypeLinkLookup({
  doctype: "Company",
  labelField: "company_name",
  enabled: open,
  // In input mode the combobox puts the selected label in the query; not a search.
  query: () =>
    companyQuery.value === form.companyLabel ? "" : companyQuery.value,
  selected: () => selectedOption(form.company, form.companyLabel),
});

const customerQuery = ref("");
const customerLookup = useDoctypeLinkLookup({
  doctype: "Customer",
  labelField: "customer_name",
  enabled: open,
  query: () =>
    customerQuery.value === form.customerLabel ? "" : customerQuery.value,
  selected: () => selectedOption(form.customer, form.customerLabel),
});

const company = computed({
  get: () => form.company || null,
  set: (value: string | number | null | undefined) => {
    form.company = value ? String(value) : "";
    form.companyLabel =
      companyLookup.options.find((option) => option.value === form.company)
        ?.label ?? form.company;
  },
});

const customer = computed({
  get: () => form.customer || null,
  set: (value: string | number | null | undefined) => {
    form.customer = value ? String(value) : "";
    form.customerLabel =
      customerLookup.options.find((option) => option.value === form.customer)
        ?.label ?? form.customer;
  },
});

/** Messages copied from the React form's schema. */
function validate(): boolean {
  if (!form.projectName.trim()) errors.projectName = "Enter Project Name";
  if (!form.phase.trim()) errors.phase = "Select Phase";
  if (!form.company.trim()) errors.company = "Select Company";
  if (!form.customer.trim()) errors.customer = "Select Customer";
  return Object.keys(errors).length === 0;
}

const projects = useDoctype("Project");

async function submit() {
  submitError.value = "";
  if (!validate()) return;
  submitting.value = true;
  try {
    await projects.insert.submit({
      naming_series: "PROJ-.####",
      project_name: form.projectName,
      custom_project_phase: form.phase,
      company: form.company,
      customer: form.customer,
    });
  } catch (error) {
    submitError.value = errorMessage(error);
    return;
  } finally {
    submitting.value = false;
  }
  toast.success("Project created successfully");
  open.value = false;
  emit("saved");
}

function close() {
  if (!submitting.value) open.value = false;
}
</script>

<template>
  <!-- React's dialog sat 120px from the top; frappe-ui adds a 32px margin above the
       panel, hence 88. -->
  <Dialog
    v-model:open="open"
    title="Add Project"
    position="top"
    :padding-top="88"
    :dismissible="!submitting"
  >
    <form class="space-y-4" novalidate @submit.prevent="submit">
      <TextInput
        v-model="form.projectName"
        label="Project"
        required
        :error="errors.projectName"
        size="md"
        variant="outline"
        placeholder="Project Name"
      />
      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- frappe-ui's Select renders a <label> from `label` -->
      <Select
        v-model="form.phase"
        label="Phase"
        required
        :error="errors.phase"
        size="md"
        variant="outline"
        :options="phaseOptions"
        placeholder="Select phase"
      />
      <Combobox
        v-model="company"
        v-model:query="companyQuery"
        label="Company"
        required
        :error="errors.company"
        size="md"
        variant="outline"
        :options="companyLookup.options"
        :loading="companyLookup.loading"
        :filterable="false"
        placeholder="Select company"
      />
      <Combobox
        v-model="customer"
        v-model:query="customerQuery"
        label="Customer"
        required
        :error="errors.customer"
        size="md"
        variant="outline"
        :options="customerLookup.options"
        :loading="customerLookup.loading"
        :filterable="false"
        placeholder="Select customer"
      />
      <ErrorMessage v-if="submitError" :message="submitError" />
    </form>

    <template #actions>
      <div class="flex w-full items-center justify-end gap-2">
        <Button variant="ghost" label="Cancel" @click="close" />
        <Button
          variant="solid"
          label="Add Project"
          :loading="submitting"
          :disabled="submitting"
          @click="submit"
        />
      </div>
    </template>
  </Dialog>
</template>

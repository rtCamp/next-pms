<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  Button,
  Combobox,
  DatePicker,
  dayjs,
  Dialog,
  ErrorMessage,
  FormLabel,
  Select,
  TabButtons,
  Textarea,
  toast,
  useCall,
  useDoctype,
} from "frappe-ui";
import { useEmployeeLookup } from "@/composables/useEmployeeLookup";
import { useSession } from "@/session";
import { errorMessage } from "@/utils/errors";
import { LEAVE_DURATIONS } from "./constants";
import type { LeaveDuration } from "./types";

const props = withDefaults(
  defineProps<{
    /** Shows the Employee picker, for applying for someone else's leave. */
    pickEmployee?: boolean;
  }>(),
  { pickEmployee: false },
);
const open = defineModel<boolean>("open", { required: true });

interface LeaveForm {
  employeeId: string;
  employeeLabel: string;
  fromDate: string;
  toDate: string;
  leaveDuration: LeaveDuration;
  halfDayDate: string;
  leaveType: string;
  reason: string;
}
type FormErrors = Partial<Record<keyof LeaveForm, string>>;

const session = useSession();

function today() {
  return dayjs().format("YYYY-MM-DD");
}

function emptyForm(): LeaveForm {
  return {
    employeeId: "",
    employeeLabel: "",
    fromDate: today(),
    toDate: today(),
    leaveDuration: "full-day",
    halfDayDate: "",
    leaveType: "",
    reason: "",
  };
}

const form = reactive<LeaveForm>(emptyForm());
const errors = reactive<FormErrors>({});
const submitError = ref("");
const employeeQuery = ref("");

function clearErrors() {
  for (const key of Object.keys(errors)) delete errors[key as keyof LeaveForm];
  submitError.value = "";
}

watch(open, (isOpen) => {
  if (isOpen) return;
  Object.assign(form, emptyForm());
  clearErrors();
  employeeQuery.value = "";
});

// A field's error goes away once the user changes it.
for (const key of Object.keys(emptyForm()) as (keyof LeaveForm)[]) {
  watch(
    () => form[key],
    () => delete errors[key],
  );
}

const employeeId = computed(() =>
  props.pickEmployee ? form.employeeId : (session.employee ?? ""),
);

const employeeLookup = useEmployeeLookup({
  enabled: () => open.value && props.pickEmployee,
  query: () =>
    employeeQuery.value === form.employeeLabel ? "" : employeeQuery.value,
  selected: () =>
    form.employeeId
      ? { label: form.employeeLabel, value: form.employeeId }
      : null,
});

const employee = computed({
  get: () => form.employeeId || null,
  set: (value: string | number | null) => {
    form.employeeId = value ? String(value) : "";
    form.employeeLabel =
      employeeLookup.options.find((option) => option.value === form.employeeId)
        ?.label ?? form.employeeId;
  },
});

const leaveDetails = useCall<
  { lwps?: string[]; leave_allocation?: Record<string, unknown> },
  { employee: string; date: string }
>({
  url: "/api/v2/method/hrms.hr.doctype.leave_application.leave_application.get_leave_details",
  params: () => ({ employee: employeeId.value, date: today() }),
  immediate: false,
});

watch(
  [open, employeeId],
  ([isOpen, employee]) => {
    if (isOpen && employee) leaveDetails.fetch();
  },
  { immediate: true },
);

const leaveTypeOptions = computed(() =>
  [
    ...(leaveDetails.data?.lwps ?? []),
    ...Object.keys(leaveDetails.data?.leave_allocation ?? {}),
  ].map((type) => ({ label: type, value: type })),
);

const durationOptions = LEAVE_DURATIONS.map((value) => ({
  value,
  label: titleCase(value),
}));

function titleCase(value: string) {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const showHalfDayDate = computed(
  () => form.leaveDuration !== "full-day" && form.fromDate !== form.toDate,
);

/** Messages from the React form's schema. */
function validate(): boolean {
  if (props.pickEmployee && !form.employeeId.trim()) {
    errors.employeeId = "Please select an employee.";
  }
  if (!form.fromDate.trim()) errors.fromDate = "Please select from date.";
  if (!form.toDate.trim()) errors.toDate = "Please select to date.";
  if (!form.leaveType.trim()) errors.leaveType = "Please select leave type.";
  if (!form.reason.trim()) errors.reason = "Please enter a reason.";
  if (showHalfDayDate.value) {
    if (!form.halfDayDate) {
      errors.halfDayDate = "Please select half day date.";
    } else if (
      form.halfDayDate < form.fromDate ||
      form.halfDayDate > form.toDate
    ) {
      errors.halfDayDate =
        "Half day date must be between from date and to date.";
    }
  }
  return Object.keys(errors).length === 0;
}

const leaveApplications = useDoctype("Leave Application");
const submitting = computed(() => leaveApplications.insert.loading);

async function submit() {
  clearErrors();
  if (!validate()) return;
  const halfDay = form.leaveDuration !== "full-day";
  try {
    await leaveApplications.insert.submit({
      employee: employeeId.value,
      description: form.reason,
      from_date: form.fromDate,
      to_date: form.toDate,
      leave_type: form.leaveType,
      half_day: halfDay,
      half_day_date: halfDay
        ? form.fromDate !== form.toDate
          ? form.halfDayDate
          : form.fromDate
        : undefined,
      custom_first_halfsecond_half: halfDay
        ? titleCase(form.leaveDuration)
        : "",
    });
    toast.success("Leave created successfully");
    open.value = false;
  } catch (error) {
    // React's own time-off dialog toasts the error and closes; its employee
    // variant keeps the dialog open with the error.
    if (props.pickEmployee) {
      submitError.value = errorMessage(error);
    } else {
      toast.error(errorMessage(error));
      open.value = false;
    }
  }
}
</script>

<template>
  <!-- React's dialog sat 120px from the top; frappe-ui adds a 32px margin above the
       panel, hence 88. -->
  <Dialog
    v-model:open="open"
    title="Add time off"
    size="md"
    position="top"
    :padding-top="88"
    :dismissible="!submitting"
  >
    <form class="space-y-4" novalidate @submit.prevent="submit">
      <Combobox
        v-if="pickEmployee"
        v-model="employee"
        v-model:query="employeeQuery"
        label="Employee"
        required
        :error="errors.employeeId"
        size="md"
        variant="outline"
        :options="employeeLookup.options"
        :loading="employeeLookup.loading"
        :filterable="false"
        open-on-focus
        placeholder="Select employee"
      />
      <div class="flex gap-4">
        <div class="flex-1">
          <DatePicker
            v-model="form.fromDate"
            label="From"
            required
            :error="errors.fromDate"
            variant="outline"
            format="MMM D, YYYY"
            placeholder="Select start date"
            :typeable="false"
          >
            <template #suffix>
              <span
                class="lucide-calendar size-4 shrink-0"
                aria-hidden="true"
              />
            </template>
          </DatePicker>
        </div>
        <div class="flex-1">
          <DatePicker
            v-model="form.toDate"
            label="To"
            required
            :error="errors.toDate"
            variant="outline"
            format="MMM D, YYYY"
            placeholder="Select end date"
            :typeable="false"
          >
            <template #suffix>
              <span
                class="lucide-calendar size-4 shrink-0"
                aria-hidden="true"
              />
            </template>
          </DatePicker>
        </div>
      </div>
      <div class="space-y-1.5">
        <FormLabel label="Leave duration" required />
        <TabButtons
          v-model="form.leaveDuration"
          :options="durationOptions"
          aria-label="Leave duration"
        />
      </div>
      <DatePicker
        v-if="showHalfDayDate"
        v-model="form.halfDayDate"
        label="Half Day Date"
        required
        :error="errors.halfDayDate"
        variant="outline"
        format="MMM D, YYYY"
        placeholder="Select half day date"
        :typeable="false"
      >
        <template #suffix>
          <span class="lucide-calendar size-4 shrink-0" aria-hidden="true" />
        </template>
      </DatePicker>
      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- frappe-ui's Select renders a <label> from `label` -->
      <Select
        v-model="form.leaveType"
        label="Leave type"
        required
        :error="errors.leaveType"
        size="md"
        variant="outline"
        :options="leaveTypeOptions"
        placeholder="Select leave type"
      />
      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- frappe-ui's Textarea renders a <label> from `label` -->
      <Textarea
        v-model="form.reason"
        label="Reason"
        required
        :error="errors.reason"
        variant="outline"
      />
      <ErrorMessage v-if="submitError" :message="submitError" />
    </form>

    <template #actions>
      <Button
        class="w-full"
        variant="solid"
        label="Add time-off"
        icon-left="lucide-calendar-x-2"
        :loading="submitting"
        :disabled="submitting"
        @click="submit"
      />
    </template>
  </Dialog>
</template>

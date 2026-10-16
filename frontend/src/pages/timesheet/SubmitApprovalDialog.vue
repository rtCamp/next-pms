<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  Avatar,
  Button,
  Combobox,
  dayjs,
  Dialog,
  ErrorMessage,
  Textarea,
  toast,
  useCall,
} from "frappe-ui";
import { useSession } from "@/session";
import { errorMessage } from "@/utils/errors";
import { floatToTime } from "@/utils/format";
import type { SubmitApprovalWeek } from "./useTimesheetDialogs";

const props = defineProps<{ week: SubmitApprovalWeek }>();
const open = defineModel<boolean>("open", { required: true });

interface Approver {
  name: string;
  employee_name: string;
  image?: string | null;
}

const session = useSession();

const note = ref("");
const approver = ref<string | null>(null);
const approverError = ref("");
const submitError = ref("");

watch(
  open,
  (isOpen) => {
    if (!isOpen) return;
    note.value = "";
    approver.value = session.reportsTo;
    approverError.value = "";
    submitError.value = "";
  },
  { immediate: true },
);
watch(approver, () => (approverError.value = ""));

const approvers = useCall<Approver[]>({
  url: "/api/v2/method/next_pms.timesheet.api.get_approver_details",
  immediate: false,
});
watch(
  open,
  (isOpen) => {
    if (isOpen && !approvers.data) approvers.fetch();
  },
  { immediate: true },
);

const approverOptions = computed(() =>
  (approvers.data ?? []).map((employee) => ({
    label: employee.employee_name,
    value: employee.name,
    image: employee.image ?? undefined,
  })),
);

function avatarOf(option: unknown) {
  return option as { label: string; image?: string };
}

const weekLabel = computed(() => {
  const { startDate, endDate } = props.week;
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  return start.isValid() && end.isValid()
    ? `Week of ${start.format("MMM D")} - ${end.format("MMM D")}`
    : `Week of ${startDate} - ${endDate}`;
});

const submitCall = useCall<unknown, Record<string, unknown>>({
  url: "/api/v2/method/next_pms.timesheet.api.timesheet.submit_for_approval",
  method: "POST",
  immediate: false,
});

async function submit() {
  submitError.value = "";
  if (!approver.value?.trim()) {
    approverError.value = "Please select an approver.";
    return;
  }
  try {
    await submitCall.submit({
      employee: session.employee,
      start_date: props.week.startDate,
      end_date: props.week.endDate,
      approver: approver.value,
      notes: note.value,
    });
  } catch (error) {
    submitError.value = errorMessage(error);
    return;
  }
  toast.success("Timesheet submitted for approval successfully");
  open.value = false;
}
</script>

<template>
  <!-- React's dialog sat 120px from the top; frappe-ui adds a 32px margin above the
       panel, hence 88. -->
  <Dialog
    v-model:open="open"
    title="Submit for approval"
    position="top"
    :padding-top="88"
    :dismissible="!submitCall.loading"
  >
    <form class="space-y-4" novalidate @submit.prevent="submit">
      <div
        class="flex items-center justify-between rounded-8 bg-surface-gray-1 px-4 py-2.5 text-base"
      >
        <span class="text-ink-gray-7">{{ weekLabel }}</span>
        <span class="font-medium text-ink-green-4">
          {{ floatToTime(week.totalHours) }}
        </span>
      </div>
      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- frappe-ui's Textarea renders a <label> from `label` -->
      <Textarea
        v-model="note"
        label="Note"
        variant="outline"
        placeholder="Comment"
      />
      <Combobox
        v-model="approver"
        label="Send to"
        required
        :error="approverError"
        size="md"
        variant="outline"
        :options="approverOptions"
        :loading="approvers.loading"
        open-on-focus
        placeholder="Select approver"
      >
        <template #item-prefix="{ item }">
          <Avatar
            size="xs"
            :image="avatarOf(item).image"
            :label="avatarOf(item).label"
          />
        </template>
      </Combobox>
      <ErrorMessage v-if="submitError" :message="submitError" />
    </form>

    <template #actions>
      <Button
        class="w-full"
        variant="solid"
        label="Submit"
        :loading="submitCall.loading"
        :disabled="submitCall.loading"
        @click="submit"
      />
    </template>
  </Dialog>
</template>

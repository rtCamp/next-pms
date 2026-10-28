<script setup lang="ts">
import { computed } from "vue";
import {
  Avatar,
  Button,
  Checkbox,
  Combobox,
  DateRangePicker,
  Dialog,
  FormLabel,
  TabButtons,
  Textarea,
  TextInput,
} from "frappe-ui";
import { DurationInput } from "@/components/DurationInput";
import { InfoHoverCard } from "@/components/InfoHoverCard";
import {
  RECURRENCE_OPTIONS,
  scheduleRequestFromForm,
  type AllocationRecurrence,
} from "./allocationForm";
import { ALLOCATION_DIALOG_HELP } from "./help";
import OverAllocationWarning from "./OverAllocationWarning.vue";
import { useAllocationDialogs } from "./useAllocationDialogs";
import { useAllocationForm } from "./useAllocationForm";

defineOptions({ inheritAttrs: false });

const dialogs = useAllocationDialogs();
const state = useAllocationForm(dialogs);
const form = state.form;

const weekendEntriesAllowed = window.boot?.allow_weekend_entries ?? false;

const open = computed({
  get: () => dialogs.form.open,
  set: (value: boolean) => (dialogs.form.open = value),
});

const isAi = computed(() => state.context.isAiCreated);
const title = computed(() =>
  isAi.value
    ? "Approve / Edit Allocation"
    : state.mode === "add"
      ? "Add allocation"
      : "Edit allocation",
);
const submitLabel = computed(() =>
  isAi.value ? "Approve" : state.mode === "add" ? "Allocate" : "Save Changes",
);

/** An add picks one time or recurring; an edit keeps what the allocation is. */
const recurrenceOptions = computed(() =>
  RECURRENCE_OPTIONS.map((option) => ({
    ...option,
    disabled:
      state.mode === "edit" &&
      option.value !== (state.locks.isRecurringEdit ? "recurring" : "one-time"),
  })),
);
const recurrence = computed({
  get: () => form.recurrence,
  set: (value: string | number) =>
    (form.recurrence = value as AllocationRecurrence),
});
const showRepeat = computed(
  () => form.recurrence === "recurring" || state.locks.isRecurringEdit,
);

const employee = computed({
  get: () => form.employeeId || null,
  set: state.setEmployee,
});
const project = computed({
  get: () => form.projectId || null,
  set: state.setProject,
});

const dateRange = computed({
  get: (): [string, string] | [] =>
    form.fromDate || form.toDate ? [form.fromDate, form.toDate] : [],
  set: (value: [string, string] | []) => {
    form.fromDate = value[0] ?? "";
    form.toDate = value[1] ?? "";
  },
});
const dateError = computed(
  () => state.errors.fromDate ?? state.errors.toDate ?? "",
);

const repeatFor = computed({
  get: () => form.repeatFor ?? "",
  set: (value: string | number) => {
    if (value === "") {
      form.repeatFor = null;
      return;
    }
    const parsed = Number(value);
    if (Number.isFinite(parsed)) form.repeatFor = parsed;
  },
});

const isNonBillable = computed({
  get: () => !form.isBillable,
  set: (value: boolean) => (form.isBillable = !value),
});

const lockedHoursMessage = computed(() => {
  if (state.locks.isRecurringEdit) {
    return "Recurring allocations can only be modified using Edit Schedule.";
  }
  if (state.locks.isMetadataLocked) {
    return "This allocation has schedule changes. Use Edit Schedule to modify them.";
  }
  return "This allocation has custom day changes. Use Edit Schedule to change hours / day.";
});

function openEditSchedule() {
  dialogs.openEditSchedule(
    scheduleRequestFromForm(form, state.context, state.locks),
  );
}

/** An AI allocation is dismissed by deleting it, after a confirmation. */
const canDelete = computed(
  () => isAi.value && Boolean(state.context.allocationId),
);
function deleteAllocation() {
  const request = dialogs.form.request;
  if (request) dialogs.confirmDelete(request.data, undefined, state.close);
}

function avatarOf(option: unknown) {
  return option as { label: string; image?: string };
}
</script>

<template>
  <Dialog
    v-model:open="open"
    position="top"
    :padding-top="88"
    :dismissible="!state.submitting"
  >
    <template #title>
      <div class="flex flex-col gap-0.5">
        <span class="text-lg-medium text-ink-gray-7">{{ title }}</span>
        <span v-if="isAi" class="text-sm text-ink-gray-5">
          This allocation was created by
          <span class="text-ink-amber-8">Ai</span>
        </span>
        <div
          v-if="isAi && state.context.aiReason"
          class="mt-2 flex min-w-0 max-w-full items-center gap-1 text-ink-amber-8"
          :title="state.context.aiReason"
        >
          <span class="shrink-0 text-sm-medium">Remark:</span>
          <p class="min-w-0 truncate text-sm">{{ state.context.aiReason }}</p>
        </div>
      </div>
    </template>

    <form class="space-y-4" novalidate @submit.prevent="state.submit">
      <template v-for="field in dialogs.fieldOrder" :key="field">
        <div v-if="field === 'employee'">
          <Combobox
            v-model="employee"
            v-model:query="state.employeeQuery"
            label="Employee"
            required
            size="md"
            variant="outline"
            :error="state.errors.employeeId"
            :options="state.employeeLookup.options"
            :loading="state.employeeLookup.loading || state.access.loading"
            :filterable="false"
            :disabled="state.locks.isMetadataLocked"
            :empty-text="
              state.projectHasNoMembers
                ? 'This project doesn\'t have any assigned team members'
                : undefined
            "
            open-on-focus
            placeholder="Select Employee"
          >
            <template #item-prefix="{ item }">
              <span class="flex" aria-hidden="true">
                <Avatar
                  size="xs"
                  shape="circle"
                  :image="avatarOf(item).image"
                  :label="avatarOf(item).label"
                />
              </span>
            </template>
          </Combobox>
          <p
            v-if="state.isMismatch"
            class="mt-1.5 flex flex-wrap gap-1 text-sm text-ink-red-8"
            role="alert"
          >
            <span>This employee is not part of the project's team.</span>
            <a
              :href="`/next-pms/projects/${encodeURIComponent(form.projectId)}`"
              target="_blank"
              rel="noopener noreferrer"
              class="underline"
            >
              Add them to the team
            </a>
          </p>
          <p
            v-if="state.isAiAccessUnavailable"
            class="mt-1.5 flex items-center gap-2 text-sm text-ink-red-8"
            role="alert"
          >
            <span>Unable to verify project access.</span>
            <button
              type="button"
              class="underline"
              @click="state.access.retry()"
            >
              Retry
            </button>
          </p>
        </div>
        <Combobox
          v-else-if="field === 'project'"
          v-model="project"
          v-model:query="state.projectQuery"
          label="Project"
          required
          size="md"
          variant="outline"
          :error="state.errors.projectId"
          :options="state.projectLookup.options"
          :loading="state.projectLookup.loading || state.access.loading"
          :filterable="false"
          :disabled="state.locks.isMetadataLocked"
          :empty-text="
            state.employeeHasNoProjects
              ? 'This employee isn\'t part of any project\'s team'
              : undefined
          "
          open-on-focus
          placeholder="Select Project"
        />
        <Combobox
          v-else
          :model-value="form.customerId || null"
          label="Customer"
          size="md"
          variant="outline"
          :error="state.errors.customerId"
          :options="state.customerLookup.options"
          :loading="state.customerLookup.loading || state.projectLookup.loading"
          :filterable="false"
          disabled
          placeholder="Select Customer"
        />
      </template>

      <div class="space-y-1.5">
        <FormLabel label="Recurrence" />
        <TabButtons
          v-model="recurrence"
          fluid
          :options="recurrenceOptions"
          aria-label="Recurrence"
        />
      </div>

      <div class="space-y-1.5">
        <FormLabel label="Days to include" />
        <div class="flex flex-col gap-1.5">
          <Checkbox
            v-if="weekendEntriesAllowed || form.includeWeekends"
            v-model="form.includeWeekends"
            label="Include weekends"
            :disabled="!weekendEntriesAllowed || state.locks.isMetadataLocked"
          />
          <div class="flex min-w-0 items-center gap-1.5">
            <Checkbox v-model="form.includeHolidays" label="Include holidays" />
            <InfoHoverCard :help="ALLOCATION_DIALOG_HELP.includeHolidays" />
          </div>
        </div>
      </div>

      <div class="flex w-full flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <FormLabel label="Start and end date" required />
          <Button
            v-if="state.mode === 'edit'"
            variant="ghost"
            size="sm"
            label="Edit Schedule"
            :disabled="state.isMismatch || !state.context.allocationId"
            @click="openEditSchedule"
          />
        </div>
        <!-- frappe-ui re-reads the shown range on blur, splitting it on commas: with
             "MMM D, YYYY" a picked Nov 9–13, 2026 became Nov 9, 2001 – Jan 1, 2026. -->
        <DateRangePicker
          v-model="dateRange"
          variant="outline"
          format="MMM D YYYY"
          placeholder="Start Date - End Date"
          aria-label="Start and end date"
          :error="dateError"
          :disabled="state.locks.isMetadataLocked"
        />
      </div>

      <div class="flex gap-3">
        <div class="flex flex-1 shrink-0 flex-col gap-1.5">
          <FormLabel id="hours-per-day" label="Hours / day" required />
          <DurationInput
            id="hours-per-day"
            v-model="form.hoursPerDay"
            snap="smooth"
            variant="outline"
            size="md"
            :disabled="state.locks.isHoursPerDayLocked"
            :error="state.errors.hoursPerDay"
          />
        </div>
        <div v-if="showRepeat" class="flex flex-1 shrink-0 flex-col gap-1.5">
          <div class="flex items-center gap-1.5">
            <FormLabel id="repeat-for" label="Repeat for" required />
            <InfoHoverCard :help="ALLOCATION_DIALOG_HELP.repeatFor" />
          </div>
          <TextInput
            id="repeat-for"
            v-model="repeatFor"
            required
            type="number"
            size="md"
            variant="outline"
            min="1"
            :disabled="state.mode === 'edit'"
            :error="state.errors.repeatFor"
          >
            <template #suffix>
              <span class="text-sm text-ink-gray-5">
                {{ form.repeatFor === 1 ? "week" : "weeks" }}
              </span>
            </template>
          </TextInput>
        </div>
        <div class="flex flex-1 shrink-0 flex-col gap-1.5">
          <div class="flex items-center gap-1.5">
            <FormLabel id="total-hours" label="Total hours" />
            <InfoHoverCard :help="ALLOCATION_DIALOG_HELP.totalHours" />
          </div>
          <TextInput
            id="total-hours"
            :model-value="state.totalHours"
            size="md"
            variant="outline"
            disabled
          />
        </div>
      </div>

      <div
        v-if="
          state.locks.hasLeaveOwnedOverrides &&
          isAi &&
          !state.locks.isMetadataLocked
        "
        class="flex items-start gap-2 rounded-6 bg-surface-blue-1 px-2.5 py-2"
      >
        <span
          class="lucide-triangle-alert mt-0.5 size-4 shrink-0 text-ink-blue-6"
          aria-hidden="true"
        />
        <div class="min-w-0 flex-1 text-left text-xs text-ink-gray-9">
          <p class="mb-1 font-medium">
            This allocation includes holidays or leave
          </p>
          <p class="text-ink-gray-7">
            Those days are excluded from the total hours and will be
            recalculated if you change the dates or hours.
          </p>
        </div>
      </div>

      <div
        v-if="state.locks.isHoursPerDayLocked"
        class="flex items-center gap-2 rounded-6 bg-surface-violet-1 px-2.5 py-2"
      >
        <span
          class="lucide-triangle-alert size-4 shrink-0 text-ink-violet-7"
          aria-hidden="true"
        />
        <p class="min-w-0 flex-1 text-left text-xs text-ink-gray-9">
          {{ lockedHoursMessage }}
        </p>
      </div>

      <OverAllocationWarning
        v-if="!state.locks.isMetadataLocked"
        :days="state.overAllocatedDays"
      />

      <div class="flex items-center gap-2">
        <Checkbox
          v-model="isNonBillable"
          label="Mark as non-billable"
          :disabled="state.locks.isMetadataLocked"
        />
        <span
          class="inline-block size-1 rounded-full bg-surface-amber-7"
          aria-hidden="true"
        />
      </div>

      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- frappe-ui's Textarea renders a <label> from `label` -->
      <Textarea
        v-model="form.note"
        label="Note"
        variant="outline"
        placeholder="Add a note"
        :disabled="state.locks.isMetadataLocked"
      />
    </form>

    <template #actions>
      <div class="flex w-full items-center justify-between gap-2">
        <Checkbox
          v-model="form.isTentative"
          class="shrink-0"
          label="Mark as tentative"
          :disabled="state.locks.isMetadataLocked"
        />
        <div class="flex w-full items-center justify-end gap-2">
          <Button
            v-if="canDelete"
            variant="ghost"
            label="Delete"
            :disabled="state.submitting"
            @click="deleteAllocation"
          />
          <Button
            v-else
            variant="ghost"
            label="Cancel"
            :disabled="state.submitting"
            @click="state.close"
          />
          <Button
            variant="solid"
            :label="submitLabel"
            :loading="state.submitting"
            :disabled="!state.canSubmit"
            @click="state.submit"
          />
        </div>
      </div>
    </template>
  </Dialog>

  <!-- Mounted only while open: an always-mounted second dialog stays aria-hidden by
       the first one's modal, which hid it before it opened. -->
  <Dialog
    v-if="state.approveConfirmOpen"
    v-model:open="state.approveConfirmOpen"
    title="Approve allocation"
    :message="`${form.employeeLabel || form.employeeId} is not part of ${form.projectLabel || form.projectId}'s team yet. Approving will give them access to the project. Continue?`"
  >
    <template #actions>
      <div class="flex w-full items-center justify-end gap-2">
        <Button
          variant="ghost"
          label="Cancel"
          @click="state.approveConfirmOpen = false"
        />
        <Button
          variant="solid"
          label="Approve"
          :loading="state.submitting"
          @click="state.confirmApproval"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  Button,
  Dialog,
  ErrorMessage,
  FormLabel,
  Select,
  TextInput,
} from "frappe-ui";
import { DurationInput } from "@/components/DurationInput";
import { toDisplayHours } from "./schedule";
import ScheduleDayStrip from "./ScheduleDayStrip.vue";
import ScheduleSummaryTable from "./ScheduleSummaryTable.vue";
import { useAllocationDialogs } from "./useAllocationDialogs";
import {
  APPLY_MODE_OPTIONS,
  useEditSchedule,
  type ScheduleApplyMode,
} from "./useEditSchedule";

const dialogs = useAllocationDialogs();
const state = useEditSchedule(dialogs);

const open = computed({
  get: () => dialogs.schedule.open,
  set: (value: boolean) => (dialogs.schedule.open = value),
});

const hoursPerDay = computed({
  get: () => state.draft.hoursPerDay,
  set: state.setHoursPerDay,
});
const totalHours = computed({
  get: () =>
    state.draft.hasSelection ? toDisplayHours(state.draft.totalHours) : "",
  set: state.setTotalHours,
});
const applyMode = computed({
  get: () => state.applyMode,
  set: (value: string | number) =>
    (state.applyMode = value as ScheduleApplyMode),
});
</script>

<template>
  <Dialog
    v-model:open="open"
    size="sm"
    position="top"
    :padding-top="88"
    :dismissible="!state.submitting"
  >
    <template #title>
      <span class="text-lg-medium text-ink-gray-7">Edit schedule</span>
    </template>

    <div class="space-y-3">
      <div class="space-y-0.5">
        <div
          class="flex items-center justify-between text-base text-ink-gray-5"
        >
          <span>Select dates to edit</span>
          <span class="text-right">{{ state.draft.headerRangeLabel }}</span>
        </div>
        <ScheduleDayStrip
          :days="state.days"
          :selection="state.draft.selection"
          :recurrence-helper-text="state.recurrenceHelperText"
          @toggle="state.toggleDay"
        />
        <p v-if="state.includeHolidays" class="text-sm text-ink-gray-5">
          Includes holidays
        </p>
        <p
          v-if="state.recurrenceHelperText && state.days.length > 3"
          class="text-sm text-ink-gray-4"
        >
          {{ state.recurrenceHelperText }}
        </p>
        <ErrorMessage
          v-if="state.errors.selection"
          :message="state.errors.selection"
        />
      </div>

      <div class="flex w-full items-start gap-2 pb-1.5">
        <div class="flex-1 space-y-1.5">
          <FormLabel
            id="edit-hours-per-day"
            label="Edit hours / day"
            required
          />
          <DurationInput
            id="edit-hours-per-day"
            v-model="hoursPerDay"
            snap="smooth"
            variant="outline"
            :disabled="!state.draft.hasSelection"
            :error="
              state.input.mode === 'hoursPerDay'
                ? state.errors.value || undefined
                : undefined
            "
          />
        </div>
        <div class="flex-1">
          <TextInput
            v-model="totalHours"
            label="Edit total hours"
            required
            type="number"
            variant="outline"
            :disabled="!state.draft.hasSelection"
            :error="
              state.input.mode === 'totalHours'
                ? state.errors.value || undefined
                : undefined
            "
          />
        </div>
      </div>

      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- frappe-ui's Select renders a <label> from `label` -->
      <Select
        v-if="state.isRecurring"
        v-model="applyMode"
        label="Apply edits to"
        variant="outline"
        size="md"
        :options="APPLY_MODE_OPTIONS"
      />

      <div class="space-y-1.5">
        <FormLabel label="Schedule summary" />
        <ScheduleSummaryTable
          :rows="state.draft.previewRows"
          :variant="state.applyMode === 'this_and_future' ? 'day' : 'date'"
          :include-weekends="state.includeWeekends"
        />
      </div>
    </div>

    <template #actions>
      <div class="flex w-full items-center justify-end gap-2">
        <Button variant="ghost" label="Cancel" @click="state.close" />
        <Button
          variant="solid"
          label="Save changes"
          :loading="state.submitting"
          :disabled="state.submitting"
          @click="state.submit"
        />
      </div>
    </template>
  </Dialog>
</template>

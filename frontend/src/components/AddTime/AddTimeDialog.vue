<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { dayjs, toast, useCall } from "frappe-ui";
import { useEmployeeLookup } from "@/composables/useEmployeeLookup";
import { useProjectLookup } from "@/composables/useProjectLookup";
import { useTaskLookup } from "@/composables/useTaskLookup";
import { useSession } from "@/session";
import AddTime from "./AddTime.vue";
import type { AddTimeEntry, AddTimePrefill, CalendarEvent } from "./types";
import { entryFromPrefill, lookupQuery } from "./utils";

const props = withDefaults(
  defineProps<{
    /** Values the entry starts with. */
    prefill?: AddTimePrefill;
    /** Shows the Employee picker, for logging someone else's time. */
    pickEmployee?: boolean;
  }>(),
  { prefill: () => ({}), pickEmployee: false },
);
const open = defineModel<boolean>("open", { required: true });

/** Hours a day the form allows when the employee's are unknown. */
const FALLBACK_DAILY_WORKING_HOURS = 8;
/** Days of calendar events offered from the entry's date on. */
const CALENDAR_EVENT_DAYS = 7;

const session = useSession();

const entry = ref<AddTimeEntry>(entryFromPrefill(props.prefill));
const employeeQuery = ref("");
const projectQuery = ref("");
const taskQuery = ref("");
const showCalendarEvents = ref(false);

const employeeId = computed(() =>
  props.pickEmployee ? entry.value.employeeId : (session.employee ?? ""),
);

const employeeLookup = useEmployeeLookup({
  enabled: () => open.value && props.pickEmployee,
  query: () => lookupQuery(employeeQuery.value, entry.value.employeeLabel),
  selected: () =>
    entry.value.employeeId
      ? { label: entry.value.employeeLabel, value: entry.value.employeeId }
      : null,
});

const projectLookup = useProjectLookup({
  enabled: open,
  query: () => lookupQuery(projectQuery.value, entry.value.projectLabel),
  selected: () =>
    entry.value.project
      ? { label: entry.value.projectLabel, value: entry.value.project }
      : null,
});

const taskLookup = useTaskLookup({
  enabled: open,
  query: () => lookupQuery(taskQuery.value, entry.value.taskLabel),
  projectId: () => entry.value.project || undefined,
  selected: () =>
    entry.value.task
      ? {
          label: entry.value.taskLabel,
          value: entry.value.task,
          projectId: entry.value.project,
          projectName: entry.value.projectLabel,
          status: entry.value.taskStatus,
        }
      : null,
});

const remainingHours = useCall<
  { working_hour: number; remaining_hours: number },
  { employee: string; date: string }
>({
  url: "/api/v2/method/next_pms.timesheet.api.timesheet.get_remaining_hour_for_employee",
  params: () => ({ employee: employeeId.value, date: entry.value.date }),
  immediate: false,
});

watch(
  [open, employeeId, () => entry.value.date],
  ([isOpen, employee, date]) => {
    if (isOpen && employee && date) remainingHours.fetch();
  },
  { immediate: true },
);

const calendarSetup = Boolean(window.boot?.is_calendar_setup);

const calendarEvents = useCall<
  CalendarEvent[],
  { start_date: string; end_date: string }
>({
  url: "/api/v2/method/next_pms.api.get_user_calendar_events",
  params: () => ({
    start_date: entry.value.date,
    end_date: dayjs(entry.value.date)
      .add(CALENDAR_EVENT_DAYS, "day")
      .format("YYYY-MM-DD"),
  }),
  immediate: false,
});

watch(
  [open, showCalendarEvents, () => entry.value.date],
  ([isOpen, show, date]) => {
    if (isOpen && show && calendarSetup && date) calendarEvents.fetch();
  },
);

const timedEvents = computed(() =>
  (calendarEvents.data ?? []).filter((event) => !event.all_day),
);

const saveCall = useCall<unknown, Record<string, unknown>>({
  url: "/api/v2/method/next_pms.timesheet.api.timesheet.save",
  method: "POST",
  immediate: false,
});

async function save(value: AddTimeEntry, keepOpen: boolean) {
  await saveCall.submit({
    date: value.date,
    description: value.comment,
    task: value.task,
    hours: value.duration,
    employee: props.pickEmployee ? value.employeeId : session.employee,
  });
  toast.success("Time Entry submitted successfully");
  if (keepOpen) await remainingHours.fetch();
}
</script>

<template>
  <AddTime
    v-model:open="open"
    v-model:entry="entry"
    v-model:employee-query="employeeQuery"
    v-model:project-query="projectQuery"
    v-model:task-query="taskQuery"
    v-model:show-calendar-events="showCalendarEvents"
    :pick-employee="pickEmployee"
    :prefill="prefill"
    :employee-options="employeeLookup.options"
    :employees-loading="employeeLookup.loading"
    :project-options="projectLookup.options"
    :projects-loading="projectLookup.loading"
    :task-options="taskLookup.options"
    :tasks-loading="taskLookup.loading"
    :max-duration="
      remainingHours.data?.working_hour ?? FALLBACK_DAILY_WORKING_HOURS
    "
    :hours-left="
      remainingHours.data?.remaining_hours ?? FALLBACK_DAILY_WORKING_HOURS
    "
    :hours-loading="remainingHours.loading"
    :calendar-setup="calendarSetup"
    :calendar-events="timedEvents"
    :calendar-loading="calendarEvents.loading"
    :calendar-error="Boolean(calendarEvents.error)"
    :save="save"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  Avatar,
  Button,
  Checkbox,
  Dialog,
  ErrorMessage,
  Textarea,
  toast,
  Tooltip,
  useCall,
} from "frappe-ui";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui";
import { errorMessage } from "@/utils/errors";
import { floatToTime } from "@/utils/format";
import type { TimesheetData } from "@/pages/timesheet/types";
import { DECIDED_DAY_TOOLTIP } from "@/pages/timesheet/team/help";
import ApprovalEntryRow from "./ApprovalEntryRow.vue";
import type { ApprovalEntry, WeeklyApprovalTarget } from "./types";
import { groupEntriesByDay, toApprovalWeek } from "./utils";

type Params = Record<string, string | number | undefined>;

const props = defineProps<{ target: WeeklyApprovalTarget }>();

defineOptions({ inheritAttrs: false });
const open = defineModel<boolean>("open", { required: true });

const view = ref<"approval" | "rejection">("approval");
const reason = ref("");
const reasonError = ref("");
const rejectionError = ref("");

// Hidden until the week has loaded, as React kept it.
const loaded = ref(false);
const timesheet = useCall<TimesheetData, Params>({
  url: "/api/v2/method/next_pms.timesheet.api.timesheet.get_timesheet_data",
  params: () => ({
    employee: props.target.employeeId,
    start_date: props.target.startDate,
    max_week: 1,
    filters: props.target.projectId
      ? JSON.stringify([
          ["Timesheet", "parent_project", "=", props.target.projectId],
        ])
      : undefined,
  }),
  onSuccess: () => (loaded.value = true),
  onError: () => (loaded.value = true),
});
const updateCall = useCall<string, Params>({
  url: "/api/v2/method/next_pms.timesheet.api.timesheet.update_timesheet_detail",
  method: "POST",
  immediate: false,
});
const decideCall = useCall<string, Record<string, unknown>>({
  url: "/api/v2/method/next_pms.timesheet.api.team.approve_or_reject_timesheet",
  method: "POST",
  immediate: false,
});

const week = computed(() => toApprovalWeek(timesheet.data ?? null));
const days = computed(() => groupEntriesByDay(week.value.entries));
const isReadOnly = computed(
  () => days.value.length > 0 && days.value.every((day) => day.isDecided),
);
const weeklyRejectionReason = computed(() =>
  week.value.entries
    .map((entry) => entry.weeklyRejectionReason?.trim())
    .find(Boolean),
);

const checkedDays = ref(new Set<string>());
// Every day still open to a decision starts checked. Keyed on those days, so clearing
// the last checkbox stays cleared while a reload that changes them reseeds.
const actionableKey = computed(() =>
  days.value
    .filter((day) => !day.isDecided)
    .map((day) => day.date)
    .join("|"),
);
watch(
  actionableKey,
  (key) => {
    if (key) checkedDays.value = new Set(key.split("|"));
  },
  { immediate: true },
);
const blocked = computed(
  () => isReadOnly.value || checkedDays.value.size === 0,
);

function setChecked(date: string, checked: boolean) {
  if (isReadOnly.value) return;
  const next = new Set(checkedDays.value);
  if (checked) next.add(date);
  else next.delete(date);
  checkedDays.value = next;
}

const collapsedDays = ref(new Set<string>());
function toggleDay(date: string) {
  const next = new Set(collapsedDays.value);
  if (!next.delete(date)) next.add(date);
  collapsedDays.value = next;
}

function checkedDates() {
  return days.value
    .filter((day) => checkedDays.value.has(day.date))
    .map((day) => day.date);
}

function close() {
  open.value = false;
}

watch(open, (isOpen) => {
  if (isOpen) return;
  view.value = "approval";
  rejectionError.value = "";
});

async function saveEntry(
  entry: ApprovalEntry,
  values: { hours: number; description: string },
) {
  if (isReadOnly.value) return;
  try {
    const message = await updateCall.submit({
      name: entry.name,
      parent: entry.parent,
      task: entry.taskId,
      date: entry.date,
      description: values.description,
      hours: values.hours,
    });
    if (message) toast.success(message);
    timesheet.reload();
  } catch (error) {
    toast.error(errorMessage(error));
  }
}

function decide(status: "Approved" | "Rejected", note?: string) {
  return decideCall.submit({
    dates: checkedDates(),
    status,
    employee: props.target.employeeId,
    note,
    project: props.target.projectId,
  });
}

async function approve() {
  if (blocked.value) return;
  let message: string | null;
  try {
    message = await decide("Approved");
  } catch (error) {
    toast.error(errorMessage(error));
    return;
  }
  if (message) toast.success(message);
  timesheet.reload();
  close();
}

function startRejection() {
  if (blocked.value) return;
  rejectionError.value = "";
  reason.value = "";
  reasonError.value = "";
  timesheet.reload();
  view.value = "rejection";
}

async function reject() {
  if (blocked.value) return;
  if (!reason.value.trim()) {
    reasonError.value = "Please enter a reason.";
    return;
  }
  reasonError.value = "";
  rejectionError.value = "";
  let message: string | null;
  try {
    message = await decide("Rejected", reason.value);
  } catch (error) {
    rejectionError.value = errorMessage(error);
    return;
  }
  if (message) toast.success(message);
  timesheet.reload();
  close();
}

watch(reason, () => (reasonError.value = ""));

function onOpenChange(next: boolean) {
  if (!next && decideCall.loading) return;
  open.value = next;
}

const fade = {
  enterActiveClass: "transition-opacity duration-200 ease-out",
  enterFromClass: "opacity-0",
  leaveActiveClass: "transition-opacity duration-200 ease-in",
  leaveToClass: "opacity-0",
};
</script>

<template>
  <!-- A sheet docked to the right, as in React; frappe-ui has no side sheet. -->
  <DialogRoot
    :open="open && loaded && view === 'approval'"
    @update:open="onOpenChange"
  >
    <DialogPortal>
      <Transition v-bind="fade">
        <DialogOverlay
          class="fixed inset-0 z-50 bg-black-overlay-200 dark:bg-black-overlay-700"
        />
      </Transition>
      <Transition v-bind="fade">
        <DialogContent
          class="fixed inset-2.5 z-50 ml-auto flex max-w-120 flex-col rounded-7 bg-surface-elevation-1 shadow-xl outline-none"
        >
          <div
            class="flex items-center justify-between gap-3 border-b border-outline-gray-1 px-3.5 py-4"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-3">
                <Avatar
                  size="sm"
                  :image="target.avatarUrl"
                  :label="target.employeeName"
                />
                <DialogTitle class="truncate text-lg-medium text-ink-gray-8">
                  {{ target.employeeName }}
                </DialogTitle>
                <span class="shrink-0 text-base text-ink-gray-5">
                  {{ week.dateRange }}
                </span>
              </div>
              <p
                v-if="target.projectName"
                class="truncate pl-9 text-base text-ink-gray-5"
              >
                {{ target.projectName }}
              </p>
            </div>
            <DialogDescription class="sr-only">
              Approve or reject this week's time entries
            </DialogDescription>
            <div class="flex shrink-0 items-center gap-3">
              <span class="text-lg-medium tabular-nums text-ink-green-8">
                {{ floatToTime(week.totalHours) }}
              </span>
              <DialogClose as-child>
                <Button variant="ghost" icon="lucide-x" label="Close" />
              </DialogClose>
            </div>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto">
            <div v-if="weeklyRejectionReason" class="space-y-1 p-4 text-base">
              <p class="font-medium text-ink-red-8">Weekly Rejection Reason:</p>
              <p class="whitespace-pre-line text-ink-red-5">
                {{ weeklyRejectionReason }}
              </p>
            </div>
            <section
              v-for="day in days"
              :key="day.date"
              class="border-b border-outline-gray-1 last:border-b-0"
            >
              <div
                class="flex items-center justify-between gap-2 bg-surface-gray-2 px-3.5 py-3"
              >
                <button
                  type="button"
                  class="flex items-center gap-2 rounded-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3"
                  :aria-expanded="!collapsedDays.has(day.date)"
                  @click="toggleDay(day.date)"
                >
                  <span
                    class="lucide-chevron-down size-4 text-ink-gray-5 transition-transform"
                    :class="collapsedDays.has(day.date) && '-rotate-90'"
                    aria-hidden="true"
                  />
                  <span class="text-base-medium text-ink-gray-8">
                    {{ day.label
                    }}<span v-if="day.leaveLabel" class="text-ink-gray-5">
                      · {{ day.leaveLabel }}</span
                    >
                  </span>
                </button>
                <div class="flex items-center gap-3">
                  <span class="text-lg-medium tabular-nums text-ink-green-8">
                    {{ floatToTime(day.totalHours) }}
                  </span>
                  <Tooltip
                    :text="DECIDED_DAY_TOOLTIP"
                    :disabled="!day.isDecided"
                  >
                    <div class="flex items-center">
                      <Checkbox
                        :model-value="checkedDays.has(day.date)"
                        :disabled="isReadOnly || day.isDecided"
                        :aria-label="`Select ${day.label}`"
                        @update:model-value="
                          setChecked(day.date, Boolean($event))
                        "
                      />
                    </div>
                  </Tooltip>
                </div>
              </div>
              <div v-if="!collapsedDays.has(day.date)">
                <ApprovalEntryRow
                  v-for="entry in day.entries"
                  :key="entry.name"
                  :entry="entry"
                  :read-only="isReadOnly || day.isDecided"
                  :max-duration="week.dailyHours"
                  @save="saveEntry(entry, $event)"
                />
              </div>
            </section>
          </div>

          <div
            class="flex items-center justify-between gap-2 border-t border-outline-gray-1 p-3.5"
          >
            <Button
              theme="red"
              variant="solid"
              label="Reject"
              icon-left="lucide-circle-x"
              :disabled="blocked || decideCall.loading"
              @click="startRejection"
            />
            <Button
              theme="green"
              variant="solid"
              label="Approve"
              icon-left="lucide-circle-check"
              :loading="decideCall.loading"
              :disabled="blocked || decideCall.loading"
              @click="approve"
            />
          </div>
        </DialogContent>
      </Transition>
    </DialogPortal>
  </DialogRoot>

  <Dialog
    :open="open && view === 'rejection'"
    size="md"
    title="Reason for timesheet rejection"
    :dismissible="!decideCall.loading"
    @update:open="open = $event"
  >
    <div class="space-y-4">
      <div
        class="flex items-center justify-between gap-2 rounded-5 bg-surface-gray-2 p-2 text-base-medium"
      >
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <Avatar
              size="xs"
              :image="target.avatarUrl"
              :label="target.employeeName"
            />
            <span class="truncate text-ink-gray-7">
              {{ target.employeeName }}
            </span>
            <span class="shrink-0 text-ink-gray-5">
              · {{ week.dateRange }}
            </span>
          </div>
          <span
            v-if="target.projectName"
            class="block truncate pl-6 text-ink-gray-5"
          >
            {{ target.projectName }}
          </span>
        </div>
        <span class="shrink-0 text-ink-red-8">
          {{ floatToTime(week.totalHours) }}
        </span>
      </div>
      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- frappe-ui's Textarea renders a <label> from `label` -->
      <Textarea
        v-model="reason"
        label="Reason"
        required
        variant="outline"
        placeholder="Enter reason for rejection"
        :rows="4"
        :error="reasonError"
      />
    </div>

    <template #actions>
      <div class="space-y-1.5">
        <ErrorMessage v-if="rejectionError" :message="rejectionError" />
        <Button
          class="w-full"
          variant="solid"
          label="Reject timesheet"
          :loading="decideCall.loading"
          :disabled="decideCall.loading"
          @click="reject"
        />
      </div>
    </template>
  </Dialog>
</template>

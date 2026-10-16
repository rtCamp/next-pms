<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  reactive,
  ref,
  shallowRef,
  watch,
} from "vue";
import { Alert, Badge, Button, toast, useCall } from "frappe-ui";
import {
  ApprovalStatus,
  type ApprovalStatusValue,
} from "@/components/ApprovalStatus";
import { RichText } from "@/components/RichText";
import type { TaskRowTimeEntry, TimeEntry } from "@/components/Timesheet";
import { useUnsavedChangesSource } from "@/composables/useUnsavedChanges";
import { errorMessage } from "@/utils/errors";
import { floatToTime } from "@/utils/format";
import { stripTags } from "@/utils/text";
import { FALLBACK_DAILY_WORKING_HOURS } from "./constants";
import TimeEntryForm, { type TimeEntryFormErrors } from "./TimeEntryForm.vue";

const props = withDefaults(
  defineProps<{
    /** The day, `YYYY-MM-DD`. */
    date: string;
    /** Employee the time is logged for. */
    employee: string;
    /** Task ID the time is logged against. */
    taskKey: string;
    /** The task's entries on the day. */
    entries: TimeEntry[];
    /** The day's cell, for its non-billable mark. */
    cell: TaskRowTimeEntry;
    /** Shows the entries read-only, without the form. */
    disabled?: boolean;
    dailyWorkingHours?: number;
    /** Hours already logged on the day across every task. */
    totalUsedHoursInDay?: number;
  }>(),
  {
    disabled: false,
    dailyWorkingHours: FALLBACK_DAILY_WORKING_HOURS,
    totalUsedHoursInDay: 0,
  },
);

const emit = defineEmits<{
  /** The popover may close: the first entry was added or the last one deleted. */
  close: [];
  /** Whether the user is editing, which keeps the popover open. */
  engaged: [engaged: boolean];
}>();

type Mode = "default" | "add" | "edit";

interface FormValues {
  duration: number;
  comment: string;
  date: string;
}

const saveCall = useCall<unknown, Record<string, unknown>>({
  url: "/api/v2/method/next_pms.timesheet.api.timesheet.save",
  method: "POST",
  immediate: false,
});
const updateCall = useCall<unknown, Record<string, unknown>>({
  url: "/api/v2/method/next_pms.timesheet.api.timesheet.bulk_update_timesheet_detail",
  method: "POST",
  immediate: false,
});
const deleteCall = useCall<unknown, Record<string, unknown>>({
  url: "/api/v2/method/next_pms.timesheet.api.timesheet.delete",
  method: "POST",
  immediate: false,
});

const isSaving = computed(() => saveCall.loading || updateCall.loading);
const isMutating = computed(() => isSaving.value || deleteCall.loading);

const mode = ref<Mode>("default");
const selectedEntry = shallowRef<TimeEntry | null>(null);
const addDraft = ref<{ duration: number; comment: string } | null>(null);
const editBaseline = ref<FormValues | null>(null);
const collapsedEntryNames = ref<string[]>([]);
let interactiveModeInitialized = false;
const stayEngaged = ref(false);
const resizeActive = ref(false);
const submitError = ref<string | null>(null);
const errors = reactive<TimeEntryFormErrors>({});
let proceedAfterSave: (() => void) | null = null;

const hoursLeft = computed(
  () => props.dailyWorkingHours - props.totalUsedHoursInDay,
);
const effectiveHoursLeft = computed(() =>
  mode.value === "edit" && selectedEntry.value
    ? hoursLeft.value + selectedEntry.value.hours
    : hoursLeft.value,
);
const defaultDuration = computed(() => (hoursLeft.value >= 0.5 ? 0.5 : 0));

const form = reactive<FormValues>({
  duration: defaultDuration.value,
  comment: "",
  date: props.date,
});

function resetForm() {
  form.duration = defaultDuration.value;
  form.comment = "";
  form.date = props.date;
  for (const key of Object.keys(errors)) {
    delete errors[key as keyof TimeEntryFormErrors];
  }
}

// A field's error goes once the user changes it.
for (const key of ["duration", "comment", "date"] as const) {
  watch(
    () => form[key],
    () => delete errors[key],
  );
}

const hasUnsavedChanges = computed(() => {
  const baseline = editBaseline.value;
  if (mode.value === "edit" && baseline) {
    return (
      form.duration !== baseline.duration ||
      form.comment !== baseline.comment ||
      form.date !== baseline.date
    );
  }
  return form.duration !== defaultDuration.value || form.comment !== "";
});

const addUnchanged = computed(
  () => form.duration === defaultDuration.value && form.comment === "",
);
const editUnchanged = computed(() => {
  const baseline = editBaseline.value;
  return (
    baseline !== null &&
    form.duration === baseline.duration &&
    form.comment === baseline.comment &&
    form.date === baseline.date
  );
});

const baseEngaged = computed(
  () =>
    mode.value !== "default" || hasUnsavedChanges.value || resizeActive.value,
);
watch(baseEngaged, (engaged) => {
  if (engaged) stayEngaged.value = true;
});
const isEngaged = computed(() => baseEngaged.value || stayEngaged.value);
// Synchronous, so the popover is pinned before the pointer's leave closes it.
watch(isEngaged, (engaged) => emit("engaged", engaged), { flush: "sync" });

// While this popover's own request is in flight the list stays as it was: the realtime
// update lands before the response and would make the list jump.
const frozenEntries = shallowRef(props.entries);
watch(
  () => [props.entries, isMutating.value] as const,
  ([entries, mutating]) => {
    if (!mutating) frozenEntries.value = entries;
  },
);
const displayEntries = computed(() =>
  isMutating.value ? frozenEntries.value : props.entries,
);
const hasNoEntries = computed(() => displayEntries.value.length === 0);

function resetAfterRequest() {
  resetForm();
  editBaseline.value = null;
  selectedEntry.value = null;
  addDraft.value = null;
  mode.value = "default";
}

/** Messages from the React form's schema. */
function validate(): boolean {
  if (!(form.duration > 0)) errors.duration = "Select Duration";
  if (!form.date.trim()) errors.date = "Select Date";
  if (!stripTags(form.comment).trim()) {
    errors.comment = "Please enter a comment.";
  }
  return Object.keys(errors).length === 0;
}

async function submit() {
  submitError.value = null;
  if (!validate()) return;
  const startMode = mode.value;
  const entry = selectedEntry.value;
  try {
    if (startMode === "edit" && entry) {
      await updateCall.submit({
        data: [
          {
            name: entry.name,
            parent: entry.parent,
            task: props.taskKey,
            date: form.date,
            description: form.comment,
            hours: form.duration,
            is_billable: entry.is_billable,
          },
        ],
      });
      toast.success("Time Entry updated successfully");
    } else if (props.employee && props.date) {
      await saveCall.submit({
        date: form.date,
        description: form.comment,
        task: props.taskKey,
        hours: form.duration,
        employee: props.employee,
      });
      toast.success("Time Entry submitted successfully");
    }
    if (props.entries.length === 0 && startMode === "default") emit("close");
    proceedAfterSave?.();
  } catch (error) {
    submitError.value = errorMessage(error);
  } finally {
    proceedAfterSave = null;
    resetAfterRequest();
  }
}

function discardChanges() {
  resetAfterRequest();
  stayEngaged.value = false;
}

useUnsavedChangesSource({
  hasUnsavedChanges: () => hasUnsavedChanges.value,
  saveChanges: (onSaved) => {
    proceedAfterSave = onSaved ?? null;
    submit();
  },
  discardChanges,
});

async function deleteEntry() {
  const entry = selectedEntry.value;
  if (!entry) return;
  try {
    await deleteCall.submit({ parent: entry.parent, name: entry.name });
    toast.success("Time Entry deleted successfully");
    // Deleting the last entry leaves nothing to show.
    if (props.entries.length <= 1) emit("close");
  } catch (error) {
    toast.error(errorMessage(error));
  } finally {
    resetAfterRequest();
  }
}

function initInteractiveMode() {
  if (interactiveModeInitialized) return;
  collapsedEntryNames.value = props.entries.map((entry) => entry.name);
  interactiveModeInitialized = true;
}

function editEntry(entry: TimeEntry) {
  submitError.value = null;
  if (mode.value === "add") {
    addDraft.value = addUnchanged.value
      ? null
      : { duration: form.duration, comment: form.comment };
  }
  initInteractiveMode();
  selectedEntry.value = entry;
  mode.value = "edit";
  editBaseline.value = {
    duration: entry.hours,
    comment: entry.description ?? "",
    date: props.date,
  };
  collapsedEntryNames.value = collapsedEntryNames.value.filter(
    (name) => name !== entry.name,
  );
  form.duration = entry.hours;
  form.comment = entry.description ?? "";
  form.date = props.date;
}

function toggleAddMode() {
  submitError.value = null;
  if (mode.value === "add") {
    submit();
    return;
  }
  selectedEntry.value = null;
  mode.value = "add";
  editBaseline.value = null;
  initInteractiveMode();
  if (addDraft.value) {
    form.duration = addDraft.value.duration;
    form.comment = addDraft.value.comment;
    addDraft.value = null;
    return;
  }
  form.duration = defaultDuration.value;
  form.comment = "";
}

function toggleExpanded(name: string) {
  collapsedEntryNames.value = collapsedEntryNames.value.includes(name)
    ? collapsedEntryNames.value.filter((entryName) => entryName !== name)
    : [...collapsedEntryNames.value, name];
}

// Dragging the comment's resize handle out of the popover must not close it.
const RESIZE_HANDLE_SIZE = 20;
const RESIZE_END_EVENTS = [
  "pointerup",
  "pointercancel",
  "mouseup",
  "touchend",
  "contextmenu",
  "blur",
];

function stopResize() {
  resizeActive.value = false;
}

watch(resizeActive, (active, _, onCleanup) => {
  if (!active) return;
  for (const event of RESIZE_END_EVENTS) {
    window.addEventListener(event, stopResize);
  }
  onCleanup(() => {
    for (const event of RESIZE_END_EVENTS) {
      window.removeEventListener(event, stopResize);
    }
  });
});

function onCommentPointerdown(event: PointerEvent) {
  if (event.button !== 0) return;
  const editor = (event.target as Element | null)?.closest(".ProseMirror");
  if (!(editor instanceof HTMLElement)) return;
  const rect = editor.getBoundingClientRect();
  if (
    event.clientX >= rect.right - RESIZE_HANDLE_SIZE &&
    event.clientY >= rect.bottom - RESIZE_HANDLE_SIZE
  ) {
    resizeActive.value = true;
  }
}

onBeforeUnmount(stopResize);

function toEntryView(entry: TimeEntry) {
  const rejected = Boolean(entry.rejected_hours);
  // A parent marked Rejected says nothing about a row logged after that rejection.
  const status: ApprovalStatusValue | undefined = rejected
    ? "Rejected"
    : entry.custom_approval_status === "Rejected"
      ? "Not Submitted"
      : (entry.custom_approval_status ?? undefined);
  const hours = rejected ? entry.rejected_hours : entry.hours;
  const editing =
    mode.value === "edit" && selectedEntry.value?.name === entry.name;
  return {
    entry,
    rejected,
    status,
    time: hours ? floatToTime(hours) : "00:00",
    editing,
    expanded: editing || !collapsedEntryNames.value.includes(entry.name),
    editable:
      !props.disabled &&
      entry.custom_approval_status !== "Approved" &&
      !rejected,
  };
}

const entryViews = computed(() => displayEntries.value.map(toEntryView));
</script>

<template>
  <div
    v-if="!(disabled && entries.length === 0)"
    class="flex max-h-[min(500px,90dvh)] w-fit min-w-68 max-w-[min(720px,90vw)] flex-col gap-2 overflow-auto p-2"
  >
    <div
      v-for="({ entry, ...view }, index) in entryViews"
      :key="entry.name"
      class="group relative w-full min-w-0 border-outline-gray-2"
      :class="!(disabled && index === entryViews.length - 1) && 'border-b pb-2'"
    >
      <template v-if="!view.editing">
        <button
          type="button"
          class="w-full gap-2 rounded-2 text-left focus:outline-none focus-visible:ring focus-visible:ring-outline-gray-3"
          :class="
            view.expanded
              ? 'flex flex-col items-start'
              : 'grid grid-cols-[auto_minmax(0,1fr)] items-center'
          "
          :aria-expanded="view.expanded"
          @click="toggleExpanded(entry.name)"
        >
          <Badge
            variant="subtle"
            size="md"
            class="lining-nums tabular-nums text-ink-gray-8"
          >
            <template v-if="cell.nonBillable" #prefix>
              <span
                class="block size-1 rounded-full bg-surface-amber-3"
                role="img"
                aria-label="Non-billable"
              />
            </template>
            {{ view.time }}
            <template v-if="view.status" #suffix>
              <ApprovalStatus :status="view.status" class="m-1 w-3" />
            </template>
          </Badge>
          <span
            v-if="!view.expanded"
            class="block min-w-0 max-w-full truncate pr-4 text-sm text-ink-gray-6"
          >
            {{ entry.description ? stripTags(entry.description) : "" }}
          </span>
        </button>
        <Button
          v-if="view.editable"
          class="pointer-events-none absolute right-0 top-0 size-5 opacity-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100"
          variant="ghost"
          icon="lucide-pencil"
          aria-label="Edit entry"
          @click.stop="editEntry(entry)"
        />
      </template>
      <div v-if="view.expanded" class="w-full pt-2">
        <TimeEntryForm
          v-if="!disabled && view.editing"
          v-model:duration="form.duration"
          v-model:comment="form.comment"
          v-model:date="form.date"
          mode="edit"
          :hours-left="effectiveHoursLeft"
          duration-label="Edit time"
          :max-duration="dailyWorkingHours"
          :saving="isSaving"
          :mutating="isMutating"
          :unchanged="editUnchanged"
          :errors="errors"
          :submit-error="submitError"
          @save="submit"
          @comment-pointerdown="onCommentPointerdown"
        >
          <Button
            variant="subtle"
            theme="red"
            size="sm"
            label="Delete entry"
            icon-left="lucide-trash-2"
            :loading="deleteCall.loading"
            :disabled="isSaving"
            @click="deleteEntry"
          />
        </TimeEntryForm>
        <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -- watches for the editor's resize handle -->
        <div
          v-else
          class="w-full min-w-0"
          @pointerdown.capture="onCommentPointerdown"
        >
          <RichText
            :content="entry.description"
            class="prose-sm box-border max-h-40 w-full min-w-64 max-w-[min(680px,calc(90vw-2rem))] resize overflow-auto text-base text-ink-gray-7"
          />
          <Alert
            v-if="view.rejected && entry.custom_rejection_reason"
            class="mt-2"
            title="Rejection reason"
            :description="entry.custom_rejection_reason"
            theme="red"
            :icon="false"
          />
        </div>
      </div>
    </div>

    <div v-if="!disabled" class="flex w-full flex-col gap-2">
      <TimeEntryForm
        v-if="hasNoEntries || mode === 'add'"
        v-model:duration="form.duration"
        v-model:comment="form.comment"
        v-model:date="form.date"
        mode="add"
        :hours-left="effectiveHoursLeft"
        :duration-label="hasNoEntries ? undefined : 'Add time'"
        :max-duration="dailyWorkingHours"
        :saving="isSaving"
        :mutating="isMutating"
        :unchanged="addUnchanged"
        :errors="errors"
        :submit-error="submitError"
        @save="submit"
        @comment-pointerdown="onCommentPointerdown"
      />
      <div v-else class="flex w-full justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          :label="mode === 'edit' && addDraft ? 'Draft' : 'Add time'"
          :icon-left="
            mode === 'edit' && addDraft ? 'lucide-square-pen' : 'lucide-plus'
          "
          :disabled="isMutating"
          @click="toggleAddMode"
        />
      </div>
    </div>
  </div>
</template>

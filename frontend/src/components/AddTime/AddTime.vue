<script setup lang="ts">
import { computed, reactive, ref, useTemplateRef, watch } from "vue";
import {
  Button,
  Combobox,
  DatePicker,
  dayjs,
  Dialog,
  ErrorMessage,
  FormLabel,
} from "frappe-ui";
import { Editor, EditorContent } from "frappe-ui/editor";
import { DurationInput } from "@/components/DurationInput";
import { TaskStatus, type TaskStatusValue } from "@/components/TaskStatus";
import { TIME_ENTRY_COMMENT_KIT } from "@/components/Timesheet";
import { useEditorAttributes } from "@/composables/useEditorAttributes";
import { errorMessage } from "@/utils/errors";
import CalendarEvents from "./CalendarEvents.vue";
import { addListItem, IdentifiedListItem, removeListItem } from "./commentList";
import type {
  AddTimeEntry,
  AddTimeProps,
  SelectedCalendarEvent,
  TaskLookupOption,
} from "./types";
import { entryFromPrefill, validateEntry, type AddTimeErrors } from "./utils";

const props = withDefaults(defineProps<AddTimeProps>(), {
  pickEmployee: false,
  prefill: () => ({}),
  employeeOptions: () => [],
  employeesLoading: false,
  projectOptions: () => [],
  projectsLoading: false,
  taskOptions: () => [],
  tasksLoading: false,
  maxDuration: 8,
  hoursLeft: 8,
  hoursLoading: false,
  calendarSetup: false,
  calendarEvents: () => [],
  calendarLoading: false,
  calendarError: false,
});

const open = defineModel<boolean>("open", { required: true });
/** The entry as filled in; the dialog resets it from `prefill` on open. */
const entry = defineModel<AddTimeEntry>("entry", {
  default: () => entryFromPrefill({}),
});
const employeeQuery = defineModel<string>("employeeQuery", { default: "" });
const projectQuery = defineModel<string>("projectQuery", { default: "" });
const taskQuery = defineModel<string>("taskQuery", { default: "" });
/** Whether "Add calendar events" is ticked, which loads the events. */
const showCalendarEvents = defineModel<boolean>("showCalendarEvents", {
  default: false,
});

const errors = reactive<AddTimeErrors>({});
const submitError = ref("");
const saving = ref<"addAnother" | "close" | null>(null);
// Remounts the comment editor and the event list for a fresh entry.
const entryKey = ref(0);
let selectedEventIds = new Set<string>();

const extensions = [TIME_ENTRY_COMMENT_KIT, IdentifiedListItem];

const editorRef = useTemplateRef("editor");
useEditorAttributes(editorRef, () => ({
  role: "textbox",
  "aria-multiline": "true",
  "aria-label": "Comment",
}));

function update(patch: Partial<AddTimeEntry>) {
  entry.value = { ...entry.value, ...patch };
  for (const key of Object.keys(patch)) {
    delete errors[key as keyof AddTimeErrors];
  }
}

function clearErrors() {
  for (const key of Object.keys(errors)) {
    delete errors[key as keyof AddTimeErrors];
  }
  submitError.value = "";
}

function resetEntry(patch: Partial<AddTimeEntry> = {}) {
  entry.value = { ...entryFromPrefill(props.prefill), ...patch };
  employeeQuery.value = "";
  projectQuery.value = "";
  taskQuery.value = "";
  selectedEventIds = new Set();
  clearErrors();
  entryKey.value += 1;
}

watch(
  [open, () => props.prefill],
  ([isOpen]) => {
    if (isOpen) resetEntry();
    else showCalendarEvents.value = false;
  },
  { immediate: true },
);

const employee = computed({
  get: () => entry.value.employeeId || null,
  set: (value: string | number | null) => {
    const employeeId = value ? String(value) : "";
    update({
      employeeId,
      employeeLabel:
        props.employeeOptions.find((option) => option.value === employeeId)
          ?.label ?? employeeId,
    });
  },
});

const project = computed({
  get: () => entry.value.project || null,
  set: (value: string | number | null) => {
    const projectId = value ? String(value) : "";
    const patch: Partial<AddTimeEntry> = {
      project: projectId,
      projectLabel:
        props.projectOptions.find((option) => option.value === projectId)
          ?.label ?? projectId,
    };
    if (projectId !== entry.value.project) {
      Object.assign(patch, { task: "", taskLabel: "", taskStatus: "" });
      taskQuery.value = "";
    }
    update(patch);
  },
});

const task = computed({
  get: () => entry.value.task || null,
  set: (value: string | number | null) => {
    const taskId = value ? String(value) : "";
    const option = props.taskOptions.find((item) => item.value === taskId);
    const patch: Partial<AddTimeEntry> = {
      task: taskId,
      taskLabel: option?.label ?? taskId,
      taskStatus: option?.status ?? "",
    };
    if (option?.projectId) {
      Object.assign(patch, {
        project: option.projectId,
        projectLabel: option.projectName || option.projectId,
      });
    }
    update(patch);
  },
});

const date = computed({
  get: () => entry.value.date,
  set: (value: string) => update({ date: value ?? "" }),
});
const duration = computed({
  get: () => entry.value.duration,
  set: (value: number) => update({ duration: value }),
});
const comment = computed({
  get: () => entry.value.comment,
  set: (value: string) => update({ comment: value }),
});

const projectOptionsWithIcon = computed(() =>
  props.projectOptions.map((option) => ({ ...option, icon: "lucide-folder" })),
);

function taskStatusOf(option: unknown): TaskStatusValue {
  return ((option as TaskLookupOption).status ?? "Open") as TaskStatusValue;
}

function onCalendarSelection(
  items: SelectedCalendarEvent[],
  totalHours: number,
) {
  const editor = editorRef.value?.editor;
  const nextIds = new Set(items.map((item) => item.id));
  if (editor) {
    for (const item of items) {
      if (!selectedEventIds.has(item.id)) {
        addListItem(editor, item.id, item.label);
      }
    }
    for (const id of selectedEventIds) {
      if (!nextIds.has(id)) removeListItem(editor, id);
    }
  }
  selectedEventIds = nextIds;
  update({ duration: totalHours });
}

async function submit(keepOpen: boolean) {
  if (saving.value) return;
  clearErrors();
  Object.assign(errors, validateEntry(entry.value, props.pickEmployee));
  if (Object.keys(errors).length > 0) return;
  saving.value = keepOpen ? "addAnother" : "close";
  try {
    await props.save({ ...entry.value }, keepOpen);
  } catch (error) {
    submitError.value = errorMessage(error);
    return;
  } finally {
    saving.value = null;
  }
  if (keepOpen) {
    showCalendarEvents.value = false;
    resetEntry({
      date: entry.value.date,
      employeeId: entry.value.employeeId,
      employeeLabel: entry.value.employeeLabel,
    });
  } else {
    open.value = false;
  }
}

function shortcutDate(daysAgo: number) {
  return dayjs().subtract(daysAgo, "day").format("YYYY-MM-DD");
}
</script>

<template>
  <!-- React's dialog sat 120px from the top; frappe-ui adds a 32px margin above the
       panel, hence 88. -->
  <Dialog
    v-model:open="open"
    title="Add time"
    position="top"
    :padding-top="88"
    :dismissible="!saving"
  >
    <form class="space-y-4" novalidate @submit.prevent="submit(false)">
      <Combobox
        v-if="pickEmployee"
        v-model="employee"
        v-model:query="employeeQuery"
        label="Employee"
        required
        :error="errors.employeeId"
        size="md"
        variant="outline"
        :options="employeeOptions"
        :loading="employeesLoading"
        :filterable="false"
        open-on-focus
        placeholder="Select employee"
      />
      <Combobox
        v-model="project"
        v-model:query="projectQuery"
        label="Project"
        required
        :error="errors.project"
        size="md"
        variant="outline"
        :options="projectOptionsWithIcon"
        :loading="projectsLoading"
        :filterable="false"
        open-on-focus
        placeholder="Select project"
      />
      <Combobox
        v-model="task"
        v-model:query="taskQuery"
        label="Task"
        required
        :error="errors.task"
        size="md"
        variant="outline"
        :options="taskOptions"
        :loading="tasksLoading"
        :filterable="false"
        open-on-focus
        placeholder="Select task"
      >
        <template #item-prefix="{ item }">
          <TaskStatus :status="taskStatusOf(item)" />
        </template>
      </Combobox>
      <div class="flex gap-4">
        <div class="flex flex-1 flex-col gap-1.5">
          <DatePicker
            v-model="date"
            label="Date"
            required
            :error="errors.date"
            variant="outline"
            format="MMM D, YYYY"
            placeholder="Today"
            :typeable="false"
          >
            <template #suffix>
              <span
                class="lucide-calendar size-4 shrink-0"
                aria-hidden="true"
              />
            </template>
            <template #actions="{ setDate, clear }">
              <Button
                variant="outline"
                label="Yesterday"
                @click="setDate(shortcutDate(1))"
              />
              <Button
                variant="outline"
                label="Today"
                @click="setDate(shortcutDate(0))"
              />
              <Button variant="outline" label="Clear" @click="clear()" />
            </template>
          </DatePicker>
        </div>
        <div class="flex flex-1 flex-col sm:w-48 sm:flex-none">
          <DurationInput
            v-model="duration"
            label="Duration"
            required
            size="md"
            snap="smooth"
            :max-duration="maxDuration"
            :hours-left="hoursLeft"
            :loading="hoursLoading"
            :disabled="hoursLoading"
            :error="errors.duration"
          />
        </div>
      </div>

      <CalendarEvents
        v-if="!pickEmployee"
        :key="`calendar-events-${entryKey}`"
        v-model:show="showCalendarEvents"
        :setup="calendarSetup"
        :events="calendarEvents"
        :loading="calendarLoading"
        :error="calendarError"
        @selection-change="onCalendarSelection"
      />

      <div class="space-y-1.5">
        <FormLabel label="Comment" required />
        <Editor
          ref="editor"
          :key="`comment-${entryKey}`"
          v-model="comment"
          :extensions="extensions"
          :editable="!saving"
        >
          <EditorContent
            class="prose-sm h-24 w-full max-w-full overflow-auto rounded-5 border border-outline-gray-2 bg-surface-base px-2 text-base text-ink-gray-7 prose-p:my-1 focus:outline-none"
          />
        </Editor>
        <ErrorMessage v-if="errors.comment" :message="errors.comment" />
      </div>
      <ErrorMessage v-if="submitError" :message="submitError" />
    </form>

    <template #actions>
      <div class="flex w-full items-center justify-between gap-2">
        <Button
          class="flex-1"
          variant="subtle"
          label="Save and add another"
          :loading="saving === 'addAnother'"
          :disabled="saving !== null"
          @click="submit(true)"
        />
        <Button
          class="flex-1"
          variant="solid"
          label="Save and close"
          :loading="saving === 'close'"
          :disabled="saving !== null"
          @click="submit(false)"
        />
      </div>
    </template>
  </Dialog>
</template>

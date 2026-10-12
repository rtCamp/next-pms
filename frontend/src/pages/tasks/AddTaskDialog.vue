<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  Button,
  Combobox,
  DatePicker,
  Dialog,
  ErrorMessage,
  FormLabel,
  Select,
  TextInput,
  toast,
  useCall,
  useDoctype,
} from "frappe-ui";
import { CommentKit, Editor, EditorContent } from "frappe-ui/editor";
import { useProjectLookup } from "@/composables/useProjectLookup";
import { errorMessage } from "@/utils/errors";
import { stripTags } from "@/utils/text";
import { TASK_PRIORITIES, TASK_PRIORITY_OPTIONS } from "./constants";
import type { TaskListItem, TaskPriority } from "./types";

const props = defineProps<{
  /** The task to edit; without one the dialog adds a task. */
  task?: TaskListItem | null;
}>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ saved: [] }>();

interface TaskForm {
  subject: string;
  project: string;
  projectLabel: string;
  expected_time: string;
  priority: TaskPriority | "";
  exp_end_date: string;
  description: string;
}
type FormErrors = Partial<Record<keyof TaskForm, string>>;

const form = reactive<TaskForm>(emptyForm());
const errors = reactive<FormErrors>({});
const submitError = ref("");
const submitting = ref(false);
const isEdit = computed(() => Boolean(props.task));

// The React editor was the bare starter kit: no media, mentions, tags or emoji.
const extensions = [
  CommentKit.configure({
    mention: false,
    tag: false,
    emoji: false,
    image: false,
    imageGroup: false,
    imageViewer: false,
    video: false,
    attachment: false,
  }),
];

function emptyForm(): TaskForm {
  return {
    subject: "",
    project: "",
    projectLabel: "",
    expected_time: "",
    priority: "Low",
    exp_end_date: "",
    description: "",
  };
}

function formFor(task: TaskListItem): TaskForm {
  return {
    subject: task.subject,
    project: task.project,
    projectLabel: task.project_name ?? task.project,
    expected_time: String(task.expected_time ?? ""),
    priority: TASK_PRIORITIES.includes(task.priority as TaskPriority)
      ? (task.priority as TaskPriority)
      : "",
    exp_end_date: task.exp_end_date ?? "",
    description: task.description ?? "",
  };
}

watch(open, (isOpen) => {
  if (!isOpen) return;
  Object.assign(form, props.task ? formFor(props.task) : emptyForm());
  for (const key of Object.keys(errors)) delete errors[key as keyof TaskForm];
  submitError.value = "";
  projectQuery.value = "";
});

// A field's error goes away once the user changes it; the rest stay until the
// next submit, as in the React form.
for (const key of Object.keys(emptyForm()) as (keyof TaskForm)[]) {
  watch(
    () => form[key],
    () => delete errors[key],
  );
}

const projectQuery = ref("");
const projectLookup = useProjectLookup({
  enabled: open,
  // In input mode the combobox puts the selected label in the query; not a search.
  query: () =>
    projectQuery.value === form.projectLabel ? "" : projectQuery.value,
  selected: () =>
    form.project
      ? { label: form.projectLabel || form.project, value: form.project }
      : null,
});

const project = computed({
  get: () => form.project || null,
  set: (value: string | number | null) => {
    form.project = value ? String(value) : "";
    form.projectLabel =
      projectLookup.options.find((option) => option.value === form.project)
        ?.label ?? form.project;
  },
});

/** Messages copied from the React form's schema. */
function validate(): boolean {
  if (!form.project.trim()) errors.project = "Please select a project.";
  if (!form.subject.trim()) errors.subject = "Please add a subject.";
  const hours = form.expected_time.trim();
  if (!hours || !Number.isFinite(Number(hours))) {
    errors.expected_time = "Please enter a valid time in hours.";
  }
  // React counted the editor's HTML, so an empty "<p></p>" passed; count the text.
  if (!isEdit.value && stripTags(form.description).length < 4) {
    errors.description = "Please enter valid description.";
  }
  return Object.keys(errors).length === 0;
}

const addTask = useCall<string, Record<string, string>>({
  url: "/api/v2/method/next_pms.timesheet.api.task.add_task",
  method: "POST",
  immediate: false,
});
const tasks = useDoctype<TaskListItem>("Task");

async function submit() {
  submitError.value = "";
  if (!validate()) return;
  const values = {
    subject: form.subject.trim(),
    project: form.project.trim(),
    expected_time: form.expected_time.trim(),
    priority: form.priority,
    exp_end_date: form.exp_end_date,
    description: form.description.trim(),
  };
  submitting.value = true;
  try {
    if (props.task) {
      await tasks.setValue.submit({
        name: props.task.name,
        ...values,
        expected_time: Number(values.expected_time),
      });
    } else {
      await addTask.submit(values);
      if (addTask.error) throw addTask.error;
    }
  } catch (error) {
    submitError.value = errorMessage(error);
    return;
  } finally {
    submitting.value = false;
  }
  toast.success(
    isEdit.value ? "Task updated successfully" : "Task created successfully",
  );
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
    :title="isEdit ? 'Edit Task' : 'Add Task'"
    position="top"
    :padding-top="88"
    :dismissible="!submitting"
  >
    <form class="space-y-4" novalidate @submit.prevent="submit">
      <Combobox
        v-model="project"
        v-model:query="projectQuery"
        label="Project"
        required
        :error="errors.project"
        size="md"
        variant="outline"
        :options="projectLookup.options"
        :loading="projectLookup.loading"
        :filterable="false"
        placeholder="Select project"
      />
      <TextInput
        v-model="form.subject"
        label="Subject"
        required
        :error="errors.subject"
        size="md"
        variant="outline"
        placeholder="Add subject"
      />
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Select
          v-model="form.priority"
          label="Priority"
          size="md"
          variant="outline"
          :options="TASK_PRIORITY_OPTIONS"
          placeholder="Priority"
        />
        <TextInput
          v-model="form.expected_time"
          label="Expected Time"
          required
          :error="errors.expected_time"
          type="number"
          size="md"
          variant="outline"
          placeholder="Hours"
        />
        <DatePicker
          v-model="form.exp_end_date"
          label="Due Date"
          variant="outline"
          placeholder="Due Date"
        >
          <template #suffix>
            <span class="lucide-calendar size-4 shrink-0" aria-hidden="true" />
          </template>
        </DatePicker>
      </div>
      <div class="space-y-1.5">
        <FormLabel label="Description" :required="!isEdit" />
        <Editor
          v-model="form.description"
          :extensions="extensions"
          placeholder="Add description"
          :editable="!submitting"
        >
          <EditorContent
            role="textbox"
            aria-multiline="true"
            aria-label="Description"
            class="prose-sm h-24 w-full max-w-full overflow-auto rounded-md border border-outline-gray-2 bg-surface-white px-2 text-base text-ink-gray-7 prose-p:my-1 focus:outline-none"
          />
        </Editor>
        <ErrorMessage v-if="errors.description" :message="errors.description" />
      </div>
      <ErrorMessage v-if="submitError" :message="submitError" />
    </form>

    <template #actions>
      <div class="flex w-full items-center justify-end gap-2">
        <Button variant="ghost" label="Cancel" @click="close" />
        <Button
          variant="solid"
          :label="isEdit ? 'Save' : 'Add Task'"
          :loading="submitting"
          :disabled="submitting"
          @click="submit"
        />
      </div>
    </template>
  </Dialog>
</template>

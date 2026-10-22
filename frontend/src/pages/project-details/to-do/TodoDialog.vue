<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  Avatar,
  Button,
  Combobox,
  DateTimePicker,
  Dialog,
  ErrorMessage,
  Select,
  TextInput,
} from "frappe-ui";
import type { LookupOption } from "@/composables/useRemoteLookup";
import { useUserLookup } from "@/composables/useUserLookup";
import RichTextEditor from "@/pages/project-details/RichTextEditor.vue";
import { useSession } from "@/session";
import { systemToLocalDateTime } from "@/utils/date";
import {
  PRIORITY_DOT,
  STATUS_COLOR,
  STATUS_ICON,
  TODO_PRIORITIES,
  TODO_STATUSES,
} from "./constants";
import { emptyTodoForm, todoToForm, validateTodo } from "./todos";
import type { TodoErrors, TodoForm, TodoPriority, TodoStatus } from "./types";
import { useTodos } from "./useTodos";

const DATE_TIME_FORMAT = "YYYY-MM-DD h:mm a";

const todos = useTodos();
const session = useSession();
const { customFields, editing, editorOpen: open, saving } = todos;

const form = reactive<TodoForm>(emptyTodoForm(session.userId));
const errors = reactive<TodoErrors>({});
const assigneeQuery = ref("");
const assigneeOption = ref<LookupOption | null>(null);

watch(open, (isOpen) => {
  if (!isOpen) return;
  const todo = editing.value;
  Object.assign(form, todo ? todoToForm(todo) : emptyTodoForm(session.userId));
  assigneeOption.value = todo
    ? {
        label: todo.assigneeName,
        value: todo.allocated_to,
        image: todo.assigneeImage ?? undefined,
      }
    : {
        label: session.userName || session.userId,
        value: session.userId,
        image: session.userImage || undefined,
      };
  for (const key of Object.keys(errors)) delete errors[key as keyof TodoForm];
  assigneeQuery.value = "";
});

for (const key of Object.keys(form) as (keyof TodoForm)[]) {
  watch(
    () => form[key],
    () => delete errors[key],
  );
}

const lookup = useUserLookup({
  enabled: open,
  // In input mode the combobox puts the selected label in the query; not a search.
  query: () =>
    assigneeQuery.value === assigneeOption.value?.label
      ? ""
      : assigneeQuery.value,
  selected: assigneeOption,
});

const assignee = computed({
  get: () => form.assignee || null,
  set: (value) => {
    form.assignee = value ? String(value) : "";
    assigneeOption.value =
      lookup.options.find((option) => option.value === form.assignee) ?? null;
  },
});

const statusOptions = TODO_STATUSES.map((status) => ({
  label: status,
  value: status,
}));
const priorityOptions = TODO_PRIORITIES.map((priority) => ({
  label: priority,
  value: priority,
}));

const status = computed({
  get: () => form.status,
  set: (value) => {
    if (value) form.status = value as TodoStatus;
  },
});
const priority = computed({
  get: () => form.priority,
  set: (value) => {
    if (value) form.priority = value as TodoPriority;
  },
});

// frappe-ui's DateTimePicker converts local to system time when it emits, but reads
// its value as local time, so the value going in is converted here.
const startAt = computed({
  get: () => systemToLocalDateTime(form.startAt),
  set: (value: string) => (form.startAt = value),
});
const endAt = computed({
  get: () => systemToLocalDateTime(form.endAt),
  set: (value: string) => (form.endAt = value),
});

const isEdit = computed(() => editing.value !== null);

function personOf(option: unknown) {
  return option as { label: string; image?: string };
}

function statusOf(option: unknown) {
  return (option as { value: TodoStatus }).value;
}

async function submit() {
  Object.assign(errors, validateTodo(form, customFields));
  if (Object.keys(errors).length) return;
  if (await todos.save({ ...form })) open.value = false;
}
</script>

<template>
  <Dialog
    v-model:open="open"
    :title="isEdit ? 'Edit ToDo' : 'Add ToDo'"
    size="lg"
    :dismissible="!saving"
  >
    <form class="-mt-2 space-y-4" novalidate @submit.prevent="submit">
      <TextInput
        v-if="customFields"
        v-model="form.title"
        label="Title"
        required
        :error="errors.title"
        size="md"
        variant="outline"
        placeholder="Add a title"
      />
      <div class="flex flex-col gap-1.5">
        <span class="text-base text-ink-gray-5">Description</span>
        <RichTextEditor
          v-model="form.description"
          label="Description"
          placeholder="Add a description..."
          content-class="h-40 overflow-auto text-ink-gray-8"
          :disabled="saving"
        />
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Select
          v-model="status"
          class="w-fit"
          size="sm"
          variant="subtle"
          :options="statusOptions"
          aria-label="Status"
        >
          <template #prefix>
            <span
              class="size-3.5"
              :class="[STATUS_ICON[form.status], STATUS_COLOR[form.status]]"
              aria-hidden="true"
            />
          </template>
          <template #item-prefix="{ item }">
            <span
              class="size-3.5"
              :class="[
                STATUS_ICON[statusOf(item)],
                STATUS_COLOR[statusOf(item)],
              ]"
              aria-hidden="true"
            />
          </template>
        </Select>
        <Combobox
          v-model="assignee"
          v-model:query="assigneeQuery"
          class="w-56"
          size="md"
          variant="subtle"
          :options="lookup.options"
          :loading="lookup.loading"
          :filterable="false"
          :error="errors.assignee"
          open-on-focus
          placeholder="Assignee"
          aria-label="Assignee"
        >
          <template #item-prefix="{ item }">
            <Avatar
              size="xs"
              shape="circle"
              :image="personOf(item).image"
              :label="personOf(item).label"
            />
          </template>
        </Combobox>
        <template v-if="customFields">
          <div class="flex flex-col gap-1">
            <DateTimePicker v-model="startAt" :format="DATE_TIME_FORMAT">
              <template #trigger="{ displayLabel, open: pickerOpen, setOpen }">
                <Button
                  variant="subtle"
                  size="md"
                  icon-right="lucide-calendar"
                  :aria-label="
                    displayLabel ? `Start: ${displayLabel}` : 'Start'
                  "
                  @click="setOpen(!pickerOpen)"
                >
                  <span class="truncate text-sm text-ink-gray-7">
                    {{ displayLabel || "Start" }}
                  </span>
                </Button>
              </template>
            </DateTimePicker>
            <ErrorMessage v-if="errors.startAt" :message="errors.startAt" />
          </div>
          <div class="flex flex-col gap-1">
            <DateTimePicker v-model="endAt" :format="DATE_TIME_FORMAT">
              <template #trigger="{ displayLabel, open: pickerOpen, setOpen }">
                <Button
                  variant="subtle"
                  size="md"
                  icon-right="lucide-calendar"
                  :aria-label="displayLabel ? `End: ${displayLabel}` : 'End'"
                  @click="setOpen(!pickerOpen)"
                >
                  <span class="truncate text-sm text-ink-gray-7">
                    {{ displayLabel || "End" }}
                  </span>
                </Button>
              </template>
            </DateTimePicker>
            <ErrorMessage v-if="errors.endAt" :message="errors.endAt" />
          </div>
        </template>
        <Select
          v-model="priority"
          class="w-fit"
          size="sm"
          variant="subtle"
          :options="priorityOptions"
          aria-label="Priority"
        >
          <template #prefix>
            <span
              class="inline-block size-2 rounded-full"
              :class="PRIORITY_DOT[form.priority]"
              aria-hidden="true"
            />
          </template>
        </Select>
      </div>
    </form>

    <template #actions>
      <Button
        class="w-full"
        variant="solid"
        :label="isEdit ? 'Save' : 'Create'"
        :loading="saving"
        :disabled="saving"
        @click="submit"
      />
    </template>
  </Dialog>
</template>

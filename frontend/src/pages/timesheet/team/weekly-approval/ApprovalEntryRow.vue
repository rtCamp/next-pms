<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { Alert, Button, ErrorMessage } from "frappe-ui";
import { Editor, EditorContent } from "frappe-ui/editor";
import { ApprovalStatus } from "@/components/ApprovalStatus";
import { DurationInput } from "@/components/DurationInput";
import { RichText } from "@/components/RichText";
import { TaskStatus } from "@/components/TaskStatus";
import { TIME_ENTRY_COMMENT_KIT } from "@/components/Timesheet";
import { useEditorAttributes } from "@/composables/useEditorAttributes";
import { floatToTime } from "@/utils/format";
import { stripTags } from "@/utils/text";
import type { ApprovalEntry } from "./types";

const props = withDefaults(
  defineProps<{
    entry: ApprovalEntry;
    readOnly?: boolean;
    /** The employee's daily hours, the duration slider's maximum. */
    maxDuration?: number;
  }>(),
  { readOnly: false, maxDuration: undefined },
);

const emit = defineEmits<{
  save: [values: { hours: number; description: string }];
}>();

const extensions = [TIME_ENTRY_COMMENT_KIT];

const isRejected = computed(() => props.entry.rejectedHours > 0);
const locked = computed(
  () => props.readOnly || props.entry.docstatus === 1 || isRejected.value,
);

const editing = ref(false);
const hours = ref(props.entry.hours);
const description = ref(props.entry.description);
const descriptionError = ref("");

const editorRef = useTemplateRef("editor");
useEditorAttributes(editorRef, () => ({
  role: "textbox",
  "aria-multiline": "true",
  "aria-label": "Comment",
}));

function edit() {
  if (locked.value) return;
  hours.value = props.entry.hours;
  description.value = props.entry.description;
  descriptionError.value = "";
  editing.value = true;
}

function cancel() {
  descriptionError.value = "";
  editing.value = false;
}

function save() {
  if (!stripTags(description.value).trim()) {
    descriptionError.value = "Please enter a comment.";
    return;
  }
  emit("save", { hours: hours.value, description: description.value });
  editing.value = false;
}

watch(description, () => (descriptionError.value = ""));
</script>

<template>
  <div
    class="group flex gap-3 border-b border-outline-gray-1 px-3.5 py-4 last:border-b-0"
  >
    <TaskStatus :status="entry.taskStatus" />
    <div class="min-w-0 flex-1 space-y-1">
      <div class="flex gap-1.5">
        <p class="truncate text-base-medium text-ink-gray-7">
          {{ entry.taskName }}
        </p>
        <ApprovalStatus
          v-if="entry.approvalStatus"
          :status="entry.approvalStatus"
        />
      </div>
      <p class="truncate text-xs text-ink-gray-5">{{ entry.projectName }}</p>
      <div v-if="editing && !locked" class="mt-3 flex flex-col gap-2">
        <DurationInput
          v-model="hours"
          snap="smooth"
          variant="outline"
          inline-label="Duration"
          :max-duration="maxDuration"
          allow-overflow
        />
        <Editor
          ref="editor"
          v-model="description"
          :extensions="extensions"
          placeholder="Comment"
        >
          <EditorContent
            class="prose-sm h-24 overflow-auto rounded-5 border border-outline-gray-2 bg-surface-base px-2 text-base text-ink-gray-7 prose-p:my-1 focus:outline-none"
          />
        </Editor>
        <ErrorMessage v-if="descriptionError" :message="descriptionError" />
      </div>
      <template v-else>
        <RichText
          class="prose-sm mt-3 text-ink-gray-7"
          :content="entry.description"
        />
        <Alert
          v-if="entry.rejectionReason"
          title="Rejection reason"
          :description="entry.rejectionReason"
          theme="red"
          :icon="false"
        />
      </template>
    </div>
    <div v-if="editing && !locked" class="flex flex-col gap-2">
      <Button variant="ghost" aria-label="Save entry" @click="save">
        <template #icon>
          <span class="lucide-check size-4 text-ink-green-8" />
        </template>
      </Button>
      <Button variant="ghost" aria-label="Cancel edit" @click="cancel">
        <template #icon>
          <span class="lucide-x size-4 text-ink-gray-5" />
        </template>
      </Button>
    </div>
    <template v-else>
      <span
        class="relative size-fit text-base tabular-nums"
        :class="isRejected ? 'text-ink-red-8' : 'text-ink-gray-6'"
      >
        {{ floatToTime(isRejected ? entry.rejectedHours : entry.hours) }}
        <span
          v-if="!entry.isBillable"
          class="absolute -bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-surface-amber-3"
          role="img"
          aria-label="Non-billable"
        />
      </span>
      <Button
        class="opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
        :class="locked && 'invisible'"
        variant="ghost"
        aria-label="Edit time entry"
        :disabled="locked"
        @click="edit"
      >
        <template #icon>
          <span class="lucide-pencil size-4 text-ink-gray-7" />
        </template>
      </Button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useTemplateRef } from "vue";
import { Avatar, Badge, dayjs } from "frappe-ui";
import { CommentKit, Editor, EditorContent } from "frappe-ui/editor";
import { useEditorAttributes } from "@/composables/useEditorAttributes";
import { floatToTime } from "@/utils/format";
import type { TaskLogEntry } from "./types";

defineProps<{ entry: TaskLogEntry; showAvatar: boolean }>();

const readOnlyExtensions = [CommentKit];
useEditorAttributes(useTemplateRef("description"), () => ({
  role: "presentation",
}));
</script>

<template>
  <li
    class="border-b border-outline-elevation-2 pb-1 text-ink-gray-6 last:border-none"
  >
    <div class="mb-1 flex items-center justify-between">
      <!-- In the default slot: Badge's prefix box is 10px, too small for the avatar. -->
      <Badge variant="subtle" size="md">
        <Avatar
          v-if="showAvatar"
          size="xs"
          :label="entry.employee.employeeName"
          :image="entry.employee.image ?? undefined"
        />
        {{ floatToTime(entry.hours) }}
      </Badge>
      <time :datetime="entry.date" class="text-base">
        {{ dayjs(entry.date).format("MMM DD") }}
      </time>
    </div>
    <Editor
      ref="description"
      :model-value="entry.description"
      :extensions="readOnlyExtensions"
      :editable="false"
    >
      <!-- eslint-disable better-tailwindcss/no-restricted-classes -- Tailwind 3 has no scrollbar-width utility; no scale step for 21px -->
      <EditorContent
        class="prose-sm max-h-30 overflow-auto [scrollbar-width:thin] text-base leading-[21px] text-ink-gray-7 prose-p:my-2"
      />
      <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
    </Editor>
  </li>
</template>

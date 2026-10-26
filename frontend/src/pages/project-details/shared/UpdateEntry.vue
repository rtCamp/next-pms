<script setup lang="ts">
import { computed } from "vue";
import { Avatar, Button, Dropdown } from "frappe-ui";
import { RichText } from "@/components/RichText";
import { formatRelativeTimeShort } from "@/utils/text";
import type { Person } from "./types";

const props = defineProps<{
  author: Person;
  /** When the update was posted; a datetime. */
  updatedAt?: string;
  /** HTML. */
  note?: string | null;
  /** Shows the update's Edit and Delete actions. */
  canManage: boolean;
}>();

const emit = defineEmits<{ edit: []; delete: [] }>();

defineSlots<{
  /** The update's values (status, level, …) as pills. */
  badges?: () => unknown;
}>();

const postedAt = computed(() =>
  props.updatedAt ? formatRelativeTimeShort(props.updatedAt) : "",
);

const actions = [
  { label: "Edit", onClick: () => emit("edit") },
  {
    label: "Delete",
    theme: "red" as const,
    onClick: () => emit("delete"),
  },
];
</script>

<template>
  <article class="group/update">
    <div class="mb-2 mt-1 flex flex-wrap items-center gap-2">
      <Avatar
        size="sm"
        shape="circle"
        :image="author.image"
        :label="author.label"
      />
      <span class="text-base-medium text-ink-gray-7">{{ author.label }}</span>
      <span class="text-base text-ink-gray-6">posted an update.</span>
      <time
        v-if="updatedAt"
        class="ml-auto text-base text-ink-gray-5"
        :datetime="updatedAt"
      >
        {{ postedAt }}
      </time>
    </div>
    <div
      class="ml-2 border-l border-outline-gray-1 pb-4 pl-4 group-last/update:border-transparent"
    >
      <div class="rounded-4 border border-outline-gray-1 p-4">
        <div
          v-if="$slots.badges || canManage"
          class="flex flex-wrap items-center gap-1 text-sm text-ink-gray-7"
          :class="note && 'mb-2'"
        >
          <slot name="badges" />
          <Dropdown v-if="canManage" :options="actions" align="end">
            <Button
              class="ml-auto"
              variant="ghost"
              icon="lucide-ellipsis"
              label="Update actions"
            />
          </Dropdown>
        </div>
        <RichText
          v-if="note"
          :content="note"
          kit="richText"
          class="prose-sm max-w-none text-ink-gray-7"
        />
      </div>
    </div>
  </article>
</template>

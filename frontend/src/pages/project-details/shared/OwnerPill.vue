<script setup lang="ts">
import { Avatar } from "frappe-ui";
import type { Person } from "./types";

defineProps<{
  person: Person | null;
  /** The person's role on the record, e.g. "Risk owner"; also the pill's title. */
  title: string;
}>();
</script>

<template>
  <div
    v-if="person"
    class="flex items-center gap-1 whitespace-nowrap rounded-full bg-surface-gray-2 px-2 py-1"
    :title="title"
  >
    <Avatar
      size="xs"
      shape="circle"
      :image="person.image"
      :label="person.label"
    />
    <span>{{ person.label }}</span>
    <span class="text-ink-gray-5">- {{ title }}</span>
  </div>
</template>

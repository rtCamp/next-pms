<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { Avatar, Tooltip } from "frappe-ui";
import type { ProjectPerson } from "../types";

defineProps<{ person: ProjectPerson | null }>();

const label = useTemplateRef("label");
const truncated = ref(false);

function measure() {
  const element = label.value;
  truncated.value = Boolean(
    element && element.scrollWidth > element.clientWidth,
  );
}
</script>

<template>
  <span v-if="!person" class="block truncate text-base text-ink-gray-6">
    N/A
  </span>
  <Tooltip v-else-if="person.user" :text="person.user">
    <a
      :href="`/desk/user/${encodeURIComponent(person.user)}`"
      class="flex w-fit min-w-0 items-center gap-2 rounded-4"
    >
      <Avatar
        v-if="person.image"
        size="md"
        shape="circle"
        :image="person.image"
        :label="person.full_name"
      />
      <span class="truncate text-base text-ink-gray-6">{{
        person.full_name
      }}</span>
    </a>
  </Tooltip>
  <Tooltip v-else :text="person.full_name" :disabled="!truncated">
    <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions, vuejs-accessibility/mouse-events-have-key-events -- hover only measures for the tooltip -->
    <div class="flex w-fit min-w-0 items-center gap-2" @mouseenter="measure">
      <Avatar
        v-if="person.image"
        size="md"
        shape="circle"
        :image="person.image"
        :label="person.full_name"
      />
      <span ref="label" class="truncate text-base text-ink-gray-6">{{
        person.full_name
      }}</span>
    </div>
  </Tooltip>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Avatar } from "frappe-ui";
import { WATCHER_STACK_SIZE } from "./constants";
import type { UserRef } from "./types";

const props = defineProps<{ users: UserRef[] }>();

const visible = computed(() => props.users.slice(0, WATCHER_STACK_SIZE));
const overflow = computed(() => props.users.length - WATCHER_STACK_SIZE);
</script>

<template>
  <div class="flex items-center -space-x-1">
    <div
      v-for="(user, index) in visible"
      :key="user.userId"
      class="rounded-full ring-1 ring-outline-base"
      :title="user.fullName"
      :style="{ zIndex: visible.length - index }"
    >
      <Avatar
        size="xs"
        shape="circle"
        :label="user.fullName"
        :image="user.image"
      />
    </div>
    <!-- eslint-disable better-tailwindcss/no-restricted-classes -- React's 8px count in a 16px circle; no text step that small -->
    <div
      v-if="overflow > 0"
      class="flex size-4 items-center justify-center rounded-full bg-surface-gray-2 text-[8px] font-medium text-ink-gray-5 ring-1 ring-outline-base"
      :aria-label="`${overflow} more`"
    >
      <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
      +{{ overflow }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Avatar } from "frappe-ui";
import { FOLLOWERS_SHOWN } from "./constants";
import type { Person } from "./types";

const props = defineProps<{ followers: Person[] }>();

const shown = computed(() => props.followers.slice(0, FOLLOWERS_SHOWN));
const count = computed(() => props.followers.length);
</script>

<template>
  <div
    v-if="count"
    class="flex items-center gap-1 rounded-full bg-surface-gray-2 px-2 py-1 text-sm text-ink-gray-7"
  >
    <div class="flex items-center" aria-hidden="true">
      <div
        v-for="(follower, index) in shown"
        :key="follower.userId"
        class="-mr-1 rounded-full ring-1 ring-outline-gray-2 last:mr-0"
        :style="{ zIndex: FOLLOWERS_SHOWN - index }"
      >
        <Avatar
          size="xs"
          shape="circle"
          :image="follower.image"
          :label="follower.label"
        />
      </div>
    </div>
    <span class="pl-1">
      {{ count }} {{ count === 1 ? "watcher" : "watchers" }}
    </span>
  </div>
</template>

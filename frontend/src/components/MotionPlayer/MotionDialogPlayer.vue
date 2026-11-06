<script setup lang="ts">
import { ref } from "vue";
import { Dialog } from "frappe-ui";
import MotionPlayer from "./MotionPlayer.vue";
import type { MotionDialogPlayerProps } from "./types";

defineOptions({ inheritAttrs: false });
defineProps<MotionDialogPlayerProps>();

const expanded = ref(false);
</script>

<template>
  <MotionPlayer
    v-bind="$attrs"
    :load="motion"
    :label="title"
    :paused="expanded"
    expandable
    @expand="expanded = true"
  />
  <!-- Mounted only while open: a Dialog stacked over another modal (the Help panel) stays aria-hidden otherwise. -->
  <Dialog v-if="expanded" v-model:open="expanded" :title="title" size="7xl">
    <!-- eslint-disable-next-line better-tailwindcss/no-restricted-classes -- keeps the 16:9 player within the viewport's height, as React did -->
    <div class="mx-auto w-full max-w-[calc((100dvh-10rem)*16/9)]">
      <MotionPlayer
        :load="motion"
        :label="title"
        collapsible
        @collapse="expanded = false"
      />
    </div>
  </Dialog>
</template>

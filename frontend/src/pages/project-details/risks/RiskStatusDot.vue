<script setup lang="ts">
import { computed } from "vue";
import { STATUS_DOT_CLASS } from "./constants";

const props = defineProps<{ status: string }>();

const dotClass = computed(() => STATUS_DOT_CLASS[props.status] ?? "");
</script>

<template>
  <span
    class="relative size-3.5 shrink-0 rounded-full"
    :class="dotClass"
    aria-hidden="true"
  >
    <span
      class="absolute inset-0 m-auto size-1.5 rounded-full bg-surface-base"
    />
  </span>
</template>

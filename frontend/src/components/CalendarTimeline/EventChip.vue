<script setup lang="ts">
import { computed } from "vue";
import { Tooltip } from "frappe-ui";
import { EVENT_CHIP_CLASSES } from "./constants";
import type { EventChipProps } from "./types";

const props = withDefaults(defineProps<EventChipProps>(), { color: "blue" });

const classes = computed(() => EVENT_CHIP_CLASSES[props.color]);
const text = computed(() =>
  props.subtitle ? `${props.title} - ${props.subtitle}` : props.title,
);
</script>

<template>
  <Tooltip :text="text">
    <div
      tabindex="0"
      class="flex w-full cursor-pointer flex-col gap-0.5 rounded-5 py-0.5 pl-1 pr-2 text-left focus-visible:outline-none focus-visible:focus-ring"
      :class="classes.chip"
    >
      <p class="w-full truncate text-xs leading-tighter" :class="classes.title">
        {{ title }}
      </p>
      <p
        v-if="subtitle"
        class="w-full truncate text-2xs leading-tighter"
        :class="classes.subtitle"
      >
        {{ subtitle }}
      </p>
    </div>
  </Tooltip>
</template>

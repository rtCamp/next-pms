<script setup lang="ts">
import { computed } from "vue";
import {
  DONUT_SIZE,
  donutArcs,
  EMPTY_DONUT_PATH,
  type UtilisationSegment,
} from "./utilisation";

const props = defineProps<{ segments: UtilisationSegment[] }>();

const arcs = computed(() => donutArcs(props.segments));
</script>

<template>
  <svg
    :width="DONUT_SIZE"
    :height="DONUT_SIZE"
    :viewBox="`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`"
    class="shrink-0"
    role="img"
    :aria-label="
      segments.map((segment) => `${segment.label} ${segment.value}%`).join(', ')
    "
  >
    <path
      v-if="!arcs.length"
      :d="EMPTY_DONUT_PATH"
      fill-rule="evenodd"
      class="fill-surface-gray-3"
    />
    <path
      v-for="arc in arcs"
      v-else
      :key="arc.key"
      :d="arc.d"
      :class="arc.fillClass"
    />
  </svg>
</template>

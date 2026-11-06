<script setup lang="ts">
import { computed } from "vue";
import { PhaseIcon } from "@/components/PhaseIcon";
import { useProjectPhases } from "@/composables/useProjectPhases";

const props = defineProps<{ phase: string | null }>();

const phases = useProjectPhases();
const record = computed(() => phases.phaseOf(props.phase));
</script>

<template>
  <div
    v-if="record"
    class="flex min-w-0 items-center gap-2 text-base text-ink-gray-6"
  >
    <PhaseIcon :color="record.color" />
    <span class="truncate">{{ record.phase }}</span>
  </div>
  <span v-else class="block truncate text-base text-ink-gray-6">N/A</span>
</template>

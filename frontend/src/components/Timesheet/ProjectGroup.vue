<script setup lang="ts">
import { computed, ref } from "vue";
import { floatToTime } from "@/utils/format";
import ProjectRow from "./ProjectRow.vue";
import type { ProjectGroupProps } from "./types";
import { computeProjectCells } from "./utils";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<ProjectGroupProps>(), {
  hideTime: false,
  disabled: false,
  lockApproved: true,
  backdateRestrictedBefore: null,
  highlightTimeEntries: false,
  defaultCollapsed: false,
});

const emit = defineEmits<{
  /** A day's add-time button was pressed. */
  cellClick: [date: string];
}>();

defineSlots<{
  /** Icon before the label; defaults to a folder. */
  prefix?: () => unknown;
  /** The project's task or member rows, shown while expanded. */
  default?: () => unknown;
}>();

const collapsed = ref(props.defaultCollapsed);

const project = computed(() =>
  props.hideTime
    ? { total: 0, cells: [] }
    : computeProjectCells({
        dates: props.dates,
        tasks: props.tasks,
        disabled: props.disabled,
        lockApproved: props.lockApproved,
        backdateRestrictedBefore: props.backdateRestrictedBefore,
      }),
);
</script>

<template>
  <ProjectRow
    v-bind="$attrs"
    v-model:collapsed="collapsed"
    :label="label"
    :time-entries="project.cells"
    :total-hours="hideTime ? '' : floatToTime(project.total)"
    total-hours-theme="green"
    :highlight-time-entries="highlightTimeEntries"
    @cell-click="(_, date) => emit('cellClick', date ?? '')"
  >
    <template v-if="$slots.prefix" #prefix><slot name="prefix" /></template>
  </ProjectRow>
  <template v-if="!collapsed">
    <slot />
  </template>
</template>

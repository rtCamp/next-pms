<script setup lang="ts">
import { computed } from "vue";
import { Avatar, Badge } from "frappe-ui";
import { CELL_HEIGHT, COLLAPSE_DURATION_MS } from "./constants";
import GanttAddRow from "./GanttAddRow.vue";
import GanttAllocationBar from "./GanttAllocationBar.vue";
import GanttChildRow from "./GanttChildRow.vue";
import GanttRowHeader from "./GanttRowHeader.vue";
import GanttRowOverlay from "./GanttRowOverlay.vue";
import GanttSummaryBar from "./GanttSummaryBar.vue";
import type { EmployeeRow } from "./rows";
import { useCollapsiblePresence } from "./useCollapsiblePresence";
import { useGanttGrid } from "./useGanttGrid";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  row: EmployeeRow;
  index: number;
}>();

const grid = useGanttGrid();
const expanded = computed(() => grid.isExpanded(props.row.key));
const canManage = computed(() => grid.hasRoleAccess.value);
const canExpand = computed(
  () => props.row.projects.length > 0 || canManage.value,
);
const children = useCollapsiblePresence(
  () => expanded.value,
  COLLAPSE_DURATION_MS,
);

function addProject() {
  grid.emit("add", {
    employeeId: props.row.id,
    employeeName: props.row.name,
  });
}
</script>

<template>
  <tr class="touch-pan-y">
    <GanttRowHeader
      :label="row.name"
      top-level
      :expanded="expanded"
      :can-expand="canExpand"
      @toggle="grid.toggleRow(row.key)"
    >
      <template #icon>
        <Avatar size="xs" shape="circle" :image="row.image" :label="row.name" />
      </template>
      <template v-if="row.badge" #badge>
        <Badge :label="row.badge" size="sm" variant="subtle" theme="gray" />
      </template>
      <template v-if="row.designation" #subtitle>
        {{ row.designation }}
      </template>
    </GanttRowHeader>
    <td
      v-for="(week, weekIndex) in grid.timeline.value.weeks"
      :key="weekIndex"
      :colspan="week.days.length"
      class="border-r border-outline-gray-1"
      :class="grid.isNextExpanded(index) && 'border-b'"
      :style="{ height: `${CELL_HEIGHT}px` }"
    />
    <GanttRowOverlay>
      <GanttSummaryBar
        v-for="bar in [...row.freeBars, ...row.summaryBars]"
        :key="`${bar.type}-${bar.startDate.getTime()}`"
        :bar="bar"
        :row="row"
      />
    </GanttRowOverlay>
  </tr>

  <template v-if="children.rendered.value">
    <GanttChildRow
      v-for="(project, projectIndex) in row.projects"
      :key="project.id ?? project.name"
      :visible="children.visible.value"
      :bottom-border="projectIndex === row.projects.length - 1 && !canManage"
      @transitionend="children.onTransitionEnd"
    >
      <template #header="{ height }">
        <GanttRowHeader
          :label="project.name"
          :height="height"
          :collapsed="!children.visible.value"
        >
          <template #icon>
            <span class="lucide-folder size-4 shrink-0" aria-hidden="true" />
          </template>
          <template v-if="project.badge" #badge>
            <Badge
              :label="project.badge"
              size="sm"
              variant="subtle"
              theme="gray"
            />
          </template>
          <template v-if="project.dateRange || project.customer" #subtitle>
            {{
              [project.dateRange, project.customer].filter(Boolean).join(" · ")
            }}
          </template>
        </GanttRowHeader>
      </template>
      <GanttAllocationBar
        v-for="(bar, barIndex) in project.allocations"
        :key="`${bar.id ?? barIndex}-${bar.startDate.getTime()}`"
        :bar="bar"
      />
    </GanttChildRow>
    <GanttAddRow
      v-if="canManage"
      label="Add project"
      :visible="children.visible.value"
      @add="addProject"
      @transitionend="children.onTransitionEnd"
    />
  </template>
</template>

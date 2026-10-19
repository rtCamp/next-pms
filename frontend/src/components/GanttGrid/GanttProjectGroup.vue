<script setup lang="ts">
import { computed } from "vue";
import { Avatar, Badge } from "frappe-ui";
import { CELL_HEIGHT, COLLAPSE_DURATION_MS } from "./constants";
import GanttAddRow from "./GanttAddRow.vue";
import GanttChildRow from "./GanttChildRow.vue";
import GanttRowHeader from "./GanttRowHeader.vue";
import GanttRowOverlay from "./GanttRowOverlay.vue";
import type { ProjectRow } from "./rows";
import { useCollapsiblePresence } from "./useCollapsiblePresence";
import { useGanttGrid } from "./useGanttGrid";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  row: ProjectRow;
  index: number;
}>();

const grid = useGanttGrid();
const expanded = computed(() => grid.isExpanded(props.row.key));
const canManage = computed(() => grid.hasRoleAccess.value);
const canExpand = computed(
  () => props.row.employees.length > 0 || canManage.value,
);
const subtitle = computed(() =>
  [props.row.dateRange, props.row.customer].filter(Boolean).join(" · "),
);
const children = useCollapsiblePresence(
  () => expanded.value,
  COLLAPSE_DURATION_MS,
);

function addEmployee() {
  grid.emit("add", {
    projectId: props.row.id,
    projectName: props.row.name,
    customerName: props.row.customer,
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
        <span class="lucide-folder size-4 shrink-0" aria-hidden="true" />
      </template>
      <template v-if="row.badge" #badge>
        <Badge :label="row.badge" size="sm" variant="subtle" theme="gray" />
      </template>
      <template v-if="subtitle" #subtitle>{{ subtitle }}</template>
    </GanttRowHeader>
    <td
      v-for="(week, weekIndex) in grid.timeline.value.weeks"
      :key="weekIndex"
      :colspan="week.days.length"
      class="border-r border-outline-gray-1"
      :class="grid.isNextExpanded(index) && 'border-b'"
      :style="{ height: `${CELL_HEIGHT}px` }"
    />
    <GanttRowOverlay />
  </tr>

  <template v-if="children.rendered.value">
    <GanttChildRow
      v-for="(employee, employeeIndex) in row.employees"
      :key="employee.id ?? employee.name"
      :visible="children.visible.value"
      :bottom-border="employeeIndex === row.employees.length - 1 && !canManage"
      @transitionend="children.onTransitionEnd"
    >
      <template #header="{ height }">
        <GanttRowHeader
          :label="employee.name"
          :height="height"
          :collapsed="!children.visible.value"
        >
          <template #icon>
            <Avatar
              size="xs"
              shape="circle"
              :image="employee.image"
              :label="employee.name"
            />
          </template>
          <template v-if="employee.badge" #badge>
            <Badge
              :label="employee.badge"
              size="sm"
              variant="subtle"
              theme="gray"
            />
          </template>
          <template v-if="employee.designation" #subtitle>
            {{ employee.designation }}
          </template>
        </GanttRowHeader>
      </template>
    </GanttChildRow>
    <GanttAddRow
      v-if="canManage"
      label="Add member"
      :visible="children.visible.value"
      @add="addEmployee"
      @transitionend="children.onTransitionEnd"
    />
  </template>
</template>

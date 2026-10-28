<script setup lang="ts">
import { computed } from "vue";
import { Avatar, Badge } from "frappe-ui";
import { CELL_HEIGHT, COLLAPSE_DURATION_MS } from "./constants";
import GanttAddRow from "./GanttAddRow.vue";
import GanttAllocationBar from "./GanttAllocationBar.vue";
import GanttChildRow from "./GanttChildRow.vue";
import GanttEmployeeCard from "./GanttEmployeeCard.vue";
import GanttProjectCard from "./GanttProjectCard.vue";
import GanttRowHeader from "./GanttRowHeader.vue";
import GanttProjectSummaryBar from "./GanttProjectSummaryBar.vue";
import GanttRowDraft from "./GanttRowDraft.vue";
import GanttRowOverlay from "./GanttRowOverlay.vue";
import GanttTimeoffBar from "./GanttTimeoffBar.vue";
import type { ProjectRow } from "./rows";
import { useCollapsiblePresence } from "./useCollapsiblePresence";
import { useGanttGrid } from "./useGanttGrid";
import { useRowDraft } from "./useRowDraft";

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

const draft = useRowDraft({
  enabled: () => canManage.value,
  occupied: () => props.row.summaryBars,
  target: () => ({
    projectId: props.row.id,
    projectName: props.row.name,
    customerName: props.row.customer,
  }),
});

function addEmployee() {
  grid.emit("add", {
    projectId: props.row.id,
    projectName: props.row.name,
    customerName: props.row.customer,
  });
}
</script>

<template>
  <tr
    class="touch-pan-y"
    @pointermove="draft.onPointerMove"
    @pointerdown="draft.onPointerDown"
    @pointerleave="draft.onPointerLeave"
  >
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
      <template #card>
        <GanttProjectCard
          :project="row"
          :can-open="canManage"
          :remaining-hours-tooltip="grid.remainingHoursTooltip.value"
        />
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
      <GanttProjectSummaryBar
        v-for="bar in row.summaryBars"
        :key="bar.startDate.getTime()"
        :bar="bar"
        :row="row"
      />
      <GanttRowDraft :draft="draft" />
    </GanttRowOverlay>
  </tr>

  <template v-if="children.rendered.value">
    <GanttChildRow
      v-for="(employee, employeeIndex) in row.employees"
      :key="employee.id ?? employee.name"
      :visible="children.visible.value"
      :bottom-border="employeeIndex === row.employees.length - 1 && !canManage"
      :occupied="[...employee.allocations, ...employee.leaveBars]"
      :target="{
        employeeId: employee.id,
        employeeName: employee.name,
        projectId: row.id,
        projectName: row.name,
        customerName: row.customer,
      }"
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
          <template #card>
            <GanttEmployeeCard
              :employee="employee"
              :can-open="canManage"
              :rate-tooltip="grid.rateTooltip.value"
              :capacity-tooltip="grid.capacityTooltip.value"
            />
          </template>
        </GanttRowHeader>
      </template>
      <GanttAllocationBar
        v-for="(bar, barIndex) in employee.allocations"
        :key="`${bar.id ?? barIndex}-${bar.startDate.getTime()}`"
        :bar="bar"
        :row-bars="employee.allocations"
        :employee-name="employee.name"
        :employee-image="employee.image"
      />
      <GanttTimeoffBar
        v-for="bar in employee.leaveBars"
        :key="`leave-${bar.startDate.getTime()}`"
        :start-date="bar.startDate"
        :end-date="bar.endDate"
        :timeoff="bar.timeoff"
        :holiday="bar.label"
        :left="bar.barOffset + grid.headerWidth.value"
        :width="bar.width"
      />
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

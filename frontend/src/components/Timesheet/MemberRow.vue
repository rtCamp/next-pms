<script setup lang="ts">
import { computed } from "vue";
import { Avatar, Badge } from "frappe-ui";
import RowToggle from "./RowToggle.vue";
import StatusActionButton from "./StatusActionButton.vue";
import TimeCell from "./TimeCell.vue";
import {
  ACTION_CELL_CLASS,
  APPROVAL_STATUS_BADGE,
  BUTTON_CELL_CLASS,
  CELL_CLASS,
  MEMBER_SOLID_ACTION_ICON,
  ROW_CLASS,
  toApprovalStatus,
  totalHoursClass,
} from "./constants";
import type { MemberRowProps } from "./types";

const props = withDefaults(defineProps<MemberRowProps>(), {
  totalHours: "",
  hideAction: false,
});

const collapsed = defineModel<boolean>("collapsed", { default: false });

const emit = defineEmits<{
  /** The member's status button was pressed. */
  action: [];
  /** A day's add-time button was pressed; `date` is the cell's `date`. */
  cellClick: [dayIndex: number, date: string | undefined];
}>();

const shownStatus = computed(() => toApprovalStatus(props.status));
</script>

<template>
  <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -- a pointer shortcut; the chevron button is the keyboard control -->
  <div :class="[ROW_CLASS, 'cursor-pointer']" @click="collapsed = !collapsed">
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <RowToggle :label="`Toggle ${label}`" :collapsed="collapsed" />
      <div class="flex min-w-0 max-w-75 items-center gap-2 sm:max-w-112">
        <Avatar :image="avatarUrl" :label="label" shape="circle" size="xs" />
        <span class="truncate text-base-medium text-ink-gray-8">
          {{ label }}
        </span>
        <Badge
          v-if="shownStatus"
          class="shrink-0"
          :theme="APPROVAL_STATUS_BADGE[shownStatus].theme"
          :label="APPROVAL_STATUS_BADGE[shownStatus].label"
        />
      </div>
    </div>

    <div
      v-for="(entry, index) in timeEntries"
      :key="index"
      :class="BUTTON_CELL_CLASS"
    >
      <TimeCell
        :time="entry.time"
        :disabled="entry.disabled"
        :class="
          shownStatus
            ? 'text-base-medium text-ink-gray-8'
            : 'text-base text-ink-gray-6'
        "
        @click.stop="emit('cellClick', index, entry.date)"
      />
    </div>

    <div :class="CELL_CLASS">
      <span :class="totalHoursClass({ theme: totalHoursTheme })">
        {{ totalHours }}
      </span>
    </div>

    <div :class="ACTION_CELL_CLASS">
      <StatusActionButton
        v-if="!hideAction && shownStatus"
        :status="shownStatus"
        :label="APPROVAL_STATUS_BADGE[shownStatus].label"
        :solid-icon="MEMBER_SOLID_ACTION_ICON[shownStatus]"
        @press="emit('action')"
      />
    </div>
  </div>
</template>

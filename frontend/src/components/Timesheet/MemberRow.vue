<script setup lang="ts">
import { computed } from "vue";
import { Avatar, Badge, Button } from "frappe-ui";
import RowToggle from "./RowToggle.vue";
import {
  ACTION_CELL_CLASS,
  ACTION_TEXT_CLASS,
  APPROVAL_STATUS_LABEL,
  APPROVAL_STATUS_THEME,
  CELL_CLASS,
  EMPTY_CELL_CLASS,
  GHOST_ACTION_CLASS,
  MEMBER_ACTION,
  MEMBER_TOTAL_CLASS,
  ROW_CLASS,
} from "./constants";
import type { MemberRowProps } from "./types";

const props = withDefaults(defineProps<MemberRowProps>(), {
  status: "not-submitted",
  totalHours: "",
});

const collapsed = defineModel<boolean>("collapsed", { default: false });

defineEmits<{ action: [] }>();

const action = computed(() => MEMBER_ACTION[props.status]);
</script>

<template>
  <div :class="ROW_CLASS" data-testid="member-row">
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <RowToggle
        label="Toggle member"
        :collapsed="collapsed"
        @click="collapsed = !collapsed"
      />
      <div class="flex min-w-0 items-center gap-2">
        <Avatar :image="avatarUrl" :label="label" shape="circle" size="xs" />
        <span class="truncate text-base-medium text-ink-gray-9">
          {{ label }}
        </span>
        <Badge
          v-if="status !== 'none'"
          class="shrink-0"
          :theme="APPROVAL_STATUS_THEME[status]"
          :label="APPROVAL_STATUS_LABEL[status]"
        />
      </div>
    </div>

    <div
      v-for="(entry, index) in timeEntries"
      :key="index"
      :class="[CELL_CLASS, 'text-base text-ink-gray-9 lining-nums tabular-nums']"
    >
      <span v-if="entry === ''" :class="EMPTY_CELL_CLASS">-</span>
      <span
        v-else
        :class="status === 'none' ? 'text-ink-gray-6' : 'font-medium'"
        >{{ entry }}</span
      >
    </div>

    <div :class="[CELL_CLASS, 'text-sm text-ink-gray-5']">
      <span
        :class="[
          'text-base-medium lining-nums tabular-nums',
          MEMBER_TOTAL_CLASS[status],
        ]"
        >{{ totalHours }}</span
      >
    </div>

    <div :class="ACTION_CELL_CLASS">
      <Button
        v-if="action.icon"
        size="sm"
        :variant="action.variant"
        :icon="action.icon"
        :class="
          action.variant === 'ghost' && [
            GHOST_ACTION_CLASS,
            ACTION_TEXT_CLASS[status],
          ]
        "
        :aria-label="action.label"
        :title="APPROVAL_STATUS_LABEL[status]"
        @click="$emit('action')"
      />
    </div>
  </div>
</template>

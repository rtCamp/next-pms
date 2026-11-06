<script setup lang="ts">
import { computed } from "vue";
import { Button, Spinner, Tooltip } from "frappe-ui";
import {
  APPROVAL_STATUS_ICONS,
  type ApprovalStatusValue,
} from "@/components/ApprovalStatus";

const props = defineProps<{
  status: ApprovalStatusValue;
  /** Accessible name and tooltip. */
  label: string;
  /** A solid button with this icon instead of the status icon. */
  solidIcon?: string;
  /** Replaces the status icon's colour. */
  iconClass?: string;
}>();

defineEmits<{ press: [] }>();

const statusIcon = computed(() => APPROVAL_STATUS_ICONS[props.status]);
</script>

<template>
  <Tooltip :text="label">
    <Button
      size="sm"
      :variant="solidIcon ? 'solid' : 'ghost'"
      :aria-label="label"
      @click.stop="$emit('press')"
    >
      <template #icon>
        <span
          v-if="solidIcon"
          class="size-4"
          :class="solidIcon"
          aria-hidden="true"
        />
        <Spinner
          v-else-if="statusIcon.icon === null"
          class="size-4"
          :class="iconClass ?? statusIcon.color"
          aria-hidden="true"
        />
        <span
          v-else
          class="size-4"
          :class="[statusIcon.icon, iconClass ?? statusIcon.color]"
          aria-hidden="true"
        />
      </template>
    </Button>
  </Tooltip>
</template>

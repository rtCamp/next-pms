<script setup lang="ts">
import { computed } from "vue";
import { Badge, type BadgeProps } from "frappe-ui";
import type { TaskStatusProps, TaskStatusValue } from "./types";

const props = withDefaults(defineProps<TaskStatusProps>(), { size: "lg" });

type Look = Required<Pick<BadgeProps, "theme" | "variant">>;

// frappe-ui has no orange theme: amber stands in for React's orange, and
// Pending Review uses the outline variant so it stays distinct from Working.
const LOOKS: Record<TaskStatusValue, Look> = {
  Open: { theme: "blue", variant: "subtle" },
  Working: { theme: "amber", variant: "subtle" },
  "Pending Review": { theme: "amber", variant: "outline" },
  Overdue: { theme: "red", variant: "subtle" },
  Template: { theme: "gray", variant: "subtle" },
  Completed: { theme: "green", variant: "subtle" },
  Cancelled: { theme: "red", variant: "subtle" },
};

const look = computed(() => LOOKS[props.status] ?? LOOKS.Open);
</script>

<template>
  <Badge
    :theme="look.theme"
    :variant="look.variant"
    :size="size"
    :title="status"
    class="max-w-40 font-semibold"
  >
    <span class="truncate">{{ status }}</span>
  </Badge>
</template>

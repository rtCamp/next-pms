<script setup lang="ts">
import { computed } from "vue";
import { Badge, dayjs } from "frappe-ui";
import type { TaskBadgesProps } from "./types";

const props = defineProps<TaskBadgesProps>();

const badges = computed(
  () =>
    [
      props.dueDate && {
        label: "Due date",
        icon: "lucide-calendar-clock",
        text: dayjs(props.dueDate).format("DD MMM"),
      },
      props.projectName && {
        label: "Project",
        icon: "lucide-folder",
        text: props.projectName,
      },
    ].filter((badge) => Boolean(badge)) as {
      label: string;
      icon: string;
      text: string;
    }[],
);
</script>

<template>
  <div v-if="badges.length" class="flex flex-wrap gap-1">
    <Badge
      v-for="badge in badges"
      :key="badge.label"
      variant="subtle"
      size="md"
      class="min-w-0 max-w-full"
    >
      <span
        class="size-3 shrink-0"
        :class="badge.icon"
        role="img"
        :aria-label="badge.label"
      />
      <span class="max-w-42 truncate" :title="badge.text">
        {{ badge.text }}
      </span>
    </Badge>
  </div>
</template>

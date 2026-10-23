<script setup lang="ts">
import { computed } from "vue";
import { Button, Dropdown } from "frappe-ui";
import type { TimelineItem } from "./types";
import { useTimeline } from "./useTimeline";

const props = defineProps<{ item: TimelineItem }>();

const timeline = useTimeline();

const options = computed(() => {
  const following = timeline.isFollowing(props.item);
  return [
    {
      label: "Edit",
      icon: "lucide-pencil",
      onClick: () => timeline.openEdit(props.item),
    },
    {
      label: props.item.isComplete ? "Mark as incomplete" : "Mark as completed",
      icon: props.item.isComplete ? "lucide-rotate-ccw" : "lucide-check",
      onClick: () => timeline.toggleComplete(props.item),
    },
    {
      label: following ? "Unfollow Document" : "Follow Document",
      icon: following ? "lucide-bell-off" : "lucide-bell",
      onClick: () => timeline.toggleFollow(props.item),
    },
    {
      label: "Delete",
      icon: "lucide-trash-2",
      theme: "red" as const,
      onClick: () => timeline.requestDelete(props.item),
    },
  ];
});
</script>

<template>
  <Dropdown :options="options" side="bottom" align="end">
    <Button
      variant="ghost"
      icon="lucide-ellipsis"
      :label="`Actions for ${item.title}`"
    />
  </Dropdown>
</template>

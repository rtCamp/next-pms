<script setup lang="ts">
import { Button, Dropdown } from "frappe-ui";

defineProps<{ label: string }>();
const emit = defineEmits<{ edit: []; delete: [] }>();

const options = [
  { label: "Edit", icon: "lucide-pencil", onClick: () => emit("edit") },
  {
    label: "Delete",
    icon: "lucide-trash-2",
    theme: "red" as const,
    onClick: () => emit("delete"),
  },
];
</script>

<template>
  <Dropdown :options="options" side="right">
    <Button variant="ghost" icon="lucide-ellipsis" :label="label" />
  </Dropdown>
</template>

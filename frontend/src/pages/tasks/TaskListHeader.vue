<script setup lang="ts">
import { Breadcrumbs, Button, PageHeader } from "frappe-ui";

defineEmits<{ addTask: [] }>();
</script>

<template>
  <PageHeader>
    <div class="flex w-full items-center justify-between gap-2">
      <Breadcrumbs :items="[{ label: 'Tasks' }]" />
      <Button variant="solid" label="Add Task" icon-left="lucide-plus" @click="$emit('addTask')" />
    </div>
  </PageHeader>
</template>

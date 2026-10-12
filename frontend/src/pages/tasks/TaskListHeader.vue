<script setup lang="ts">
import { Breadcrumbs, Button, PageHeaderBase } from "frappe-ui";

defineEmits<{ addTask: [] }>();
</script>

<template>
  <!-- PageHeaderBase brings no padding of its own; the 56px row with 12px sides
       matches the React page header. -->
  <PageHeaderBase class="z-10 border-b border-outline-gray-1 bg-surface-base">
    <div class="flex h-14 items-center justify-between gap-2 px-3 py-2">
      <Breadcrumbs :items="[{ label: 'Tasks' }]" />
      <Button
        variant="solid"
        label="Add Task"
        icon-left="lucide-plus"
        @click="$emit('addTask')"
      />
    </div>
  </PageHeaderBase>
</template>

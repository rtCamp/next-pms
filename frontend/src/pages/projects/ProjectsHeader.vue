<script setup lang="ts">
import { Breadcrumbs, Button, PageHeaderBase } from "frappe-ui";

defineEmits<{ addProject: [] }>();
</script>

<template>
  <PageHeaderBase class="z-10 border-b border-outline-gray-1 bg-surface-base">
    <div class="flex h-14 items-center justify-between gap-2 px-3 py-2">
      <slot name="breadcrumbs">
        <Breadcrumbs :items="[{ label: 'Projects' }]" />
      </slot>
      <Button
        variant="solid"
        label="Add project"
        icon-left="lucide-plus"
        @click="$emit('addProject')"
      />
    </div>
  </PageHeaderBase>
</template>

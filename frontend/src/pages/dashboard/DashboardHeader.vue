<script setup lang="ts">
import { Breadcrumbs, PageHeaderBase } from "frappe-ui";

defineProps<{ title: string }>();
</script>

<template>
  <PageHeaderBase class="z-10 border-b border-outline-gray-1 bg-surface-base">
    <div class="flex h-14 items-center px-3 py-2">
      <Breadcrumbs :items="[{ label: 'Dashboard' }, { label: title }]" />
    </div>
  </PageHeaderBase>
</template>

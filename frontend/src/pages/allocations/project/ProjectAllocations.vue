<script setup lang="ts">
import { ErrorFallback } from "@/components/ErrorFallback";
import AllocationsLayout from "@/pages/allocations/shared/AllocationsLayout.vue";
import ProjectAllocationsTable from "./ProjectAllocationsTable.vue";

defineOptions({ inheritAttrs: false });
</script>

<template>
  <AllocationsLayout view="project">
    <ErrorFallback>
      <ProjectAllocationsTable />
    </ErrorFallback>
  </AllocationsLayout>
</template>

<script setup lang="ts">
import { ErrorFallback } from "@/components/ErrorFallback";
import AllocationsLayout from "@/pages/allocations/shared/AllocationsLayout.vue";
import TeamAllocationsTable from "./TeamAllocationsTable.vue";

defineOptions({ inheritAttrs: false });
</script>

<template>
  <AllocationsLayout view="team">
    <ErrorFallback>
      <TeamAllocationsTable />
    </ErrorFallback>
  </AllocationsLayout>
</template>

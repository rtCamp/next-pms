<script setup lang="ts">
import { Button } from "frappe-ui";
import { canCreate } from "@/utils/boot";
import { RISK_DOCTYPE } from "./constants";
import RisksToolbar from "./RisksToolbar.vue";
import { useRisks } from "./useRisks";

const { openCreate } = useRisks();
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl-semibold leading-tighter text-ink-gray-8">Risks</h2>
      <Button
        v-if="canCreate(RISK_DOCTYPE)"
        variant="solid"
        icon-left="lucide-plus"
        label="Create"
        @click="openCreate()"
      />
    </div>
    <RisksToolbar />
  </div>
</template>

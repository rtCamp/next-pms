<script setup lang="ts">
import { Button } from "frappe-ui";
import { canCreate } from "@/utils/boot";
import { GROWTH_DOCTYPE } from "./constants";
import GrowthToolbar from "./GrowthToolbar.vue";
import { useGrowth } from "./useGrowth";

const { openCreate } = useGrowth();
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl-semibold leading-tighter text-ink-gray-8">Growth</h2>
      <Button
        v-if="canCreate(GROWTH_DOCTYPE)"
        variant="solid"
        icon-left="lucide-plus"
        label="Create"
        @click="openCreate()"
      />
    </div>
    <GrowthToolbar />
  </div>
</template>

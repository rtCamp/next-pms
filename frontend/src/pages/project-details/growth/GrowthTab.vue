<script setup lang="ts">
import { LoadingOverlay } from "@/components/LoadingOverlay";
import LoadError from "@/pages/project-details/LoadError.vue";
import GrowthDetail from "./GrowthDetail.vue";
import GrowthDialog from "./GrowthDialog.vue";
import GrowthHeader from "./GrowthHeader.vue";
import GrowthList from "./GrowthList.vue";
import { provideGrowth } from "./useGrowth";

defineOptions({ inheritAttrs: false });

const { growthId, loading, loadError, refresh } = provideGrowth();
</script>

<template>
  <GrowthDetail v-if="growthId" :key="growthId" :growth-id="growthId" />
  <div v-else class="flex flex-col gap-3.5">
    <GrowthHeader />
    <LoadError
      v-if="loadError"
      title="Couldn't load the growth initiatives"
      :error="loadError"
      @retry="refresh()"
    />
    <LoadingOverlay v-else :active="loading" class="min-h-40">
      <GrowthList />
    </LoadingOverlay>
  </div>
  <GrowthDialog />
</template>

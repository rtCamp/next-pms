<script setup lang="ts">
import { LoadingOverlay } from "@/components/LoadingOverlay";
import LoadError from "@/pages/project-details/LoadError.vue";
import RisksHeader from "./RisksHeader.vue";
import RisksList from "./RisksList.vue";
import { provideRisks } from "./useRisks";

const { riskId, loading, loadError, refresh } = provideRisks();
</script>

<template>
  <div v-if="!riskId" class="flex flex-col gap-3.5">
    <RisksHeader />
    <LoadError
      v-if="loadError"
      title="Couldn't load the risks"
      :error="loadError"
      @retry="refresh()"
    />
    <LoadingOverlay v-else :active="loading" class="min-h-40">
      <RisksList />
    </LoadingOverlay>
  </div>
</template>

<script setup lang="ts">
import { LoadingOverlay } from "@/components/LoadingOverlay";
import LoadError from "@/pages/project-details/LoadError.vue";
import RiskDetail from "./RiskDetail.vue";
import RiskDialog from "./RiskDialog.vue";
import RisksHeader from "./RisksHeader.vue";
import RisksList from "./RisksList.vue";
import { provideRisks } from "./useRisks";

defineOptions({ inheritAttrs: false });

const { riskId, loading, loadError, refresh } = provideRisks();
</script>

<template>
  <RiskDetail v-if="riskId" :key="riskId" :risk-id="riskId" />
  <div v-else class="flex flex-col gap-3.5">
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
  <RiskDialog />
</template>

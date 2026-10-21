<script setup lang="ts">
import { computed } from "vue";
import { RichText } from "@/components/RichText";
import { hasProjectField } from "@/utils/boot";
import CommunicationSection from "./CommunicationSection.vue";
import { SOURCING_FIELDS } from "./constants";
import MarketingSection from "./MarketingSection.vue";
import OverviewSection from "./OverviewSection.vue";
import SourcingSection from "./SourcingSection.vue";
import SpecificsSection from "./SpecificsSection.vue";
import { provideOverview } from "./useOverview";

const { values } = provideOverview();

const showSourcing = SOURCING_FIELDS.some(hasProjectField);

const richTextClass =
  "prose-sm w-full max-w-full leading-normal text-ink-gray-7";
const summary = computed(() => values.value?.custom_executive_summary ?? "");
const keyGoals = computed(() => values.value?.custom_key_goals ?? "");
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl-semibold leading-tighter text-ink-gray-8">
        Overview
      </h2>
    </div>
    <OverviewSection title="Details" class="gap-1">
      <RichText :content="summary" kit="richText" :class="richTextClass" />
    </OverviewSection>
    <OverviewSection title="Key goals of the project" class="gap-1">
      <RichText :content="keyGoals" kit="richText" :class="richTextClass" />
    </OverviewSection>
    <SpecificsSection />
    <SourcingSection v-if="showSourcing" />
    <CommunicationSection />
    <MarketingSection />
  </div>
</template>

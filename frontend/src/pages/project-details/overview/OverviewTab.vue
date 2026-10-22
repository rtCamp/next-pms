<script setup lang="ts">
import { Button } from "frappe-ui";
import { RichText } from "@/components/RichText";
import RichTextEditor from "@/pages/project-details/RichTextEditor.vue";
import { hasProjectField } from "@/utils/boot";
import CommunicationSection from "./CommunicationSection.vue";
import { SOURCING_FIELDS } from "./constants";
import MarketingSection from "./MarketingSection.vue";
import OverviewSection from "./OverviewSection.vue";
import RepositoriesSection from "./RepositoriesSection.vue";
import SourcingSection from "./SourcingSection.vue";
import SpecificsSection from "./SpecificsSection.vue";
import { provideOverview } from "./useOverview";

const { values, draft, editing, saving, dirty, edit, cancel, save } =
  provideOverview();

const showSourcing = SOURCING_FIELDS.some(hasProjectField);
const showRepositories = Boolean(window.boot?.has_repository_connections);
// React's paragraphs keep 8px margins, the first and last too.
const RICH_TEXT_CLASS =
  "prose-sm w-full max-w-full leading-normal text-ink-gray-7 prose-p:my-2";
</script>

<template>
  <div v-if="values" class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl-semibold leading-tighter text-ink-gray-8">
        Overview
      </h2>
      <div v-if="editing" class="flex items-center gap-2">
        <Button
          variant="subtle"
          label="Cancel"
          :disabled="saving"
          @click="cancel"
        />
        <Button
          variant="solid"
          label="Save"
          :loading="saving"
          :disabled="!dirty"
          @click="save()"
        />
      </div>
      <Button
        v-else
        variant="solid"
        icon-left="lucide-square-pen"
        label="Edit"
        @click="edit"
      />
    </div>
    <OverviewSection title="Details" class="gap-1">
      <RichTextEditor
        v-if="draft"
        v-model="draft.custom_executive_summary"
        label="Details"
        :disabled="saving"
      />
      <RichText
        v-else
        :content="values.custom_executive_summary"
        kit="richText"
        :class="RICH_TEXT_CLASS"
      />
    </OverviewSection>
    <OverviewSection title="Key goals of the project" class="gap-1">
      <RichTextEditor
        v-if="draft"
        v-model="draft.custom_key_goals"
        label="Key goals of the project"
        :disabled="saving"
      />
      <RichText
        v-else
        :content="values.custom_key_goals"
        kit="richText"
        :class="RICH_TEXT_CLASS"
      />
    </OverviewSection>
    <SpecificsSection />
    <SourcingSection v-if="showSourcing" />
    <CommunicationSection />
    <MarketingSection />
    <RepositoriesSection v-if="showRepositories" />
  </div>
</template>

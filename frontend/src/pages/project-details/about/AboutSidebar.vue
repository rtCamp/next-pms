<script setup lang="ts">
import { ref } from "vue";
import { Button } from "frappe-ui";
import { AccordionRoot } from "reka-ui";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { errorMessage } from "@/utils/errors";
import AddCustomersDialog from "./AddCustomersDialog.vue";
import BudgetSection from "./BudgetSection.vue";
import { SECTIONS, type SectionKey } from "./constants";
import CustomersSection from "./CustomersSection.vue";
import DetailsSection from "./DetailsSection.vue";
import LinksSection from "./LinksSection.vue";
import MembersSection from "./MembersSection.vue";
import ProgressSection from "./ProgressSection.vue";
import SectionSkeleton from "./SectionSkeleton.vue";
import SidebarSection from "./SidebarSection.vue";
import SummarySection from "./SummarySection.vue";
import { provideProjectSidebar } from "./useProjectSidebar";

const { projectId } = useProjectDetails();
const { sidebar, loading, error, reload } = provideProjectSidebar();

const OPEN = SECTIONS.map((section) => section.value);

const SKELETON_LINES: Record<SectionKey, number> = {
  summary: 2,
  details: 5,
  links: 1,
  budget: 2,
  progress: 2,
  members: 4,
  customers: 2,
};

const addCustomersOpen = ref(false);
</script>

<template>
  <section
    class="flex h-full min-h-0 flex-col"
    aria-labelledby="about-this-project"
  >
    <h2
      id="about-this-project"
      class="h-10 shrink-0 truncate border-b border-outline-gray-1 px-5 py-3 text-lg-medium leading-tighter text-ink-gray-8"
    >
      About this project
    </h2>
    <div
      v-if="error"
      role="alert"
      class="flex flex-col items-center gap-2 px-5 py-10 text-center"
    >
      <p class="text-sm font-medium text-ink-gray-7">
        Couldn't load the project's details
      </p>
      <p class="break-words text-sm text-ink-gray-5">
        {{ errorMessage(error) }}
      </p>
      <Button
        class="mt-2"
        icon-left="lucide-refresh-cw"
        label="Try again"
        @click="reload()"
      />
    </div>
    <AccordionRoot
      v-else
      type="multiple"
      :default-value="OPEN"
      class="min-h-0 flex-1 overflow-y-auto"
    >
      <SidebarSection
        v-for="section in SECTIONS"
        :key="section.value"
        :value="section.value"
        :title="section.title"
      >
        <template v-if="section.value === 'details'" #actions>
          <Button
            icon="lucide-arrow-up-right"
            label="Open in Desk"
            tooltip="Open in Desk"
            :href="`/desk/project/${encodeURIComponent(projectId)}`"
          />
        </template>
        <template v-else-if="section.value === 'customers'" #actions>
          <Button
            icon="lucide-plus"
            label="Add customer"
            @click="addCustomersOpen = true"
          />
        </template>
        <SectionSkeleton
          v-if="loading"
          :lines="SKELETON_LINES[section.value]"
        />
        <template v-else-if="sidebar">
          <SummarySection v-if="section.value === 'summary'" />
          <DetailsSection v-else-if="section.value === 'details'" />
          <LinksSection v-else-if="section.value === 'links'" />
          <BudgetSection v-else-if="section.value === 'budget'" />
          <ProgressSection v-else-if="section.value === 'progress'" />
          <MembersSection v-else-if="section.value === 'members'" />
          <CustomersSection v-else-if="section.value === 'customers'" />
        </template>
      </SidebarSection>
    </AccordionRoot>
    <AddCustomersDialog v-model:open="addCustomersOpen" />
  </section>
</template>

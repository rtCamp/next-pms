<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from "vue";
import { Button } from "frappe-ui";
import { Accordion } from "frappe-ui/experimental";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { errorMessage } from "@/utils/errors";
import { SECTIONS, type SectionKey } from "./constants";
import BudgetSection from "./BudgetSection.vue";
import DetailsSection from "./DetailsSection.vue";
import LinksSection from "./LinksSection.vue";
import MembersSection from "./MembersSection.vue";
import ProgressSection from "./ProgressSection.vue";
import SectionSkeleton from "./SectionSkeleton.vue";
import SummarySection from "./SummarySection.vue";
import { provideProjectSidebar } from "./useProjectSidebar";

const { projectId } = useProjectDetails();
const { sidebar, loading, error, reload } = provideProjectSidebar();

const ITEMS = SECTIONS.map((section) => ({ ...section }));
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

const accordion = useTemplateRef<{ $el: HTMLElement }>("accordion");
const headers = ref<Partial<Record<SectionKey, HTMLElement>>>({});

// Header actions sit in the item's heading, beside the trigger button: the
// Accordion's item-suffix slot renders inside the button.
onMounted(() => {
  const items =
    accordion.value?.$el.querySelectorAll<HTMLElement>("[data-slot=item]");
  items?.forEach((item, index) => {
    const heading = item.querySelector("[data-slot=trigger]")?.parentElement;
    if (heading) headers.value[SECTIONS[index].value] = heading;
  });
});
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
    <Accordion
      v-show="!error"
      ref="accordion"
      type="multiple"
      heading-tag="h3"
      :items="ITEMS"
      :default-value="OPEN"
      class="min-h-0 flex-1 overflow-y-auto [&>[data-slot=item]>[data-slot=content]>div:empty]:hidden [&>[data-slot=item]>[data-slot=content]>div]:px-5 [&>[data-slot=item]>[data-slot=content]>div]:pb-4 [&>[data-slot=item]>*>[data-slot=trigger]>.lucide-chevron-down]:text-ink-gray-7 [&>[data-slot=item]>*>[data-slot=trigger][data-state=closed]>.lucide-chevron-down]:-rotate-90 [&>[data-slot=item]>*>[data-slot=trigger][data-state=open]>.lucide-chevron-down]:rotate-0 [&>[data-slot=item]>*>[data-slot=trigger]]:min-w-0 [&>[data-slot=item]>*>[data-slot=trigger]]:flex-row-reverse [&>[data-slot=item]>*>[data-slot=trigger]]:gap-3 [&>[data-slot=item]>*>[data-slot=trigger]]:rounded-1 [&>[data-slot=item]>*>[data-slot=trigger]]:px-5 [&>[data-slot=item]>*>[data-slot=trigger]]:py-3 [&>[data-slot=item]>*>[data-slot=trigger]]:leading-tighter"
    >
      <template #item-content="{ item }">
        <SectionSkeleton
          v-if="loading"
          :lines="SKELETON_LINES[item.value as SectionKey]"
        />
        <template v-else-if="sidebar">
          <SummarySection v-if="item.value === 'summary'" />
          <DetailsSection v-else-if="item.value === 'details'" />
          <LinksSection v-else-if="item.value === 'links'" />
          <BudgetSection v-else-if="item.value === 'budget'" />
          <ProgressSection v-else-if="item.value === 'progress'" />
          <MembersSection v-else-if="item.value === 'members'" />
        </template>
      </template>
    </Accordion>
    <Teleport v-if="headers.details" :to="headers.details">
      <div class="flex shrink-0 items-center py-3 pr-5">
        <Button
          icon="lucide-arrow-up-right"
          label="Open in Desk"
          tooltip="Open in Desk"
          :href="`/desk/project/${encodeURIComponent(projectId)}`"
        />
      </div>
    </Teleport>
  </section>
</template>

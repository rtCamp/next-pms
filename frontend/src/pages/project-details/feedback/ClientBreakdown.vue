<script setup lang="ts">
import { computed } from "vue";
import { Spinner, useCall } from "frappe-ui";
import { FEEDBACK_API } from "./constants";
import LoadError from "./LoadError.vue";
import RatingCard from "./RatingCard.vue";
import type { ClientBreakdown } from "./types";

const props = defineProps<{ feedbackId: string; monthName: string }>();

const breakdown = useCall<ClientBreakdown, { feedback_name: string }>({
  url: `${FEEDBACK_API}.get_project_feedback_breakdown`,
  params: () => ({ feedback_name: props.feedbackId }),
});

const responses = computed(() =>
  (breakdown.data?.responses ?? []).filter(
    (response) => response.answer != null,
  ),
);
</script>

<template>
  <LoadError
    v-if="breakdown.error"
    title="Couldn't load the feedback breakdown"
    :error="breakdown.error"
    @retry="breakdown.reload()"
  />
  <div
    v-else-if="breakdown.loading || !breakdown.data"
    class="flex justify-center pt-16"
  >
    <Spinner class="size-5" />
  </div>
  <!-- eslint-disable-next-line better-tailwindcss/no-restricted-classes -- React's fixed 240px breakdown column -->
  <div v-else class="grid grid-cols-[240px_1fr] gap-6">
    <section>
      <h3 class="mb-3.5 text-lg-medium text-ink-gray-7">
        {{ monthName }} Feedback Breakdown
      </h3>
      <p
        v-if="!breakdown.data.ratings.length"
        class="text-base text-ink-gray-5"
      >
        No feedback available for this month.
      </p>
      <div v-else class="flex flex-col gap-3">
        <RatingCard
          v-for="rating in breakdown.data.ratings"
          :key="rating.fieldname"
          :rating="rating"
        />
      </div>
    </section>
    <section>
      <h3 class="mb-3.5 text-lg-medium text-ink-gray-7">Responses</h3>
      <p v-if="!responses.length" class="text-base text-ink-gray-5">
        No responses submitted for this month.
      </p>
      <div v-else class="flex flex-col gap-5">
        <div
          v-for="response in responses"
          :key="response.fieldname"
          class="flex flex-col gap-1"
        >
          <p class="text-base-medium text-ink-gray-7">{{ response.label }}</p>
          <p class="text-base leading-normal text-ink-gray-6">
            {{ response.answer }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

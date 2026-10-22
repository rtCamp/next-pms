<script setup lang="ts">
import { Avatar, dayjs, Rating, Spinner, useCall } from "frappe-ui";
import { FEEDBACK_API } from "./constants";
import { toStars } from "./feedback";
import FeedbackComments from "./FeedbackComments.vue";
import LoadError from "./LoadError.vue";
import MetaRow from "./MetaRow.vue";
import type { TeamBreakdown } from "./types";

const props = defineProps<{ feedbackId: string }>();

const detail = useCall<TeamBreakdown, { feedback_name: string }>({
  url: `${FEEDBACK_API}.get_team_feedback_breakdown`,
  params: () => ({ feedback_name: props.feedbackId }),
});

const periodDate = (date: string) => dayjs(date).format("MMM DD");
</script>

<template>
  <LoadError
    v-if="detail.error"
    title="Couldn't load the feedback"
    :error="detail.error"
    @retry="detail.reload()"
  />
  <div
    v-else-if="detail.loading || !detail.data"
    class="flex h-60 items-center justify-center"
  >
    <Spinner class="size-6" />
  </div>
  <!-- eslint-disable better-tailwindcss/no-restricted-classes -- React's 72vh body height -->
  <div
    v-else
    class="relative -mx-4 -mb-6 flex max-h-[72vh] border-t border-outline-gray-1 sm:-mx-6"
  >
    <div class="max-h-[72vh] min-w-0 flex-1 overflow-y-auto">
      <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
      <div class="flex flex-col gap-6 p-6">
        <div class="flex w-full gap-2 overflow-x-auto">
          <div
            v-for="rating in detail.data.ratings"
            :key="rating.fieldname"
            class="flex shrink-0 basis-36 flex-col gap-3 rounded-6 border border-outline-gray-1 bg-surface-elevation-2 p-3"
          >
            <span class="text-sm leading-tighter text-ink-gray-5">
              {{ rating.label }}
            </span>
            <div class="mt-auto">
              <Rating
                :model-value="toStars(rating.value, rating.star_max)"
                :max="rating.star_max"
                :step="0.5"
                size="md"
                disabled
                :aria-label="rating.label"
              />
            </div>
          </div>
        </div>

        <section class="flex flex-col gap-2">
          <h3 class="text-2xl-semibold text-ink-gray-7">
            Areas of improvement
          </h3>
          <p class="text-base leading-normal text-ink-gray-7">
            {{
              detail.data.areas_for_improvement ||
              "No specific areas mentioned."
            }}
          </p>
        </section>

        <FeedbackComments :feedback-id="feedbackId" />
      </div>
    </div>

    <aside
      class="flex w-78 shrink-0 flex-col gap-3.5 border-l border-outline-gray-1 p-5"
      aria-label="Feedback details"
    >
      <MetaRow label="From">{{ periodDate(detail.data.period_from) }}</MetaRow>
      <MetaRow label="To">{{ periodDate(detail.data.period_to) }}</MetaRow>
      <MetaRow label="Member">
        <Avatar
          size="xs"
          :label="detail.data.employee_name"
          :image="detail.data.avatar_url ?? undefined"
        />
        <span class="truncate">{{ detail.data.employee_name }}</span>
      </MetaRow>
      <MetaRow label="Customer">
        <Avatar
          size="xs"
          :label="detail.data.customer"
          :image="detail.data.customer_avatar_url ?? undefined"
        />
        <span class="truncate">{{ detail.data.customer }}</span>
      </MetaRow>
      <MetaRow label="Average rating">
        <Rating
          :model-value="detail.data.average ?? 0"
          :max="detail.data.ratings[0]?.star_max"
          :step="0.5"
          disabled
          aria-label="Average rating"
        />
        <span class="tabular-nums">
          {{ detail.data.average?.toFixed(1) ?? "0.0" }}
        </span>
      </MetaRow>
    </aside>
  </div>
</template>

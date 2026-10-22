<script setup lang="ts">
import { Rating } from "frappe-ui";
import { toStars } from "./feedback";
import type { FeedbackRating } from "./types";

defineProps<{ rating: FeedbackRating }>();
</script>

<template>
  <div
    class="flex flex-col justify-between gap-2 overflow-hidden rounded-6 border border-outline-gray-1 bg-surface-base p-3"
  >
    <span class="text-base text-ink-gray-5">{{ rating.label }}</span>
    <div class="flex items-center justify-between">
      <Rating
        :model-value="toStars(rating.value, rating.star_max)"
        :max="rating.star_max"
        :step="0.5"
        size="lg"
        disabled
        :aria-label="rating.label"
      />
      <span class="text-base text-ink-gray-7">{{ rating.percent ?? 0 }}%</span>
    </div>
  </div>
</template>

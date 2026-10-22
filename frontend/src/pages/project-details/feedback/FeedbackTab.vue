<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useQueryPatch } from "@/composables/useQueryPatch";
import { queryString } from "@/utils/query";
import { DEFAULT_VIEW, VIEW_PARAM, type FeedbackView } from "./constants";
import { feedbackView } from "./feedback";
import FeedbackToolbar from "./FeedbackToolbar.vue";

const route = useRoute();
const patchQuery = useQueryPatch();

const viewParam = computed(() => queryString(route.query[VIEW_PARAM]));

const view = computed({
  get: () => feedbackView(viewParam.value),
  set: (value: FeedbackView) =>
    patchQuery(
      { [VIEW_PARAM]: value === DEFAULT_VIEW ? null : value },
      { push: true },
    ),
});

// An unknown view, or the default one spelled out, leaves the URL.
watch(
  viewParam,
  (param) => {
    if (param && (param !== view.value || param === DEFAULT_VIEW)) {
      patchQuery({ [VIEW_PARAM]: null });
    }
  },
  { immediate: true },
);
</script>

<template>
  <div>
    <FeedbackToolbar v-model="view" />
  </div>
</template>

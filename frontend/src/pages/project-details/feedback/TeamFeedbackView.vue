<script setup lang="ts">
import { computed, ref, shallowRef, useTemplateRef } from "vue";
import { Rating, Skeleton, useCall } from "frappe-ui";
import {
  List,
  ListCell,
  ListHeader,
  ListHeaderCell,
  ListRow,
  ListRows,
} from "frappe-ui/list";
import { useInfiniteScroll } from "@/composables/useInfiniteScroll";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { FEEDBACK_API, TEAM_COLUMNS, TEAM_PAGE_SIZE } from "./constants";
import { formatPeriodDate } from "./feedback";
import LoadError from "@/pages/project-details/LoadError.vue";
import PersonCell from "./PersonCell.vue";
import TeamFeedbackDialog from "./TeamFeedbackDialog.vue";
import type { TeamFeedbackPage, TeamFeedbackRow } from "./types";

const { projectId } = useProjectDetails();

const start = ref(0);
const rows = ref<TeamFeedbackRow[]>([]);

const page = useCall<TeamFeedbackPage, Record<string, unknown>>({
  url: `${FEEDBACK_API}.get_team_feedback_list`,
  params: () => ({
    project: projectId.value,
    start: start.value,
    limit: TEAM_PAGE_SIZE,
  }),
  refetch: true,
  onSuccess: (data) => {
    rows.value = start.value ? [...rows.value, ...data.data] : data.data;
  },
});

const hasMore = computed(() => page.data?.has_more ?? false);

useInfiniteScroll({
  root: shallowRef(null),
  sentinel: useTemplateRef<HTMLElement>("sentinel"),
  count: () => rows.value.length,
  canLoad: () => !page.loading && !page.error && hasMore.value,
  load: () => (start.value = rows.value.length),
});

const dialogOpen = ref(false);
const selectedId = ref<string | null>(null);

function openFeedback(row: TeamFeedbackRow) {
  selectedId.value = row.name;
  dialogOpen.value = true;
}
</script>

<template>
  <div>
    <LoadError
      v-if="page.error && !rows.length"
      title="Couldn't load the team feedback"
      :error="page.error"
      @retry="page.reload()"
    />
    <div v-else class="overflow-x-auto">
      <List
        :columns="TEAM_COLUMNS.map((column) => column.width)"
        :row-height="40"
        aria-label="Team feedback"
        class="min-w-min list-row-px-2"
      >
        <ListHeader>
          <ListHeaderCell v-for="column in TEAM_COLUMNS" :key="column.key">
            {{ column.label }}
          </ListHeaderCell>
        </ListHeader>
        <ListRows v-slot="{ item }" :items="rows" row-key="name">
          <ListRow @click="openFeedback(item)">
            <ListCell class="text-base text-ink-gray-6">
              {{ formatPeriodDate(item.period_from) }}
            </ListCell>
            <ListCell class="text-base text-ink-gray-6">
              {{ formatPeriodDate(item.period_to) }}
            </ListCell>
            <ListCell class="min-w-0">
              <PersonCell :name="item.employee_name" :image="item.avatar_url" />
            </ListCell>
            <ListCell class="min-w-0">
              <PersonCell
                :name="item.customer"
                :image="item.customer_avatar_url"
              />
            </ListCell>
            <ListCell>
              <div class="flex items-center gap-2">
                <Rating
                  :model-value="item.average ?? 0"
                  :max="item.star_max"
                  :step="0.5"
                  disabled
                  aria-label="Average rating"
                />
                <span class="text-base tabular-nums text-ink-gray-6">
                  {{ (item.average ?? 0).toFixed(1) }}
                </span>
              </div>
            </ListCell>
          </ListRow>
        </ListRows>
      </List>
      <p
        v-if="!rows.length && !page.loading && !page.error"
        class="py-4 text-center text-sm text-ink-gray-5"
      >
        No feedback available.
      </p>
      <div v-if="page.loading" class="flex flex-col gap-px">
        <Skeleton v-for="index in 3" :key="index" class="h-10 w-full" />
      </div>
      <LoadError
        v-else-if="page.error"
        title="Couldn't load more team feedback"
        :error="page.error"
        @retry="page.reload()"
      />
      <div ref="sentinel" aria-hidden="true" />
    </div>
    <TeamFeedbackDialog v-model:open="dialogOpen" :feedback-id="selectedId" />
  </div>
</template>

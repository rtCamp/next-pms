<script setup lang="ts">
import { computed, shallowRef, useTemplateRef } from "vue";
import { Spinner } from "frappe-ui";
import { useInfiniteScroll } from "@/composables/useInfiniteScroll";
import LoadError from "@/pages/project-details/LoadError.vue";
import { emptyTableMessage } from "./calendar";
import { MILESTONE_COLUMNS, TOUCHPOINT_COLUMNS } from "./constants";
import TimelineTable from "./TimelineTable.vue";
import { useTimeline } from "./useTimeline";

const timeline = useTimeline();
const { tab, search, listRows, listLoading, listError, listHasMore } = timeline;

const columns = computed(() =>
  tab.value === "milestones" ? MILESTONE_COLUMNS : TOUCHPOINT_COLUMNS,
);

useInfiniteScroll({
  root: shallowRef(null),
  sentinel: useTemplateRef<HTMLElement>("sentinel"),
  count: () => listRows.value.length,
  canLoad: () => !listLoading.value && !listError.value && listHasMore.value,
  load: () => timeline.loadMoreList(),
});
</script>

<template>
  <div>
    <LoadError
      v-if="listError && !listRows.length"
      :title="`Couldn't load the ${tab}`"
      :error="listError"
      @retry="timeline.retryList()"
    />
    <div
      v-else-if="listLoading && !listRows.length"
      class="flex justify-center py-10"
    >
      <Spinner class="size-5" />
    </div>
    <template v-else>
      <TimelineTable
        :items="listRows"
        :columns="columns"
        :empty-message="emptyTableMessage(tab, search)"
        :label="tab === 'milestones' ? 'Milestones' : 'Touchpoints'"
      />
      <div v-if="listLoading" class="flex justify-center py-4">
        <Spinner class="size-4" />
      </div>
      <LoadError
        v-else-if="listError"
        :title="`Couldn't load more ${tab}`"
        :error="listError"
        @retry="timeline.retryList()"
      />
    </template>
    <div ref="sentinel" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, useTemplateRef, watch } from "vue";
import { Alert, PageHeaderBase, Skeleton, useCall } from "frappe-ui";
import { useWhatsNew } from "@/composables/useWhatsNew";
import ReleaseCard from "./ReleaseCard.vue";
import type { ReleaseNotes } from "./types";

defineOptions({ inheritAttrs: false });

const whatsNew = useWhatsNew();
const notes = useCall<ReleaseNotes>({
  url: "/api/v2/method/next_pms.api.whats_new.get_release_notes",
});
async function retry() {
  await notes.reload();
}

const shownVersion = computed(() => notes.data?.releases[0]?.version);

watch(
  shownVersion,
  (version) => {
    if (version) whatsNew.markSeen(version);
  },
  { immediate: true },
);

const title = useTemplateRef<HTMLHeadingElement>("title");
onMounted(() => title.value?.focus());
</script>

<template>
  <PageHeaderBase class="z-10 border-b border-outline-gray-1 bg-surface-base">
    <div
      class="flex min-h-14 flex-wrap items-center justify-between gap-2 px-3 py-2"
    >
      <h1
        ref="title"
        tabindex="-1"
        class="text-lg-medium text-ink-gray-8 focus:outline-none"
      >
        What's new
      </h1>
      <span
        v-if="notes.data"
        class="pr-2 text-base text-ink-gray-5 max-md:w-full max-md:pr-0"
      >
        You're on v{{ notes.data.current_version }}
      </span>
    </div>
  </PageHeaderBase>
  <div
    class="mx-auto flex max-w-[940px] flex-col gap-4 px-5 pb-10 pt-5 max-md:px-3"
  >
    <template v-if="notes.loading">
      <div
        v-for="index in 2"
        :key="index"
        class="flex flex-col gap-3 rounded-6 border border-outline-gray-1 px-5 py-4"
      >
        <Skeleton class="h-5 w-40" />
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-5/6" />
        <Skeleton class="h-4 w-2/3" />
      </div>
    </template>
    <Alert
      v-else-if="notes.error"
      theme="red"
      title="Couldn't load release notes."
      :primary-action="{ label: 'Retry', onClick: retry }"
    />
    <div
      v-else-if="notes.data?.releases.length === 0"
      class="flex flex-col items-center gap-2 py-16 text-base text-ink-gray-5"
    >
      <span aria-hidden="true" class="lucide-sparkles size-6" />
      No release notes yet
    </div>
    <ReleaseCard
      v-for="(release, index) in notes.data?.releases"
      :key="release.version"
      :release="release"
      :is-latest="index === 0"
    />
  </div>
</template>

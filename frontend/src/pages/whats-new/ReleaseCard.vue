<script setup lang="ts">
import { computed, ref, useId } from "vue";
import { Badge, dayjs } from "frappe-ui";
import type { Release } from "./types";

const props = defineProps<{ release: Release; isLatest: boolean }>();

const open = ref(false);
const versionId = useId();
const contentId = useId();
const expanded = computed(() => props.isLatest || open.value);
const date = computed(() =>
  dayjs(props.release.date, "YYYY-MM-DD").format("D MMM YYYY"),
);

const headerClass =
  "flex w-full flex-wrap items-center gap-2.5 px-5 py-4 text-left";
</script>

<template>
  <section
    :aria-labelledby="versionId"
    class="overflow-hidden rounded-6 border border-outline-gray-1 bg-surface-base"
  >
    <h2>
      <component
        :is="isLatest ? 'span' : 'button'"
        :type="isLatest ? undefined : 'button'"
        :aria-expanded="isLatest ? undefined : open"
        :aria-controls="isLatest ? undefined : contentId"
        :class="[
          headerClass,
          !isLatest &&
            'transition-colors duration-100 ease-out hover:bg-surface-gray-2',
        ]"
        @click="isLatest || (open = !open)"
      >
        <span
          :id="versionId"
          class="whitespace-nowrap text-2xl-semibold tracking-[-0.005em] text-ink-gray-8"
        >
          v{{ release.version }}
        </span>
        <Badge
          v-if="isLatest"
          theme="blue"
          variant="subtle"
          size="sm"
          label="Latest"
        />
        <span
          class="ml-auto text-sm tabular-nums text-ink-gray-5 max-md:order-last max-md:ml-0 max-md:basis-full"
        >
          {{ date }}
        </span>
        <span
          v-if="!isLatest"
          aria-hidden="true"
          class="lucide-chevron-down size-4 shrink-0 text-ink-gray-5 transition-transform duration-150 ease-in-out motion-reduce:transition-none max-md:ml-auto"
          :class="{ 'rotate-180': open }"
        />
      </component>
    </h2>
    <!-- eslint-disable vue/no-v-html, better-tailwindcss/no-unknown-classes -- the server sanitizes the HTML (nh3); `.release-notes` styles it below -->
    <div
      v-if="expanded"
      :id="contentId"
      class="release-notes border-t border-outline-gray-1 px-5 py-4"
      v-html="release.html"
    />
    <!-- eslint-enable vue/no-v-html, better-tailwindcss/no-unknown-classes -->
  </section>
</template>

<style scoped>
.release-notes {
  @apply break-words text-p-base text-ink-gray-7;
}
.release-notes > :deep(:first-child) {
  @apply mt-0 border-t-0 pt-0;
}
.release-notes > :deep(:last-child) {
  @apply mb-0;
}
.release-notes :deep(h3) {
  @apply mb-2 mt-5 border-t border-outline-gray-1 pt-4 text-lg font-semibold text-ink-gray-8;
}
.release-notes :deep(h4) {
  @apply mb-1 mt-4 text-md font-medium text-ink-gray-8;
}
.release-notes :deep(:is(h5, h6)) {
  @apply mb-1 mt-3 text-base font-semibold text-ink-gray-8;
}
.release-notes :deep(p) {
  @apply my-2;
}
.release-notes :deep(:is(ul, ol)) {
  @apply my-2 pl-5;
}
.release-notes :deep(ul) {
  @apply list-disc;
}
.release-notes :deep(ol) {
  @apply list-decimal;
}
.release-notes :deep(li) {
  @apply my-1 pl-0.5;
}
.release-notes :deep(li > p) {
  @apply my-0;
}
.release-notes :deep(:is(ul, ol) :is(ul, ol)) {
  @apply my-1;
}
.release-notes :deep(ul ul) {
  @apply list-[circle];
}
.release-notes :deep(li::marker) {
  @apply text-ink-gray-4;
}
.release-notes :deep(strong) {
  @apply font-semibold text-ink-gray-8;
}
.release-notes :deep(a) {
  @apply text-ink-gray-8 underline underline-offset-2;
  text-decoration-color: var(--outline-gray-3);
}
.release-notes :deep(a:hover) {
  @apply decoration-current;
}
.release-notes :deep(code) {
  @apply rounded-4 bg-surface-gray-2 px-1 py-0.5 font-mono text-sm;
}
.release-notes :deep(pre) {
  @apply my-3 overflow-x-auto rounded-4 bg-surface-gray-2 p-3;
}
.release-notes :deep(pre code) {
  @apply bg-transparent p-0;
}
.release-notes :deep(img) {
  @apply my-3 h-auto max-w-full rounded-4;
}
.release-notes :deep(blockquote) {
  @apply my-3 border-l-2 border-outline-gray-2 pl-3 text-ink-gray-6;
}
.release-notes :deep(hr) {
  @apply my-5 border-outline-gray-1;
}
.release-notes :deep(table) {
  @apply my-3 block max-w-full overflow-x-auto text-sm;
}
.release-notes :deep(:is(th, td)) {
  @apply border border-outline-gray-1 px-2 py-1 text-left;
}
</style>

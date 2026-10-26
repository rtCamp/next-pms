<script setup lang="ts">
import { computed } from "vue";
import { formatFileSize } from "@/utils/format";
import { fileExtension, fileBaseName } from "./files";
import type { FileAttachment } from "./types";

const props = defineProps<{ file: FileAttachment }>();

const name = computed(() => fileBaseName(props.file.file_name));
const extension = computed(() => fileExtension(props.file.file_name));
</script>

<template>
  <a
    :href="file.file_url"
    target="_blank"
    rel="noopener noreferrer"
    class="flex min-w-0 max-w-50 items-center gap-2 rounded-6 border border-transparent bg-surface-gray-1 p-2 hover:border-outline-gray-1"
  >
    <div
      class="flex size-9 shrink-0 items-center justify-center rounded-4 bg-surface-red-2 text-ink-red-6"
    >
      <span class="lucide-file-type size-4" aria-hidden="true" />
    </div>
    <div class="min-w-0 flex-1">
      <p class="truncate text-base-medium text-ink-gray-7">{{ name }}</p>
      <p class="truncate text-2xs text-ink-gray-5">
        {{ extension }} · {{ formatFileSize(file.file_size) }}
      </p>
    </div>
  </a>
</template>

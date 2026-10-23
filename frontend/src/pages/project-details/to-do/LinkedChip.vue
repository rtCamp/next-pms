<script setup lang="ts">
import { useRouter } from "vue-router";
import { Button } from "frappe-ui";
import { LINKED_RECORD_ICON } from "./constants";
import { linkedRecordQuery } from "./todos";
import type { LinkedRecord } from "./types";

const props = defineProps<{ record: LinkedRecord }>();

const router = useRouter();

function open() {
  router.push({ query: linkedRecordQuery(props.record) });
}
</script>

<template>
  <Button
    variant="ghost"
    size="sm"
    class="min-w-0 max-w-64 text-sm text-ink-gray-5 hover:text-ink-gray-7"
    :aria-label="`Open ${record.type.toLowerCase()} ${record.title}`"
    @click="open"
  >
    <span class="flex min-w-0 items-center gap-1.5">
      <span
        class="size-3.5 shrink-0"
        :class="LINKED_RECORD_ICON[record.type]"
        aria-hidden="true"
      />
      <span class="min-w-0 truncate">{{ record.title }}</span>
    </span>
  </Button>
</template>

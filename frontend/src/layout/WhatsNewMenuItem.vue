<script setup lang="ts">
import { ItemListRow } from "frappe-ui";
import UnreadDot from "./UnreadDot.vue";

defineProps<{ unseen: boolean }>();
</script>

<template>
  <!-- The menu renders this row as its item (as-child) and gives it the menuitem role and focus. -->
  <ItemListRow
    :aria-label="unseen ? 'What\'s new, new release' : undefined"
    class="cursor-pointer outline-none focus:bg-surface-alpha-gray-2 data-[highlighted]:bg-surface-alpha-gray-2"
  >
    <template #prefix>
      <span
        aria-hidden="true"
        class="lucide-sparkles size-4 shrink-0 text-ink-gray-6"
      />
    </template>
    <template #label>
      <div class="truncate leading-tighter text-ink-gray-7">What's new</div>
    </template>
    <template v-if="unseen" #suffix>
      <UnreadDot placement="menuItem" />
    </template>
  </ItemListRow>
</template>

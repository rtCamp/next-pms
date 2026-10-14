<script setup lang="ts">
import { computed } from "vue";
import { DOCTYPE_ICONS, FALLBACK_ICON, MENTION_ICON } from "./constants";
import type { NotificationEntry } from "./types";

const props = defineProps<{ notification: NotificationEntry }>();

const emit = defineEmits<{ select: [notification: NotificationEntry] }>();

const icon = computed(() => {
  const { title, linkedDoctype } = props.notification;
  if (title?.toLowerCase().includes("mention")) return MENTION_ICON;
  return DOCTYPE_ICONS[linkedDoctype] ?? FALLBACK_ICON;
});

// A modified or middle click keeps the browser's default (new tab or window),
// a plain click is left to the listener, which navigates in-app.
function onClick(event: MouseEvent) {
  const opensElsewhere =
    event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0;
  if (!opensElsewhere) event.preventDefault();
  emit("select", props.notification);
}
</script>

<template>
  <component
    :is="notification.href ? 'a' : 'button'"
    :href="notification.href"
    :type="notification.href ? undefined : 'button'"
    class="group flex w-full cursor-pointer items-start gap-2.5 rounded-5 p-2.5 text-left hover:bg-surface-gray-2 focus-visible:outline-none focus-visible:focus-ring"
    @click="onClick"
  >
    <span
      class="mt-2.5 size-2 shrink-0 rounded-full"
      :class="notification.read ? 'bg-transparent' : 'bg-surface-blue-7'"
      aria-hidden="true"
    />
    <span
      class="flex size-8 shrink-0 items-center justify-center rounded-6 bg-surface-gray-2 text-ink-gray-7"
      aria-hidden="true"
    >
      <span :class="icon" class="size-4.5" />
    </span>
    <span class="flex min-w-0 flex-col gap-1">
      <span class="flex items-baseline justify-between gap-2">
        <span
          v-if="notification.title"
          class="truncate text-sm font-medium text-ink-gray-7"
        >
          {{ notification.title }}
        </span>
        <span class="shrink-0 text-xs text-ink-gray-5">
          {{ notification.timeLabel }}
        </span>
      </span>
      <span class="text-sm leading-normal text-ink-gray-6">
        <template v-for="(segment, index) in notification.message" :key="index">
          <strong
            v-if="segment.emphasis === 'strong'"
            class="font-bold text-ink-gray-7"
            >{{ segment.text }}</strong
          ><span
            v-else-if="segment.emphasis === 'subject'"
            class="font-medium text-ink-gray-7"
            >{{ segment.text }}</span
          ><span v-else>{{ segment.text }}</span>
        </template>
      </span>
    </span>
  </component>
</template>

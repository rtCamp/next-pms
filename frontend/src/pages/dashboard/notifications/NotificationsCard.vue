<script setup lang="ts">
import { computed } from "vue";
import { Button } from "frappe-ui";
import {
  notificationIcon,
  type NotificationEntry,
} from "@/components/NotificationTray";
import { useNotifications } from "@/composables/useNotifications";

defineOptions({ inheritAttrs: false });

const { notifications, loading, trayOpen, markAsViewed, openNotification } =
  useNotifications();

const unread = computed(() => notifications.value.filter((n) => !n.read));

// A modified or middle click opens the link elsewhere and only marks it viewed.
function onClick(event: MouseEvent, notification: NotificationEntry) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
    markAsViewed(notification.id);
    return;
  }
  event.preventDefault();
  openNotification(notification);
}
</script>

<template>
  <div class="flex items-baseline justify-between gap-4">
    <h3 class="text-lg-semibold text-ink-gray-8">Notifications</h3>
    <Button variant="ghost" label="See all" @click="trayOpen = true" />
  </div>
  <p
    v-if="!loading && !notifications.length"
    class="py-10 text-center text-base text-ink-gray-4"
  >
    No notifications yet.
  </p>
  <ul v-else class="flex flex-col overflow-y-auto">
    <li v-for="(item, index) in unread" :key="item.id">
      <div v-if="index > 0" class="my-3 border-t border-outline-gray-1" />
      <a
        :href="item.href"
        class="flex cursor-pointer items-start gap-2"
        @click="onClick($event, item)"
      >
        <span
          class="flex size-8 shrink-0 items-center justify-center rounded-6 bg-surface-gray-2"
          aria-hidden="true"
        >
          <span :class="notificationIcon(item)" class="size-4.5" />
        </span>
        <span class="flex w-full min-w-0 flex-col gap-1">
          <span class="flex items-baseline justify-between gap-2">
            <span
              v-if="item.title"
              class="truncate text-base-medium text-ink-gray-7"
            >
              {{ item.title }}
            </span>
            <span class="shrink-0 text-xs text-ink-gray-5">
              {{ item.timeLabel }}
            </span>
          </span>
          <span class="text-p-sm text-ink-gray-6">
            {{ item.message.map((segment) => segment.text).join("") }}
          </span>
        </span>
      </a>
    </li>
  </ul>
</template>

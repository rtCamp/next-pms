<script setup lang="ts">
import { computed } from "vue";
import { Button, ScrollArea, Tooltip } from "frappe-ui";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui";
import NotificationItem from "./NotificationItem.vue";
import type { NotificationEntry, NotificationTrayProps } from "./types";

const props = withDefaults(defineProps<NotificationTrayProps>(), {
  open: false,
  offsetClass: "left-0",
});

const emit = defineEmits<{
  "update:open": [open: boolean];
  markAllRead: [];
  notificationClick: [notification: NotificationEntry];
}>();

// Focusing the first button would open its "Mark all as read" tooltip on every open.
function focusPanel(event: Event) {
  event.preventDefault();
  (event.target as HTMLElement | null)?.focus();
}

const unread = computed(() => props.notifications.filter((n) => !n.read));

const fade = {
  enterActiveClass: "transition-opacity duration-200 ease-out",
  enterFromClass: "opacity-0",
  leaveActiveClass: "transition-opacity duration-200 ease-in",
  leaveToClass: "opacity-0",
};
</script>

<!--
  Built on reka-ui's Dialog primitives (what frappe-ui Dialog wraps) because frappe-ui
  Dialog always centres its card and covers the whole viewport; the tray is a full-height
  panel docked to the sidebar's right edge.
-->
<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <Transition v-bind="fade">
        <DialogOverlay
          class="fixed inset-y-0 right-0 z-40 bg-black-overlay-200 dark:bg-black-overlay-700"
          :class="offsetClass"
        />
      </Transition>
      <Transition v-bind="fade">
        <DialogContent
          class="fixed inset-y-0 z-50 flex w-90 flex-col bg-surface-elevation-2 shadow-xl outline-none"
          :class="offsetClass"
          @open-auto-focus="focusPanel"
        >
          <div class="flex items-center justify-between gap-2 px-4 pb-2 pt-4">
            <DialogTitle class="text-sm font-medium text-ink-gray-8">
              Notifications
            </DialogTitle>
            <DialogDescription class="sr-only">
              Your unread notifications
            </DialogDescription>
            <div class="flex items-center gap-0.5">
              <Tooltip text="Mark all as read">
                <Button
                  variant="ghost"
                  icon="lucide-check-check"
                  label="Mark all as read"
                  @click="emit('markAllRead')"
                />
              </Tooltip>
              <DialogClose as-child>
                <Button
                  variant="ghost"
                  icon="lucide-x"
                  label="Close notifications tray"
                />
              </DialogClose>
            </div>
          </div>

          <ScrollArea class="min-h-0 flex-1">
            <p
              v-if="!unread.length"
              class="px-4 py-10 text-center text-sm text-ink-gray-4"
            >
              {{
                notifications.length
                  ? "No unread notifications."
                  : "No notifications yet."
              }}
            </p>
            <ul
              v-else
              class="flex flex-col p-2"
              aria-label="Unread notifications"
            >
              <li v-for="notification in unread" :key="notification.id">
                <NotificationItem
                  :notification="notification"
                  @select="emit('notificationClick', $event)"
                />
              </li>
            </ul>
          </ScrollArea>
        </DialogContent>
      </Transition>
    </DialogPortal>
  </DialogRoot>
</template>

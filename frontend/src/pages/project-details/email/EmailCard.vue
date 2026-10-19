<script setup lang="ts">
import { computed, ref } from "vue";
import { Avatar, Badge } from "frappe-ui";
import { formatRelativeTimeShort, stripTags } from "@/utils/text";
import { cn } from "@/utils/cn";
import EmailBody from "./EmailBody.vue";
import type { Email } from "./types";
import { attachmentName, formatEmailDate } from "./utils";

const props = defineProps<{
  email: Email;
  defaultExpanded?: boolean;
  isLast?: boolean;
}>();

const expanded = ref(props.defaultExpanded ?? false);

const displayDate = computed(() => formatEmailDate(props.email.sentAt));
const relativeDate = computed(() =>
  formatRelativeTimeShort(props.email.sentAt, new Date(), true),
);
const preview = computed(() => stripTags(props.email.body));
</script>

<template>
  <div v-if="!expanded" class="mt-px pb-5">
    <button
      type="button"
      aria-expanded="false"
      class="flex w-full cursor-pointer items-center gap-3 rounded-5 bg-surface-elevation-1 px-3 py-2.5 text-left shadow"
      @click="expanded = true"
    >
      <Avatar
        class="shrink-0"
        size="xl"
        shape="circle"
        :label="email.sender.name"
        :image="email.sender.image"
      />
      <div class="min-w-0 flex-1">
        <div class="mb-2 flex items-center justify-between gap-2">
          <div class="flex min-w-0 items-center gap-2 truncate">
            <span class="shrink-0 text-base-medium text-ink-gray-9">
              {{ email.sender.name }}
            </span>
            <span class="hidden truncate text-sm text-ink-gray-5 sm:block">
              &lt;{{ email.sender.email }}&gt;
            </span>
          </div>
          <div class="flex shrink-0 items-center gap-1.5">
            <Badge
              v-if="email.status === 'Sent'"
              theme="green"
              variant="subtle"
              size="sm"
              label="Sent"
            />
            <span class="text-sm text-ink-gray-5">{{ displayDate }}</span>
          </div>
        </div>
        <p class="mt-0.5 truncate text-sm text-ink-gray-5">{{ preview }}</p>
      </div>
    </button>
  </div>

  <div v-else class="flex gap-2 sm:gap-4">
    <div
      :class="
        cn(
          'relative z-0 flex w-7.5 shrink-0 justify-center before:absolute before:left-1/2 before:top-0 before:-z-10 before:border-l before:border-outline-elevation-2',
          isLast ? 'before:h-9' : 'before:h-full',
        )
      "
    >
      <div
        class="mt-2.5 flex size-7 items-center justify-center bg-surface-base"
      >
        <Avatar
          size="md"
          shape="circle"
          :label="email.sender.name"
          :image="email.sender.image"
        />
      </div>
    </div>

    <div class="mt-px min-w-0 flex-1 pb-5">
      <div
        class="flex flex-col rounded-5 bg-surface-elevation-1 px-3 py-1.5 text-base shadow"
      >
        <button
          type="button"
          aria-expanded="true"
          class="flex w-full cursor-pointer flex-col gap-1 py-2 text-left"
          @click="expanded = false"
        >
          <div class="flex w-full items-center justify-between gap-2">
            <div class="flex items-center gap-2 truncate text-ink-gray-8">
              <span>{{ email.sender.name }}</span>
              <span class="hidden text-sm text-ink-gray-5 sm:flex">
                &lt;{{ email.sender.email }}&gt;
              </span>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <Badge
                v-if="email.status === 'Sent'"
                theme="green"
                variant="subtle"
                size="sm"
                label="Sent"
              />
              <span class="text-sm text-ink-gray-5">{{ relativeDate }}</span>
            </div>
          </div>
          <div class="flex flex-col gap-1 text-base leading-5 text-ink-gray-8">
            <div>{{ email.subject }}</div>
            <div>
              <span class="mr-1 text-ink-gray-5">To:</span>
              <span>{{ email.to.join(", ") }}</span>
              <template v-if="email.cc.length">
                <span class="ml-2 mr-1 text-ink-gray-5">CC:</span>
                <span>{{ email.cc.join(", ") }}</span>
              </template>
              <template v-if="email.bcc.length">
                <span class="ml-2 mr-1 text-ink-gray-5">BCC:</span>
                <span>{{ email.bcc.join(", ") }}</span>
              </template>
            </div>
          </div>
        </button>

        <div class="my-1 border-t border-outline-elevation-2" />
        <EmailBody :html="email.body" />
        <div
          v-if="email.attachments.length"
          class="mb-1 mt-2 flex flex-wrap gap-2"
        >
          <a
            v-for="attachment in email.attachments"
            :key="attachment.file_url"
            :href="attachment.file_url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1.5 rounded-4 border border-outline-gray-2 px-2 py-1 text-sm text-ink-gray-7 transition-colors hover:bg-surface-gray-2"
          >
            <span
              class="lucide-file size-3.5 shrink-0 text-ink-gray-5"
              aria-hidden="true"
            />
            <span class="max-w-48 truncate">
              {{ attachmentName(attachment.file_url) }}
            </span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

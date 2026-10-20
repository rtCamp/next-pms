<script setup lang="ts">
import { computed } from "vue";
import { Avatar, HoverCard } from "frappe-ui";
import { HOVER_CLOSE_DELAY, HOVER_OPEN_DELAY } from "./constants";
import type { AboutCustomer } from "./types";

const props = defineProps<{ customer: AboutCustomer }>();

const href = computed(
  () => `/desk/contact/${encodeURIComponent(props.customer.contactId)}`,
);

const details = computed(() =>
  [
    { icon: "lucide-building-2", value: props.customer.company },
    { icon: "lucide-mail", value: props.customer.email },
    { icon: "lucide-phone", value: props.customer.phone },
    { icon: "lucide-link", value: props.customer.linkedin },
  ].filter((row) => row.value),
);
</script>

<template>
  <HoverCard
    side="left"
    align="start"
    :offset="8"
    :hover-delay="HOVER_OPEN_DELAY"
    :leave-delay="HOVER_CLOSE_DELAY"
  >
    <template #trigger>
      <div class="flex items-center gap-3 py-1.5">
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <Avatar size="sm" :label="customer.name" :image="customer.image" />
          <span
            class="flex-1 truncate text-base-medium leading-tighter text-ink-gray-7"
          >
            {{ customer.name }}
          </span>
        </div>
        <a
          :href="href"
          target="_blank"
          rel="noreferrer noopener"
          :aria-label="`Open ${customer.name}`"
          class="text-ink-gray-7 hover:text-ink-gray-8"
        >
          <span class="lucide-arrow-up-right size-4" aria-hidden="true" />
        </a>
      </div>
    </template>
    <div class="flex w-64 flex-col gap-3 p-3">
      <div class="flex items-center justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2">
          <Avatar
            size="xl"
            shape="circle"
            :image="customer.image"
            :label="customer.name"
          />
          <div class="flex min-w-0 flex-col gap-1">
            <span
              class="truncate text-base-medium leading-tighter text-ink-gray-7"
            >
              {{ customer.name }}
            </span>
            <span
              v-if="customer.designation"
              class="truncate text-sm leading-tighter text-ink-gray-6"
            >
              {{ customer.designation }}
            </span>
          </div>
        </div>
        <a
          :href="href"
          target="_blank"
          rel="noreferrer"
          :aria-label="`Open ${customer.name}`"
          class="shrink-0 text-ink-gray-6 hover:text-ink-gray-8"
        >
          <span class="lucide-chevron-right size-4" aria-hidden="true" />
        </a>
      </div>
      <template v-if="details.length">
        <div class="border-t border-outline-gray-1" />
        <div class="flex flex-col gap-2.5">
          <div
            v-for="row in details"
            :key="row.icon"
            class="flex items-center gap-2"
          >
            <span
              :class="[row.icon, 'size-4 shrink-0 text-ink-gray-5']"
              aria-hidden="true"
            />
            <span class="truncate text-sm leading-tighter text-ink-gray-6">
              {{ row.value }}
            </span>
          </div>
        </div>
      </template>
    </div>
  </HoverCard>
</template>

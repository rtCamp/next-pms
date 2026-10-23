<script setup lang="ts">
import { computed } from "vue";
import { Avatar, HoverCard } from "frappe-ui";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { formatCurrency, formatNumber } from "@/utils/format";
import { HOVER_CLOSE_DELAY, HOVER_OPEN_DELAY } from "./constants";
import type { AboutMember } from "./types";

const props = defineProps<{ member?: AboutMember }>();
defineSlots<{ default: () => unknown }>();

const { doc } = useProjectDetails();

const details = computed(() => {
  const member = props.member;
  if (!member) return [];
  return [
    { icon: "lucide-users", value: member.department },
    {
      icon: "lucide-banknote",
      value:
        member.rate === undefined
          ? undefined
          : `${formatCurrency(member.rate, doc.value?.custom_currency)}/hour`,
    },
    {
      icon: "lucide-clock",
      value:
        member.loggedHours === undefined
          ? undefined
          : `${formatNumber(member.loggedHours)}/${formatNumber(member.totalHoursPurchased)}h`,
    },
    { icon: "lucide-mail", value: member.email },
    { icon: "lucide-phone", value: member.phone },
    { icon: "lucide-link", value: member.linkedin },
  ].filter((row) => row.value);
});
</script>

<template>
  <HoverCard
    v-if="member"
    side="left"
    align="start"
    :offset="8"
    :hover-delay="HOVER_OPEN_DELAY"
    :leave-delay="HOVER_CLOSE_DELAY"
  >
    <template #trigger>
      <slot />
    </template>
    <div class="flex w-64 flex-col gap-3 p-3">
      <div class="flex items-start justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2">
          <Avatar
            size="xl"
            shape="circle"
            :image="member.image"
            :label="member.name"
          />
          <div class="flex min-w-0 flex-col gap-1">
            <span
              class="truncate text-base-medium leading-tighter text-ink-gray-7"
            >
              {{ member.name }}
            </span>
            <span
              v-if="member.designation"
              class="truncate text-sm leading-tighter text-ink-gray-6"
            >
              {{ member.designation }}
            </span>
          </div>
        </div>
        <a
          :href="`/desk/user/${encodeURIComponent(member.userId)}`"
          target="_blank"
          rel="noreferrer"
          :aria-label="`Open ${member.name}`"
          class="shrink-0 text-ink-gray-6 hover:text-ink-gray-8"
        >
          <span class="lucide-chevron-right size-4" aria-hidden="true" />
        </a>
      </div>
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
    </div>
  </HoverCard>
  <slot v-else />
</template>

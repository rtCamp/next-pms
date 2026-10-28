<script setup lang="ts">
import { Avatar } from "frappe-ui";
import MemberHoverCard from "./MemberHoverCard.vue";
import type { AboutMember } from "./types";

defineProps<{ member: AboutMember }>();
</script>

<template>
  <MemberHoverCard :member="member">
    <div
      class="flex cursor-pointer flex-wrap items-center gap-2 py-1.5 text-base leading-tighter"
    >
      <Avatar size="sm" :label="member.name" :image="member.image" />
      <span class="font-medium text-ink-gray-7">{{ member.name }}</span>
      <span class="flex-1 truncate text-ink-gray-5">
        {{ member.designation }}
      </span>
    </div>
  </MemberHoverCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Button } from "frappe-ui";
import FollowersBadge from "@/pages/project-details/shared/FollowersBadge.vue";
import OwnerPill from "@/pages/project-details/shared/OwnerPill.vue";
import { toPerson } from "@/pages/project-details/shared/permissions";
import { isPriorityLevel } from "@/pages/project-details/shared/priority";
import type { Person, UserDetails } from "@/pages/project-details/shared/types";
import GrowthActions from "./GrowthActions.vue";
import GrowthPriorityPill from "./GrowthPriorityPill.vue";
import GrowthStatusBadge from "./GrowthStatusBadge.vue";
import type { GrowthDoc } from "./types";
import { useGrowth } from "./useGrowth";

const props = defineProps<{
  initiative: GrowthDoc;
  users: ReadonlyMap<string, UserDetails>;
  followers: Person[];
  following: boolean;
}>();

defineEmits<{ toggleFollow: [] }>();

const { closeGrowth } = useGrowth();

function person(userId: string | null) {
  return userId ? toPerson(userId, props.users.get(userId)) : null;
}
const activityOwner = computed(() => person(props.initiative.activity_owner));
const ideationOwner = computed(() => person(props.initiative.ideation_owner));
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-y-2">
    <div class="flex min-w-0 items-center gap-2">
      <Button
        variant="ghost"
        icon="lucide-arrow-left"
        label="Back to growth initiatives"
        @click="closeGrowth()"
      />
      <h2
        class="max-w-125 truncate text-2xl-semibold leading-tighter text-ink-gray-7"
      >
        {{ initiative.activity }}
      </h2>
    </div>
    <div class="flex flex-wrap items-center gap-1 text-sm text-ink-gray-7">
      <GrowthPriorityPill
        v-if="isPriorityLevel(initiative.client_priority)"
        :priority="initiative.client_priority"
      />
      <OwnerPill :person="activityOwner" title="Activity owner" />
      <OwnerPill :person="ideationOwner" title="Ideation owner" />
      <span class="rounded-full bg-surface-gray-2 px-2 py-1">
        <GrowthStatusBadge :status="initiative.status" />
      </span>
      <span
        v-if="initiative.closed_status"
        class="rounded-full bg-surface-gray-2 px-2 py-1"
      >
        {{ initiative.closed_status }}
      </span>
      <FollowersBadge :followers="followers" />
      <GrowthActions
        :growth="initiative"
        show-follow
        :following="following"
        @toggle-follow="$emit('toggleFollow')"
      />
    </div>
  </div>
</template>

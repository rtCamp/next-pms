<script setup lang="ts">
import { Avatar } from "frappe-ui";
import GroupList from "@/pages/project-details/shared/GroupList.vue";
import GrowthActions from "./GrowthActions.vue";
import GrowthPriorityPill from "./GrowthPriorityPill.vue";
import GrowthStatusBadge from "./GrowthStatusBadge.vue";
import { lastUpdatedText } from "./growth";
import { useGrowth } from "./useGrowth";

const { groups, openGrowth } = useGrowth();
</script>

<template>
  <GroupList
    :groups="groups"
    empty-text="No growth initiatives found"
    :row-label="(growth) => `Open ${growth.activity}`"
    @open="(growth) => openGrowth(growth.name)"
  >
    <template #cell="{ row: growth, column }">
      <span
        v-if="column.key === 'activity'"
        class="truncate font-medium text-ink-gray-8"
      >
        {{ growth.activity }}
      </span>
      <GrowthPriorityPill
        v-else-if="column.key === 'client_priority'"
        :priority="growth.client_priority"
      />
      <GrowthStatusBadge
        v-else-if="column.key === 'status'"
        :status="growth.status"
      />
      <span
        v-else-if="column.key === 'activity_owner' && growth.ownerPerson"
        class="flex min-w-0 items-center gap-2"
      >
        <Avatar
          size="xs"
          shape="circle"
          :image="growth.ownerPerson.image"
          :label="growth.ownerPerson.label"
        />
        <span class="truncate">{{ growth.ownerPerson.label }}</span>
      </span>
      <span v-else-if="column.key === 'modified'" class="truncate">
        {{ lastUpdatedText(growth.modified) }}
      </span>
      <span v-else-if="column.key === 'category'" class="truncate">
        {{ growth.category ?? "—" }}
      </span>
      <span v-else-if="column.key === 'closed_status'" class="truncate">
        {{ growth.closed_status ?? "—" }}
      </span>
      <span v-else>—</span>
    </template>
    <template #actions="{ row: growth }">
      <GrowthActions :growth="growth" />
    </template>
  </GroupList>
</template>

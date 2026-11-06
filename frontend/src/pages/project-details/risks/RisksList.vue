<script setup lang="ts">
import { Avatar } from "frappe-ui";
import GroupList from "@/pages/project-details/shared/GroupList.vue";
import RiskActions from "./RiskActions.vue";
import RiskStatusBadge from "./RiskStatusBadge.vue";
import { riskTitle, summaryText } from "./risks";
import { useRisks } from "./useRisks";

const { groups, openRisk } = useRisks();
</script>

<template>
  <GroupList
    :groups="groups"
    empty-text="No risks found"
    :row-label="(risk) => `Open ${riskTitle(risk)}`"
    @open="(risk) => openRisk(risk.name)"
  >
    <template #cell="{ row: risk, column }">
      <span
        v-if="column.key === 'risk_category'"
        class="truncate font-medium text-ink-gray-8"
      >
        {{ risk.risk_category ?? "—" }}
      </span>
      <span v-else-if="column.key === 'summary'" class="truncate">
        {{ summaryText(risk.summary) }}
      </span>
      <span
        v-else-if="column.key === 'risk_owner' && risk.riskOwnerPerson"
        class="flex min-w-0 items-center gap-2"
      >
        <Avatar
          size="xs"
          shape="circle"
          :image="risk.riskOwnerPerson.image"
          :label="risk.riskOwnerPerson.label"
        />
        <span class="truncate">{{ risk.riskOwnerPerson.label }}</span>
      </span>
      <RiskStatusBadge
        v-else-if="column.key === 'status'"
        :status="risk.status"
      />
      <span v-else-if="column.key === 'risk_level'" class="truncate">
        {{ risk.risk_level ?? "—" }}
      </span>
      <span v-else>—</span>
    </template>
    <template #actions="{ row: risk }">
      <RiskActions :risk="risk" />
    </template>
  </GroupList>
</template>

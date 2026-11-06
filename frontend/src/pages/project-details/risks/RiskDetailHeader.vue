<script setup lang="ts">
import { computed } from "vue";
import { Button, dayjs, Tooltip } from "frappe-ui";
import FollowersBadge from "@/pages/project-details/shared/FollowersBadge.vue";
import OwnerPill from "@/pages/project-details/shared/OwnerPill.vue";
import { toPerson } from "@/pages/project-details/shared/permissions";
import { formatProjectDate } from "@/utils/date";
import type { Person, UserDetails } from "@/pages/project-details/shared/types";
import RiskActions from "./RiskActions.vue";
import RiskLevelPill from "./RiskLevelPill.vue";
import RiskStatusBadge from "./RiskStatusBadge.vue";
import { riskTitle } from "./risks";
import type { RiskDoc } from "./types";
import { useRisks } from "./useRisks";

const props = defineProps<{
  risk: RiskDoc;
  users: ReadonlyMap<string, UserDetails>;
  followers: Person[];
  following: boolean;
}>();

defineEmits<{ toggleFollow: [] }>();

const { closeRisk } = useRisks();

const riskOwner = computed(() =>
  props.risk.risk_owner
    ? toPerson(props.risk.risk_owner, props.users.get(props.risk.risk_owner))
    : null,
);
const owner = computed(() =>
  props.risk.owner
    ? toPerson(props.risk.owner, props.users.get(props.risk.owner))
    : null,
);

const dateChips = computed(() =>
  [
    { label: "Created", value: props.risk.creation },
    { label: "Mitigated", value: props.risk.mitigated_on },
  ].flatMap(({ label, value }) =>
    value
      ? [
          {
            label,
            date: formatProjectDate(value.slice(0, 10)),
            tooltip: `${label} on ${dayjs(value).format("MMM D, YYYY h:mm A")}`,
          },
        ]
      : [],
  ),
);
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-y-2">
    <div class="flex min-w-0 items-center gap-2">
      <Button
        variant="ghost"
        icon="lucide-arrow-left"
        label="Back to risks"
        @click="closeRisk()"
      />
      <h2
        class="max-w-125 truncate text-2xl-semibold leading-tighter text-ink-gray-7"
      >
        {{ riskTitle(risk) }}
      </h2>
    </div>
    <div class="flex flex-wrap items-center gap-1 text-sm text-ink-gray-7">
      <RiskLevelPill :level="risk.risk_level" />
      <OwnerPill :person="riskOwner" title="Risk owner" />
      <OwnerPill :person="owner" title="Owner" />
      <span class="rounded-full bg-surface-gray-2 px-2 py-1">
        <RiskStatusBadge :status="risk.status" />
      </span>
      <Tooltip v-for="chip in dateChips" :key="chip.label" :text="chip.tooltip">
        <span class="rounded-full bg-surface-gray-2 px-2 py-1">
          <span class="text-ink-gray-5">{{ chip.label }}</span>
          {{ chip.date }}
        </span>
      </Tooltip>
      <FollowersBadge :followers="followers" />
      <RiskActions
        :risk="risk"
        show-follow
        :following="following"
        @toggle-follow="$emit('toggleFollow')"
      />
    </div>
  </div>
</template>

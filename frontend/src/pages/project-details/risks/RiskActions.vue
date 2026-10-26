<script setup lang="ts">
import { computed } from "vue";
import { Button, Dropdown } from "frappe-ui";
import { useOwnerGatedPermissions } from "@/pages/project-details/shared/useOwnerGatedPermissions";
import { riskTitle } from "./risks";
import type { RiskRow } from "./types";
import { useRisks } from "./useRisks";

const props = defineProps<{
  risk: Pick<RiskRow, "name" | "risk_category" | "risk_owner">;
  /** Adds Follow / Unfollow, as on the detail. */
  showFollow?: boolean;
  following?: boolean;
}>();

const emit = defineEmits<{ toggleFollow: [] }>();

const { openEdit, requestDelete } = useRisks();
const permissions = useOwnerGatedPermissions(() => props.risk.risk_owner);

const options = computed(() => [
  ...(permissions.value.canEdit
    ? [
        {
          label: "Edit",
          onClick: () => openEdit(props.risk.name),
        },
      ]
    : []),
  ...(permissions.value.canDelete
    ? [
        {
          label: "Delete",
          theme: "red" as const,
          onClick: () => requestDelete(props.risk.name),
        },
      ]
    : []),
  ...(!props.showFollow
    ? []
    : [
        {
          label: props.following ? "Unfollow" : "Follow",
          onClick: () => emit("toggleFollow"),
        },
      ]),
]);
</script>

<template>
  <Dropdown v-if="options.length" :options="options" align="center">
    <Button
      variant="ghost"
      icon="lucide-ellipsis"
      :label="`Actions for ${riskTitle(risk)}`"
    />
  </Dropdown>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Button, Dropdown } from "frappe-ui";
import { useOwnerGatedPermissions } from "@/pages/project-details/shared/useOwnerGatedPermissions";
import type { GrowthRow } from "./types";
import { useGrowth } from "./useGrowth";

const props = defineProps<{
  growth: Pick<GrowthRow, "name" | "activity" | "activity_owner">;
  /** Adds Follow / Unfollow first, as on the detail. */
  showFollow?: boolean;
  following?: boolean;
}>();

const emit = defineEmits<{ toggleFollow: [] }>();

const { openEdit, requestDelete } = useGrowth();
const permissions = useOwnerGatedPermissions(() => props.growth.activity_owner);

const options = computed(() => [
  ...(props.showFollow
    ? [
        {
          label: props.following ? "Unfollow" : "Follow",
          onClick: () => emit("toggleFollow"),
        },
      ]
    : []),
  ...(permissions.value.canEdit
    ? [{ label: "Edit", onClick: () => openEdit(props.growth.name) }]
    : []),
  ...(permissions.value.canDelete
    ? [
        {
          label: "Delete",
          theme: "red" as const,
          onClick: () => requestDelete(props.growth.name),
        },
      ]
    : []),
]);
</script>

<template>
  <Dropdown v-if="options.length" :options="options" align="center">
    <Button
      variant="ghost"
      icon="lucide-ellipsis"
      :label="`Actions for ${growth.activity}`"
    />
  </Dropdown>
</template>

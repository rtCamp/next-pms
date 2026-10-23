<script setup lang="ts">
import { computed } from "vue";
import { Button, PageHeaderBase } from "frappe-ui";
import { useUnsavedChanges } from "@/composables/useUnsavedChanges";
import { ROLE_ACCESS, useSession } from "@/session";
import AllocationsBreadcrumbs from "./AllocationsBreadcrumbs.vue";
import { useAllocationDialogs } from "./useAllocationDialogs";

const session = useSession();
const unsaved = useUnsavedChanges();
const dialogs = useAllocationDialogs();

const canManageAllocations = computed(() =>
  session.hasAnyRole(ROLE_ACCESS.manageAllocations),
);

function addAllocation() {
  unsaved.requestGuardedAction(() => dialogs.openAdd());
}
</script>

<template>
  <PageHeaderBase class="z-10 border-b border-outline-gray-1 bg-surface-base">
    <div class="flex h-14 items-center justify-between gap-2 px-3 py-2">
      <AllocationsBreadcrumbs />
      <Button
        v-if="canManageAllocations"
        variant="solid"
        label="Add allocation"
        icon-left="lucide-plus"
        @click="addAllocation"
      />
    </div>
  </PageHeaderBase>
</template>

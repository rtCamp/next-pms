<script setup lang="ts">
import { ref } from "vue";
import { Badge, Button, Tooltip } from "frappe-ui";
import AddMembersDialog from "./AddMembersDialog.vue";
import ExpandableList from "./ExpandableList.vue";
import ManagerField from "./ManagerField.vue";
import MemberRow from "./MemberRow.vue";
import { useProjectSidebar } from "./useProjectSidebar";

const PROJECT_MANAGER_ROLES = ["Projects Manager"];

const { sidebar, projectManager, engineeringManager, teamMembers } =
  useProjectSidebar();

const addOpen = ref(false);
</script>

<template>
  <!-- eslint-disable better-tailwindcss/no-restricted-classes -- container for ManagerField's 12rem query; no container-query plugin in the preset -->
  <div class="[container-type:inline-size]">
    <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
    <!-- eslint-disable better-tailwindcss/no-restricted-classes -- label column sized to its content, as React; no grid-cols step for auto 1fr -->
    <div
      class="mb-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-4.5 text-base leading-tighter text-ink-gray-5"
    >
      <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
      <ManagerField
        manager-role="project_manager"
        label="Project Manager"
        :manager="projectManager"
        :roles="PROJECT_MANAGER_ROLES"
      />
      <ManagerField
        manager-role="engineering_manager"
        label="Lead Engineer"
        :manager="engineeringManager"
      />
    </div>

    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <h4 class="text-base-medium leading-tighter text-ink-gray-8">
          Team members
        </h4>
        <Tooltip
          v-if="sidebar?.is_shared_with_everyone"
          text="Shared with everyone in the organization"
        >
          <Badge variant="subtle" size="sm" label="Everyone" tabindex="0">
            <template #prefix>
              <span class="lucide-globe size-3.5" aria-hidden="true" />
            </template>
          </Badge>
        </Tooltip>
      </div>
      <Button icon="lucide-plus" label="Add member" @click="addOpen = true" />
    </div>

    <p
      v-if="!teamMembers.length"
      class="py-4 text-center text-sm leading-tighter text-ink-gray-4"
    >
      No Members
    </p>
    <ExpandableList
      v-else
      :items="teamMembers"
      item-label="members"
      :item-key="(member) => member.userId"
    >
      <template #default="{ item }">
        <MemberRow :member="item" />
      </template>
    </ExpandableList>
    <AddMembersDialog v-model:open="addOpen" />
  </div>
</template>

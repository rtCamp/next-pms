<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  Avatar,
  Badge,
  Button,
  Dialog,
  Spinner,
  TextInput,
  Tooltip,
} from "frappe-ui";
import { useEmployeeLookup } from "@/composables/useEmployeeLookup";
import { errorMessage } from "@/utils/errors";
import { removeBlockedReason, roleLabels } from "./sidebar";
import { useProjectSidebar } from "./useProjectSidebar";

const open = defineModel<boolean>("open", { required: true });

const { sidebar, addMember, removeMember, isBusy } = useProjectSidebar();

const query = ref("");
watch(open, (isOpen) => {
  if (!isOpen) query.value = "";
});

const lookup = useEmployeeLookup({ enabled: open, query });

const rows = computed(() => {
  const data = sidebar.value;
  const memberIds = new Set(data?.members.map((member) => member.user));
  return lookup.options.map((option) => {
    const userId = option.userId ?? "";
    return {
      ...option,
      userId,
      isMember: Boolean(userId) && memberIds.has(userId),
      roles: data && userId ? roleLabels(data, userId) : [],
      blockedReason:
        data && userId ? removeBlockedReason(data, userId) : undefined,
      busy: Boolean(userId) && isBusy(`member:${userId}`),
    };
  });
});
</script>

<template>
  <Dialog v-model:open="open" title="Add members" size="lg" position="top">
    <div class="flex flex-col gap-3">
      <TextInput
        v-model="query"
        role="searchbox"
        variant="subtle"
        placeholder="Search members"
        aria-label="Search members"
      >
        <template #prefix>
          <span
            class="lucide-search size-4 text-ink-gray-5"
            aria-hidden="true"
          />
        </template>
      </TextInput>

      <!-- eslint-disable better-tailwindcss/no-restricted-classes -- a thin scrollbar as React's list; no utility for scrollbar-width -->
      <div
        class="h-55 overflow-y-auto rounded-6 border border-outline-gray-2 px-2.5 py-2 [scrollbar-width:thin]"
      >
        <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
        <div
          v-if="lookup.loading && !rows.length"
          class="flex h-full items-center justify-center"
        >
          <Spinner class="size-4" />
        </div>
        <p
          v-else-if="lookup.error"
          role="alert"
          class="py-6 text-center text-base leading-tighter text-ink-red-6"
        >
          {{ errorMessage(lookup.error) }}
        </p>
        <p
          v-else-if="!rows.length"
          class="py-6 text-center text-base leading-tighter text-ink-gray-5"
        >
          No matching employees
        </p>
        <ul
          v-else
          class="flex flex-col divide-y divide-outline-gray-1 pb-2"
          aria-label="Employees"
        >
          <li
            v-for="row in rows"
            :key="row.value"
            class="flex items-center gap-1 py-2 first:pt-0 last:pb-0"
          >
            <div class="flex min-w-0 flex-1 items-center gap-2">
              <Avatar size="sm" :label="row.label" :image="row.image" />
              <div class="flex min-w-0 flex-1 flex-col">
                <span
                  class="truncate text-base-medium leading-tighter text-ink-gray-7"
                >
                  {{ row.label }}
                </span>
                <span class="truncate text-sm text-ink-gray-5">
                  {{ row.value }}
                </span>
              </div>
            </div>
            <Badge
              v-for="role in row.roles"
              :key="role"
              size="sm"
              variant="subtle"
              theme="gray"
              :label="role"
            />
            <template v-if="row.isMember">
              <Tooltip v-if="row.blockedReason" :text="row.blockedReason">
                <!-- eslint-disable-next-line vuejs-accessibility/no-noninteractive-tabindex -- the disabled button can't take focus; its wrapper shows why -->
                <span tabindex="0">
                  <Button
                    variant="subtle"
                    theme="red"
                    label="Remove"
                    disabled
                  />
                </span>
              </Tooltip>
              <Button
                v-else
                variant="subtle"
                theme="red"
                label="Remove"
                :loading="row.busy"
                @click="removeMember(row.userId)"
              />
            </template>
            <Button
              v-else
              variant="subtle"
              theme="gray"
              label="Add"
              :loading="row.busy"
              :disabled="!row.userId"
              @click="addMember(row.userId)"
            />
          </li>
        </ul>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { Dropdown, type SidebarHeaderProps } from "frappe-ui";

defineProps<{
  title: string;
  subtitle?: string;
  logo: string;
  menuItems: NonNullable<SidebarHeaderProps["menuItems"]>;
  collapsed: boolean;
}>();
</script>

<template>
  <div data-slot="sidebar-header" class="shrink-0 p-2">
    <Dropdown :options="menuItems" match-trigger-width>
      <template #default="{ open }">
        <button
          type="button"
          class="flex h-12 w-full items-center rounded-4 duration-300 ease-in-out"
          :class="
            collapsed
              ? 'px-0'
              : open
                ? 'bg-surface-elevation-2 px-2 shadow-sm'
                : 'px-2 hover:bg-surface-gray-3'
          "
        >
          <img
            :src="logo"
            alt=""
            class="size-8 shrink-0 rounded-6 object-cover"
          />
          <div
            class="flex flex-1 flex-col truncate text-left duration-300 ease-in-out"
            :class="
              collapsed
                ? 'ml-0 w-0 overflow-hidden opacity-0'
                : 'ml-2 w-auto opacity-100'
            "
          >
            <div class="truncate text-base-medium leading-none text-ink-gray-8">
              {{ title }}
            </div>
            <div class="mt-1 truncate text-sm leading-none text-ink-gray-6">
              {{ subtitle }}
            </div>
          </div>
          <span
            v-if="!collapsed"
            aria-hidden="true"
            class="lucide-chevron-down ml-2 size-4 shrink-0 text-ink-gray-7"
          />
        </button>
      </template>
    </Dropdown>
  </div>
</template>

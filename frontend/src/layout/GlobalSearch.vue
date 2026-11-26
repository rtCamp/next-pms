<script setup lang="ts">
import { KeyboardShortcut } from "frappe-ui";
import {
  CommandPalette,
  CommandPaletteEmpty,
  CommandPaletteFooter,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
} from "frappe-ui/experimental";
import { useRouter } from "vue-router";
import type { SearchItem } from "./sidebarSections";

defineProps<{ items: SearchItem[] }>();

const open = defineModel<boolean>("open", { default: false });

const router = useRouter();
</script>

<template>
  <CommandPalette
    v-model:open="open"
    title="Search"
    @select="(to) => router.push(String(to))"
  >
    <CommandPaletteInput placeholder="Search or type a command" />
    <CommandPaletteList>
      <CommandPaletteItem v-for="item in items" :key="item.to" :value="item.to">
        {{ item.label }}
      </CommandPaletteItem>
    </CommandPaletteList>
    <CommandPaletteEmpty>No results found.</CommandPaletteEmpty>
    <CommandPaletteFooter>
      <span class="flex items-center gap-1.5">
        <KeyboardShortcut combo="ArrowUp" bg />
        <KeyboardShortcut combo="ArrowDown" bg />
        to navigate
      </span>
      <span class="flex items-center gap-1.5">
        <KeyboardShortcut combo="Enter" bg />
        to select
      </span>
      <span class="flex items-center gap-1.5">
        <KeyboardShortcut combo="Escape" bg />
        to close
      </span>
    </CommandPaletteFooter>
  </CommandPalette>
</template>

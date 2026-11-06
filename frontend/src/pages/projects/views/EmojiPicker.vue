<script setup lang="ts">
import { Popover } from "frappe-ui";
import { PRESET_EMOJIS } from "./constants";

const emoji = defineModel<string>({ required: true });
</script>

<template>
  <Popover side="bottom" align="start">
    <template #trigger>
      <button
        type="button"
        :aria-label="`View icon: ${emoji}`"
        class="flex size-8 shrink-0 items-center justify-center rounded-4 border border-outline-gray-2 text-lg hover:bg-surface-gray-2"
      >
        {{ emoji }}
      </button>
    </template>
    <template #default="{ close }">
      <div
        class="grid grid-cols-6 gap-1 p-2"
        role="listbox"
        aria-label="View icons"
      >
        <button
          v-for="preset in PRESET_EMOJIS"
          :key="preset"
          type="button"
          role="option"
          :aria-selected="preset === emoji"
          class="flex size-8 items-center justify-center rounded-4 text-lg hover:bg-surface-gray-2"
          @click="
            emoji = preset;
            close();
          "
        >
          {{ preset }}
        </button>
      </div>
    </template>
  </Popover>
</template>

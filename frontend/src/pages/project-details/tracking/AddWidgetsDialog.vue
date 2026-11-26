<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Button, Dialog } from "frappe-ui";
import { CUSTOMIZABLE_WIDGETS } from "./constants";
import type { WidgetKey } from "./types";

const props = defineProps<{ hidden: WidgetKey[]; saving: boolean }>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ save: [hidden: WidgetKey[]] }>();

const staged = ref<WidgetKey[]>([]);

watch(open, (isOpen) => {
  if (isOpen) staged.value = [...props.hidden];
});

const dirty = computed(
  () =>
    staged.value.length !== props.hidden.length ||
    staged.value.some((key) => !props.hidden.includes(key)),
);

function show(key: WidgetKey) {
  staged.value = staged.value.filter((item) => item !== key);
}

function hide(key: WidgetKey) {
  staged.value = [...staged.value, key];
}
</script>

<template>
  <Dialog
    v-model:open="open"
    title="Add widgets"
    size="sm"
    position="top"
    :dismissible="!saving"
  >
    <ul
      class="flex flex-col gap-2 rounded-6 border border-outline-gray-2 px-2.5 py-2"
    >
      <template
        v-for="({ key, label }, index) in CUSTOMIZABLE_WIDGETS"
        :key="key"
      >
        <li
          v-if="index > 0"
          aria-hidden="true"
          class="w-full border-t border-outline-gray-1"
        />
        <li class="flex items-center gap-2">
          <span
            class="min-w-0 flex-1 truncate text-base-medium text-ink-gray-7"
          >
            {{ label }}
          </span>
          <Button
            v-if="staged.includes(key)"
            variant="subtle"
            theme="gray"
            :aria-label="`Add ${label}`"
            @click="show(key)"
          >
            Add
          </Button>
          <Button
            v-else
            variant="subtle"
            theme="red"
            :aria-label="`Remove ${label}`"
            @click="hide(key)"
          >
            Remove
          </Button>
        </li>
      </template>
    </ul>

    <template #actions>
      <div class="flex w-full items-center justify-end gap-2">
        <Button
          variant="ghost"
          label="Cancel"
          :disabled="saving"
          @click="open = false"
        />
        <Button
          variant="solid"
          label="Save"
          :disabled="!dirty || saving"
          :loading="saving"
          @click="emit('save', staged)"
        />
      </div>
    </template>
  </Dialog>
</template>

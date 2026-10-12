<script setup lang="ts">
import { computed } from "vue";
import { Button, Popover } from "frappe-ui";
import type { SortSelectorProps, SortState } from "./types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<SortSelectorProps>(), {
  modelValue: null,
});

const emit = defineEmits<{ "update:modelValue": [value: SortState | null] }>();

const activeLabel = computed(
  () =>
    props.fields.find((f) => f.field === props.modelValue?.field)?.label ?? "",
);

function toggle(field: string) {
  const current = props.modelValue;
  emit(
    "update:modelValue",
    current?.field === field
      ? { field, order: current.order === "asc" ? "desc" : "asc" }
      : { field, order: "desc" },
  );
}

function orderOf(field: string) {
  return props.modelValue?.field === field ? props.modelValue.order : null;
}

function clear(close: () => void) {
  emit("update:modelValue", null);
  close();
}
</script>

<template>
  <Popover side="bottom" align="end">
    <template #trigger>
      <Button v-bind="$attrs" icon-left="lucide-arrow-up-down">
        Sort
        <span v-if="activeLabel" class="text-xs text-ink-gray-5">
          {{ activeLabel }}
        </span>
      </Button>
    </template>

    <template #default="{ close }">
      <div class="flex min-w-44 flex-col p-1">
        <Button
          v-for="{ field, label, disabled, tooltipText } in fields"
          :key="field"
          variant="ghost"
          class="w-full !justify-between"
          :class="{ '!cursor-not-allowed !text-ink-gray-5': disabled }"
          :tooltip="tooltipText"
          :aria-disabled="disabled || undefined"
          :aria-pressed="orderOf(field) !== null"
          @click="!disabled && toggle(field)"
        >
          {{ label }}
          <template v-if="orderOf(field)" #suffix>
            <span
              class="size-4"
              :class="
                orderOf(field) === 'asc'
                  ? 'lucide-arrow-up'
                  : 'lucide-arrow-down'
              "
              aria-hidden="true"
            />
            <span class="sr-only">
              {{ orderOf(field) === "asc" ? "ascending" : "descending" }}
            </span>
          </template>
        </Button>

        <template v-if="modelValue">
          <hr class="my-1 border-outline-gray-2" />
          <Button
            variant="ghost"
            theme="red"
            class="w-full !justify-start"
            label="Clear sort"
            @click="clear(close)"
          />
        </template>
      </div>
    </template>
  </Popover>
</template>

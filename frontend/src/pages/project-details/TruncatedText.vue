<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { Tooltip } from "frappe-ui";

defineOptions({ inheritAttrs: false });
defineProps<{ text: string }>();

const label = useTemplateRef("label");
const truncated = ref(false);

// The tooltip only adds something when the text is cut off.
function measure() {
  const element = label.value;
  truncated.value = Boolean(
    element && element.scrollWidth > element.clientWidth,
  );
}
</script>

<template>
  <Tooltip :text="text" :disabled="!truncated">
    <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions, vuejs-accessibility/mouse-events-have-key-events -- hover only measures for the tooltip -->
    <span ref="label" v-bind="$attrs" class="truncate" @mouseenter="measure">
      {{ text }}
    </span>
  </Tooltip>
</template>

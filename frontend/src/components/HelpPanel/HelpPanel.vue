<script setup lang="ts">
import { computed, normalizeClass, useAttrs } from "vue";
import { Button } from "frappe-ui";
import {
  AccordionRoot,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui";
import { cn } from "@/utils/cn";
import HelpTipList from "./HelpTipList.vue";
import type { HelpPanelProps } from "./types";
import { visibleTips } from "./utils";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<HelpPanelProps>(), { open: false });

const emit = defineEmits<{
  "update:open": [open: boolean];
  /** After closing; `preventDefault()` and move focus to keep it off the page body. */
  closeAutoFocus: [event: Event];
}>();

const attrs = useAttrs();
const contentAttrs = computed(() => ({
  ...attrs,
  class: cn(
    // eslint-disable-next-line better-tailwindcss/no-restricted-classes -- no scale step for the window less a margin
    "fixed bottom-4 z-10 ml-2 flex max-h-[calc(100vh-2rem)] w-90 max-w-[calc(100vw-4rem)] origin-bottom-left flex-col rounded-7 border border-outline-gray-2 bg-surface-elevation-2 shadow-xl outline-none",
    normalizeClass(attrs.class),
  ),
}));

const pageTips = computed(() => visibleTips(props.pageTips, props.roles));
const generalTips = computed(() => visibleTips(props.generalTips, props.roles));

const pop = {
  enterActiveClass: "transition duration-100 ease-out",
  enterFromClass: "scale-[0.98] opacity-50",
  leaveActiveClass: "transition duration-150 ease-in",
  leaveToClass: "scale-[0.98] opacity-0",
};
</script>

<!--
  Built on reka-ui's Dialog primitives because frappe-ui Dialog is modal and centred; the
  panel stays open beside the sidebar while the page is used, and closes only from its
  close button, Escape or the sidebar's Help item.
-->
<template>
  <DialogRoot
    :open="open"
    :modal="false"
    @update:open="emit('update:open', $event)"
  >
    <DialogPortal>
      <Transition v-bind="pop">
        <DialogContent
          v-bind="contentAttrs"
          @interact-outside="$event.preventDefault()"
          @close-auto-focus="emit('closeAutoFocus', $event)"
        >
          <div class="flex items-center gap-1 px-3 pb-2 pt-3">
            <DialogTitle class="flex-1 px-1 text-sm-medium text-ink-gray-8">
              Help
            </DialogTitle>
            <DialogDescription class="sr-only">
              Tips for this page and for the whole app
            </DialogDescription>
            <DialogClose as-child>
              <Button variant="ghost" icon="lucide-x" label="Close help" />
            </DialogClose>
          </div>

          <AccordionRoot
            type="single"
            collapsible
            class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-3"
          >
            <p
              v-if="!pageTips.length"
              class="px-2 pt-2 text-sm text-ink-gray-5"
            >
              No tips for this page yet.
            </p>
            <HelpTipList label="On this page" :tips="pageTips" />
            <HelpTipList label="Everywhere" :tips="generalTips" />
          </AccordionRoot>
        </DialogContent>
      </Transition>
    </DialogPortal>
  </DialogRoot>
</template>

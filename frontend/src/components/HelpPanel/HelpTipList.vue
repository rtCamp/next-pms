<script setup lang="ts">
import { useId } from "vue";
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTrigger,
} from "reka-ui";
import { WIKI_BASE } from "@/components/InfoHoverCard";
import { MotionDialogPlayer } from "@/components/MotionPlayer";
import type { HelpTip } from "./types";

defineProps<{ label: string; tips: HelpTip[] }>();

const labelId = useId();
</script>

<template>
  <div
    v-if="tips.length"
    role="group"
    :aria-labelledby="labelId"
    class="flex flex-col gap-1"
  >
    <p :id="labelId" class="px-2 pt-2 text-xs-medium text-ink-gray-5">
      {{ label }}
    </p>
    <AccordionItem v-for="tip in tips" :key="tip.id" :value="tip.id">
      <AccordionHeader class="flex">
        <AccordionTrigger
          class="group flex w-full items-center gap-2 rounded-5 p-2 text-left text-sm text-ink-gray-8 outline-none hover:bg-surface-gray-2 focus-visible:ring-2 focus-visible:ring-outline-gray-3"
        >
          <span
            :class="tip.motion ? 'lucide-play' : 'lucide-lightbulb'"
            class="size-4 shrink-0 text-ink-gray-5"
            aria-hidden="true"
          />
          <span class="flex-1">{{ tip.title }}</span>
          <span
            class="lucide-chevron-down size-4 shrink-0 text-ink-gray-4 transition-transform duration-200 group-aria-expanded:rotate-180 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </AccordionTrigger>
      </AccordionHeader>
      <!-- eslint-disable better-tailwindcss/no-restricted-classes -- reka-ui exposes the panel state only as data-state -->
      <AccordionContent
        class="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down motion-reduce:animate-none"
      >
        <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
        <div
          class="flex flex-col gap-2 pb-3 pl-8 pr-2 pt-1 text-sm leading-relaxed text-ink-gray-6"
        >
          <p>{{ tip.body }}</p>
          <ol
            v-if="tip.steps"
            class="list-decimal space-y-1 pl-4 marker:text-ink-gray-5"
          >
            <li v-for="step in tip.steps" :key="step">{{ step }}</li>
          </ol>
          <MotionDialogPlayer
            v-if="tip.motion"
            :motion="tip.motion"
            :title="tip.title"
          />
          <a
            v-if="tip.wiki"
            :href="`${WIKI_BASE}/${tip.wiki}`"
            target="_blank"
            rel="noreferrer"
            class="flex w-fit items-center gap-1 text-sm text-ink-gray-7 underline underline-offset-2 hover:text-ink-gray-9"
          >
            Learn more in the wiki
            <span class="lucide-arrow-up-right size-3.5" aria-hidden="true" />
          </a>
        </div>
      </AccordionContent>
    </AccordionItem>
  </div>
</template>

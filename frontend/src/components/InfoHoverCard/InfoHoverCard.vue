<script setup lang="ts">
import { HoverCard, Tooltip } from "frappe-ui";
import type { InfoHoverCardProps } from "./types";

defineProps<InfoHoverCardProps>();

const triggerClass =
  // eslint-disable-next-line better-tailwindcss/no-restricted-classes -- the open card keeps its trigger dark; no variant for reka's data-state
  "inline-flex size-3 shrink-0 items-center justify-center rounded-4 text-ink-gray-4 transition-colors hover:text-ink-gray-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3 data-[state=open]:text-ink-gray-7";
</script>

<template>
  <span class="inline-flex shrink-0">
    <HoverCard
      v-if="help"
      side="bottom"
      align="start"
      :offset="8"
      :hover-delay="300"
      :leave-delay="150"
    >
      <template #trigger>
        <button
          type="button"
          :aria-label="`About ${help.title}`"
          :class="triggerClass"
        >
          <span class="lucide-info size-2.5" aria-hidden="true" />
        </button>
      </template>
      <div class="flex w-72 flex-col gap-3 p-3 text-left">
        <div class="flex flex-col gap-1">
          <p class="text-base-medium text-ink-gray-7">{{ help.title }}</p>
          <p class="text-sm leading-snug text-ink-gray-6">{{ help.summary }}</p>
        </div>
        <p
          v-if="help.formula"
          class="rounded-5 bg-surface-gray-2 px-2 py-1.5 text-xs leading-snug text-ink-gray-8"
        >
          {{ help.formula }}
        </p>
        <!-- eslint-disable better-tailwindcss/no-restricted-classes -- samples size to their content beside the labels; no grid template token for it -->
        <dl
          v-if="help.legend"
          class="grid grid-cols-[auto_1fr] items-baseline gap-2 text-xs leading-snug text-ink-gray-6"
        >
          <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
          <template v-for="item in help.legend" :key="item.label">
            <dt
              class="flex"
              :class="(item.icon || item.component) && 'self-center'"
            >
              <component
                :is="item.component"
                v-if="item.component"
                v-bind="item.props"
              />
              <span
                v-else-if="item.icon"
                :class="[item.icon, 'size-3.5', item.class]"
                aria-hidden="true"
              />
              <span v-else class="relative tabular-nums" :class="item.class">
                {{ item.sample }}
                <span
                  v-if="item.marker"
                  class="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full"
                  :class="item.marker"
                />
              </span>
            </dt>
            <dd
              class="text-pretty"
              :class="(item.icon || item.component) && 'self-center'"
            >
              {{ item.label }}
            </dd>
          </template>
        </dl>
        <ul
          v-if="help.details"
          class="list-disc space-y-1 pl-4 text-xs leading-snug text-ink-gray-6"
        >
          <li v-for="line in help.details" :key="line">{{ line }}</li>
        </ul>
      </div>
    </HoverCard>
    <Tooltip v-else :text="tooltip">
      <button type="button" :aria-label="tooltip" :class="triggerClass">
        <span class="lucide-info size-2.5" aria-hidden="true" />
      </button>
    </Tooltip>
  </span>
</template>

<script lang="ts">
import { cva, type VariantProps } from "class-variance-authority";

const bar = cva(
  "group pointer-events-auto absolute mx-0.5 flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-4 px-2.5 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3",
  {
    variants: {
      variant: {
        full: "bg-surface-green-2 text-ink-green-8",
        under: "bg-surface-amber-2 text-ink-amber-8",
        over: "bg-surface-violet-2 text-ink-violet-8",
        timeoff: "justify-center bg-surface-gray-2 text-ink-gray-6",
        projectSummary: "bg-surface-blue-2 text-ink-blue-6",
        allocation: "bg-surface-base text-ink-gray-5 shadow-sm",
        aiAllocation: "bg-surface-yellow-2 text-ink-gray-5 shadow-sm",
        draft: "bg-surface-gray-2 text-ink-gray-5",
        empty: "bg-surface-gray-2/60 text-ink-gray-4",
      },
    },
  },
);

export type BarVariant = NonNullable<VariantProps<typeof bar>["variant"]>;
</script>

<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/utils/cn";
import { BAR_HEIGHT, BAR_MARGIN, CELL_HEIGHT } from "./constants";
import GanttCrosshatch from "./GanttCrosshatch.vue";
import type { ResizeEdge } from "./geometry";

const EDGES: ResizeEdge[] = ["start", "end"];

const props = withDefaults(
  defineProps<{
    variant: BarVariant;
    label?: string;
    /** From the row's left edge, in px. */
    left: number;
    width: number;
    /** Tentative or AI-created: a hatched overlay. */
    crosshatch?: boolean;
    /** `false` adds the non-billable dot. */
    billable?: boolean;
    /** AI-created: an "Ai" tag at the end. */
    ai?: boolean;
    /** A dashed outline, for a resized bar waiting to be saved. */
    outline?: boolean;
    /**
     * A background layer: ignores the pointer, and isn't treated as a bar where the
     * row's "+" looks for free days.
     */
    passive?: boolean;
    /** Shows grips on both edges that start a resize. */
    resizable?: boolean;
  }>(),
  {
    label: "",
    resizable: false,
    crosshatch: false,
    billable: undefined,
    ai: false,
    outline: false,
    passive: false,
  },
);

const emit = defineEmits<{
  /** An edge's grip was pressed. */
  resizeStart: [edge: ResizeEdge, event: PointerEvent];
}>();

defineSlots<{
  /** Replaces the label, the "Ai" tag and the billable dot. */
  default?: () => unknown;
  /** Replaces the label text. */
  label?: () => unknown;
  /** Rendered last inside the bar, e.g. resize handles or buttons below it. */
  after?: () => unknown;
}>();

const style = computed(() => ({
  left: `${Math.max(props.left - BAR_MARGIN / 2, 0)}px`,
  width: `${Math.max(props.width - BAR_MARGIN, 0)}px`,
  height: `${BAR_HEIGHT}px`,
  top: `${(CELL_HEIGHT - BAR_HEIGHT) / 2}px`,
}));

const hatched = computed(
  () =>
    props.crosshatch &&
    props.variant !== "timeoff" &&
    props.variant !== "draft" &&
    props.variant !== "empty",
);
</script>

<template>
  <div
    :class="cn(bar({ variant }), passive && 'pointer-events-none')"
    :style="style"
    :data-gantt-bar="passive ? undefined : ''"
  >
    <GanttCrosshatch v-if="hatched" :variant="variant" />
    <slot>
      <span class="min-w-0 flex-1 truncate text-sm-medium">
        <slot name="label">{{ label }}</slot>
      </span>
      <span
        v-if="ai"
        class="ml-auto shrink-0 text-end text-2xs-semibold leading-tighter text-ink-amber-8"
      >
        Ai
      </span>
      <span
        v-if="billable === false"
        class="ml-1 block size-1 shrink-0 rounded-full bg-surface-amber-7"
        aria-hidden="true"
      />
    </slot>
    <template v-if="resizable && !passive">
      <span
        v-for="edge in EDGES"
        :key="edge"
        class="absolute inset-y-0 flex w-2.5 shrink-0 cursor-ew-resize touch-none items-center"
        :class="
          edge === 'start'
            ? 'left-0 justify-start pl-1'
            : 'right-0 justify-end pr-1'
        "
        aria-hidden="true"
        @pointerdown="emit('resizeStart', edge, $event)"
        @click.stop
      >
        <span
          class="pointer-events-none block h-4 w-0.5 shrink-0 rounded-8 bg-surface-gray-4 opacity-0 transition-opacity group-hover:opacity-100"
        />
      </span>
    </template>
    <span
      v-if="outline"
      class="pointer-events-none absolute inset-0 inline-flex rounded-4 border border-dashed border-outline-amber-6"
      aria-hidden="true"
    />
    <slot name="after" />
  </div>
</template>

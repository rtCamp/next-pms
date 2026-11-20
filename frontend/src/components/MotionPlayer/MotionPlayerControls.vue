<script setup lang="ts">
import { useTemplateRef } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  playing: boolean;
  expandable?: boolean;
  collapsible?: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
  replay: [];
  /** A point of the motion, from 0 (start) to 1 (end). */
  seek: [progress: number];
  expand: [];
  collapse: [];
}>();

const SEEK_STEP = 0.05;

const track = useTemplateRef<HTMLDivElement>("track");
const bar = useTemplateRef<HTMLDivElement>("bar");
let progress = 0;

// Called every frame: writing the DOM directly skips a re-render per frame.
function setProgress(value: number) {
  progress = value;
  if (bar.value) bar.value.style.transform = `scaleX(${value})`;
  track.value?.setAttribute("aria-valuenow", String(Math.round(value * 100)));
}

defineExpose({ setProgress });

const clamp = (value: number) => Math.min(1, Math.max(0, value));

function seekTo(event: PointerEvent) {
  const target = event.currentTarget as HTMLElement;
  const { left, width } = target.getBoundingClientRect();
  emit("seek", clamp((event.clientX - left) / width));
}

function onPointerDown(event: PointerEvent) {
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  seekTo(event);
}

function onPointerMove(event: PointerEvent) {
  if ((event.currentTarget as HTMLElement).hasPointerCapture(event.pointerId))
    seekTo(event);
}

const KEY_TARGETS: Record<string, (current: number) => number> = {
  ArrowRight: (current) => current + SEEK_STEP,
  ArrowUp: (current) => current + SEEK_STEP,
  ArrowLeft: (current) => current - SEEK_STEP,
  ArrowDown: (current) => current - SEEK_STEP,
  Home: () => 0,
  End: () => 1,
};

function onKeydown(event: KeyboardEvent) {
  const target = KEY_TARGETS[event.key];
  if (!target) return;
  event.preventDefault();
  emit("seek", clamp(target(progress)));
}

function onFrameClick() {
  if (props.expandable) emit("expand");
  else emit("toggle");
}

const controlButton =
  "flex size-7 items-center justify-center rounded-5 text-white hover:bg-white-overlay-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white";
</script>

<template>
  <button
    type="button"
    tabindex="-1"
    aria-hidden="true"
    class="absolute inset-0 cursor-pointer"
    @click="onFrameClick"
  />
  <div
    class="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black-overlay-500 to-transparent px-1.5 pb-1.5 pt-6 transition-opacity duration-150"
    :class="
      playing
        ? 'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100'
        : 'opacity-100'
    "
  >
    <button
      type="button"
      :aria-label="playing ? 'Pause animation' : 'Play animation'"
      :class="controlButton"
      @click="emit('toggle')"
    >
      <span
        :class="playing ? 'lucide-pause' : 'lucide-play'"
        class="size-3.5"
        aria-hidden="true"
      />
    </button>
    <button
      type="button"
      aria-label="Replay from the start"
      :class="controlButton"
      @click="emit('replay')"
    >
      <span class="lucide-rotate-ccw size-3.5" aria-hidden="true" />
    </button>
    <div
      ref="track"
      role="slider"
      tabindex="0"
      aria-label="Animation progress"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow="0"
      class="mx-1 flex h-7 flex-1 cursor-pointer touch-none items-center rounded-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @keydown="onKeydown"
    >
      <div class="h-1 w-full overflow-hidden rounded-full bg-white-overlay-200">
        <div
          ref="bar"
          class="size-full origin-left scale-x-0 rounded-full bg-white"
        />
      </div>
    </div>
    <button
      v-if="expandable"
      type="button"
      aria-label="Enlarge animation"
      :class="controlButton"
      @click="emit('expand')"
    >
      <span class="lucide-maximize-2 size-3.5" aria-hidden="true" />
    </button>
    <button
      v-if="collapsible"
      type="button"
      aria-label="Shrink animation"
      :class="controlButton"
      @click="emit('collapse')"
    >
      <span class="lucide-minimize-2 size-3.5" aria-hidden="true" />
    </button>
  </div>
</template>

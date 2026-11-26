<script setup lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
  watchEffect,
} from "vue";
import { Spinner } from "frappe-ui";
import { createKit, STAGE_HEIGHT, STAGE_WIDTH } from "./kit";
import MotionPlayerControls from "./MotionPlayerControls.vue";
import type { MotionPlayerEmits, MotionPlayerProps } from "./types";
import "./motionTokens.css";

const props = defineProps<MotionPlayerProps>();
const emit = defineEmits<MotionPlayerEmits>();

type Timeline = { draw: (t: number) => void; duration: number };

const frame = useTemplateRef<HTMLDivElement>("frame");
const stage = useTemplateRef<HTMLDivElement>("stage");
const controls =
  useTemplateRef<InstanceType<typeof MotionPlayerControls>>("controls");

const timeline = shallowRef<Timeline>();
const failed = ref(false);
const scale = ref(0);
const visible = ref(true);
const playing = ref(true);
let elapsed = 0;

let resizeObserver: ResizeObserver | undefined;
let intersectionObserver: IntersectionObserver | undefined;

onMounted(() => {
  if (!frame.value) return;
  resizeObserver = new ResizeObserver(([entry]) => {
    scale.value = entry.contentRect.width / STAGE_WIDTH;
  });
  intersectionObserver = new IntersectionObserver(([entry]) => {
    visible.value = entry.isIntersecting;
  });
  resizeObserver.observe(frame.value);
  intersectionObserver.observe(frame.value);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  intersectionObserver?.disconnect();
});

watch(
  [() => props.load, stage],
  ([load, stageEl], _, onCleanup) => {
    if (!stageEl) return;
    let cancelled = false;
    timeline.value = undefined;
    elapsed = 0;

    load()
      .then((mod) => {
        if (cancelled) return;
        stageEl.dataset.motion = mod.name;
        stageEl.style.setProperty(
          "--sans",
          getComputedStyle(document.body).fontFamily,
        );

        // Each scene builds its DOM in its own layer.
        const kit = createKit(stageEl);
        for (const register of mod.scenes) register(kit);
        let start = 0;
        const tracks = mod.manifest.scenes.map(({ id, dur }) => {
          const def = kit.scenes.get(id);
          if (!def) throw new Error(`Motion ${mod.name}: no scene ${id}`);
          const layer = document.createElement("div");
          layer.style.cssText = "position:absolute;inset:0";
          stageEl.append(layer);
          kit.stage = layer;
          def.init.call(def, kit);
          const track = { def, layer, start, dur };
          start += dur;
          return track;
        });
        const duration = start;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          elapsed = Math.max(0, duration - 0.5);
          playing.value = false;
        }
        timeline.value = {
          duration,
          draw: (t) => {
            const active =
              tracks.find((track) => t < track.start + track.dur) ??
              tracks[tracks.length - 1];
            for (const track of tracks) {
              track.layer.style.visibility =
                track === active ? "visible" : "hidden";
            }
            active.def.render.call(active.def, t - active.start);
            controls.value?.setProgress(t / duration);
          },
        };
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("Help motion failed", error);
        failed.value = true;
      });

    onCleanup(() => {
      cancelled = true;
      stageEl.replaceChildren();
    });
  },
  { immediate: true, flush: "post" },
);

// Draw once the controls exist, so the progress bar matches the first frame.
watch(timeline, (current) => current?.draw(elapsed), { flush: "post" });

watchEffect((onCleanup) => {
  const current = timeline.value;
  if (!current || !playing.value || props.paused || !visible.value) return;
  let frameId = 0;
  let last = performance.now();
  const tick = (now: number) => {
    elapsed = (elapsed + Math.min(now - last, 100) / 1000) % current.duration;
    last = now;
    current.draw(elapsed);
    frameId = requestAnimationFrame(tick);
  };
  frameId = requestAnimationFrame(tick);
  onCleanup(() => cancelAnimationFrame(frameId));
});

function seek(time: number) {
  elapsed = time;
  timeline.value?.draw(time);
}

function replay() {
  seek(0);
  playing.value = true;
}
</script>

<template>
  <div
    v-if="!failed"
    ref="frame"
    :aria-busy="!timeline"
    class="group relative aspect-video w-full overflow-hidden rounded-6 bg-surface-gray-2"
  >
    <div
      ref="stage"
      role="img"
      :aria-label="label"
      class="absolute left-0 top-0 origin-top-left overflow-hidden transition-opacity duration-200"
      :class="timeline ? 'opacity-100' : 'opacity-0'"
      :style="{
        width: `${STAGE_WIDTH}px`,
        height: `${STAGE_HEIGHT}px`,
        transform: `scale(${scale})`,
      }"
    />
    <MotionPlayerControls
      v-if="timeline"
      ref="controls"
      :playing="playing"
      :expandable="expandable"
      :collapsible="collapsible"
      @toggle="playing = !playing"
      @replay="replay"
      @seek="(progress) => seek(progress * timeline!.duration)"
      @expand="emit('expand')"
      @collapse="emit('collapse')"
    />
    <div
      v-else
      class="absolute inset-0 flex items-center justify-center text-ink-gray-5"
    >
      <Spinner class="size-5" />
    </div>
  </div>
</template>

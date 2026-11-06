<script setup lang="ts">
import { computed, onBeforeUnmount, useTemplateRef } from "vue";

const props = defineProps<{ html: string }>();

const MIN_HEIGHT = 38;
const MAX_HEIGHT = 300;

// The iframe isolates the email's own styles; its document can't read the app's
// tokens, so the colours are literal, as in React.
const srcdoc = computed(
  () => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
    <style>
      body { margin: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 14px; font-weight: 420; line-height: 1.5; color: #383838; overflow-wrap: break-word; }
      a { color: #171717; text-decoration: underline; font-weight: 500; }
      img { max-width: 100%; }
    </style>
  </head>
  <body>${props.html}</body>
</html>`,
);

const iframe = useTemplateRef("iframe");
let observer: ResizeObserver | null = null;

function onLoad() {
  observer?.disconnect();
  const frame = iframe.value;
  const doc = frame?.contentDocument;
  if (!frame || !doc?.body) return;
  const body = doc.body;

  const syncHeight = () => {
    // Collapse first so scrollHeight measures the content, not the old height.
    body.style.overflowY = "";
    frame.style.height = "0px";
    const height = doc.documentElement.scrollHeight;
    frame.style.height = `${Math.min(Math.max(height, MIN_HEIGHT), MAX_HEIGHT)}px`;
    body.style.overflowY = height > MAX_HEIGHT ? "auto" : "";
  };

  syncHeight();
  observer = new ResizeObserver(syncHeight);
  observer.observe(body);
}

onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <iframe
    ref="iframe"
    :srcdoc="srcdoc"
    sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
    class="w-full border-none"
    title="Email content"
    @load="onLoad"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { GithubIcon } from "@/icons";
import { safeExternalUrl } from "@/utils/url";
import { useProjectSidebar } from "./useProjectSidebar";

const { sidebar } = useProjectSidebar();

// The links are unvalidated Data fields; one that isn't a safe URL is left out.
const links = computed(() => {
  const values = sidebar.value?.links;
  return [
    {
      key: "website",
      label: "Project website",
      icon: "lucide-external-link",
      href: safeExternalUrl(values?.website),
    },
    {
      key: "drive",
      label: "Drive folder",
      icon: "lucide-folder",
      href: safeExternalUrl(values?.google_drive),
    },
    {
      key: "slack",
      label: "Slack channel",
      icon: "lucide-hash",
      href: safeExternalUrl(values?.slack),
    },
    {
      key: "repository",
      label: "GitHub repository",
      icon: GithubIcon,
      href: safeExternalUrl(values?.github),
    },
  ].filter((link) => link.href);
});
</script>

<template>
  <div v-if="links.length" class="flex items-center gap-2">
    <a
      v-for="link in links"
      :key="link.key"
      :href="link.href"
      target="_blank"
      rel="noreferrer"
      :aria-label="link.label"
      class="flex size-7 items-center justify-center rounded-4 bg-surface-gray-2 text-ink-gray-7 hover:bg-surface-gray-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3"
    >
      <span
        v-if="typeof link.icon === 'string'"
        :class="[link.icon, 'size-4']"
        aria-hidden="true"
      />
      <component :is="link.icon" v-else class="size-4" aria-hidden="true" />
    </a>
  </div>
</template>

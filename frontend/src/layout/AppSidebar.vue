<script setup lang="ts">
import { computed, h, onScopeDispose, ref, watch } from "vue";
import {
  Sidebar,
  SidebarCollapseToggle,
  SidebarHeader,
  SidebarItem,
  useColorScheme,
  useKeyboardShortcut,
} from "frappe-ui";
import { NotificationTray } from "@/components/NotificationTray";
import { useNotifications } from "@/composables/useNotifications";
import type { Role } from "@/session";
import logo from "@/assets/logo.svg";
import { switchableApps, type AppLink } from "./apps";
import { SIDEBAR_COLLAPSED_KEY } from "./constants";
import AppSidebarSection from "./AppSidebarSection.vue";
import GlobalSearch from "./GlobalSearch.vue";
import SettingsModal from "./settings/SettingsModal.vue";
import {
  computeSearchItems,
  computeSections,
  type NavAction,
  type NavItem,
} from "./sidebarSections";
import { usePreloadRoute } from "./usePreloadRoute";

const props = defineProps<{
  roles: readonly Role[];
  employee?: string | null;
  employeeName?: string;
  /** Apps to offer under "Apps", from `frappe.apps.get_apps`. */
  apps?: readonly AppLink[];
}>();

const emit = defineEmits<{ logout: [] }>();

defineOptions({ inheritAttrs: false });

const { resolvedColorScheme, toggleColorScheme } = useColorScheme();
const preload = usePreloadRoute();
const notifications = useNotifications();
const { trayOpen } = notifications;

const nav = computed(() => computeSections(props.roles, props.employee));
const topItems = computed(() => nav.value.topItems);
const sections = computed(() => nav.value.sections);
const hasNotifications = computed(() =>
  topItems.value.some(
    (item) => "action" in item && item.action === "notifications",
  ),
);

function itemKey(item: NavItem | NavAction) {
  return "to" in item ? item.to : item.action;
}

const settingsOpen = ref(false);
const searchOpen = ref(false);
const searchItems = computed(() =>
  computeSearchItems(props.roles, props.employee),
);
useKeyboardShortcut({
  combo: "Mod+K",
  description: "Search",
  // From anywhere, as in React: a focused field or an open dialog, the palette included.
  allowInInput: true,
  allowInDialog: true,
  handler: () => {
    searchOpen.value = !searchOpen.value;
  },
});

function runAction(action: NavAction["action"]) {
  if (action === "search") searchOpen.value = true;
  else trayOpen.value = true;
}

// `null` until toggled, so Sidebar auto-collapses on narrow screens.
function readCollapsed(): boolean | null {
  try {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return stored === null ? null : stored === "true";
  } catch {
    return null;
  }
}

const collapsed = ref(readCollapsed());
watch(collapsed, (value) => {
  if (value !== null) {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(value));
  }
});

// Mirrors Sidebar's own rule: injecting `sidebarCollapsedKey` fails in dev,
// where pre-bundled frappe-ui holds a different Symbol.
const narrowQuery = window.matchMedia("(max-width: 639.9px)");
const isNarrow = ref(narrowQuery.matches);
const onNarrowChange = (event: MediaQueryListEvent) => {
  isNarrow.value = event.matches;
};
narrowQuery.addEventListener("change", onNarrowChange);
onScopeDispose(() => narrowQuery.removeEventListener("change", onNarrowChange));
const sidebarCollapsed = computed(() => collapsed.value ?? isNarrow.value);

const menuItems = computed(() => [
  {
    label: "Apps",
    icon: "lucide-layout-grid",
    submenu: switchableApps(props.apps ?? []).map((app) => ({
      label: app.title,
      icon: h("img", { src: app.logo, alt: "", class: "size-4" }),
      // Outside the SPA, so the router can't take these.
      onClick: () => window.location.assign(app.route),
    })),
  },
  {
    label: "Settings",
    icon: "lucide-settings",
    onClick: () => {
      settingsOpen.value = true;
    },
  },
  {
    label: resolvedColorScheme.value === "dark" ? "Light mode" : "Dark mode",
    icon: resolvedColorScheme.value === "dark" ? "lucide-sun" : "lucide-moon",
    onClick: toggleColorScheme,
  },
  { label: "Log out", icon: "lucide-log-out", onClick: () => emit("logout") },
]);
</script>

<template>
  <Sidebar v-model:collapsed="collapsed">
    <SidebarHeader
      title="Next PMS"
      :subtitle="employeeName"
      :logo="logo"
      :menu-items="menuItems"
    />

    <div class="flex-1 overflow-y-auto px-2 pt-2">
      <template v-for="item in topItems" :key="itemKey(item)">
        <SidebarItem
          v-if="'to' in item"
          :label="item.label"
          :icon="item.icon"
          :route="item.to"
          @mouseenter="preload(item.to)"
          @focusin="preload(item.to)"
        />
        <SidebarItem
          v-else
          :label="item.label"
          :icon="item.icon"
          @click="runAction(item.action)"
        />
      </template>

      <AppSidebarSection
        v-for="section in sections"
        :key="section.label"
        :label="section.label"
        :items="section.items"
        :sidebar-collapsed="sidebarCollapsed"
      />
    </div>

    <div class="p-2">
      <SidebarCollapseToggle />
    </div>
  </Sidebar>

  <GlobalSearch v-model:open="searchOpen" :items="searchItems" />
  <SettingsModal v-model:open="settingsOpen" :roles="roles" />

  <NotificationTray
    v-if="hasNotifications"
    v-model:open="trayOpen"
    :notifications="notifications.notifications.value"
    :offset-class="sidebarCollapsed ? 'left-12' : 'left-60'"
    @mark-all-read="notifications.markAllAsViewed"
    @notification-click="notifications.openNotification"
  />
</template>

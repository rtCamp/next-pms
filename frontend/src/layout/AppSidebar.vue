<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  Sidebar,
  SidebarCollapseToggle,
  SidebarHeader,
  SidebarItem,
  useColorScheme,
} from "frappe-ui";
import type { Role } from "@/session";
import logo from "@/assets/logo.svg";
import { SIDEBAR_COLLAPSED_KEY } from "./constants";
import AppSidebarSection from "./AppSidebarSection.vue";
import {
  computeSections,
  isNavItemActive,
  type NavItem,
} from "./sidebarSections";

const props = defineProps<{
  roles: readonly Role[];
  employee?: string | null;
  employeeName?: string;
}>();

const emit = defineEmits<{ logout: [] }>();

const route = useRoute();
const { resolvedColorScheme, toggleColorScheme } = useColorScheme();

const isActive = (item: NavItem) => isNavItemActive(item, route.path);

const nav = computed(() => computeSections(props.roles, props.employee));
const topItems = computed(() => nav.value.topItems);
const sections = computed(() => nav.value.sections);

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
    onClick: () => window.location.assign("/apps"),
  },
  {
    label: "Switch To Desk",
    icon: "lucide-arrow-left-right",
    onClick: () => window.location.assign("/app"),
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
      <SidebarItem
        v-for="item in topItems"
        :key="item.to"
        :label="item.label"
        :icon="item.icon"
        :route="item.to"
        :active="isActive(item)"
      />

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
</template>

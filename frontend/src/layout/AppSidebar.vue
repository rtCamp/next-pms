<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  Sidebar,
  SidebarCollapseToggle,
  SidebarHeader,
  SidebarItem,
  SidebarSection,
  useColorScheme,
} from "frappe-ui";
import { ROLE_ACCESS, hasAnyRole, type Role } from "@/session";
import logo from "@/assets/logo.svg";

const props = defineProps<{
  roles: readonly Role[];
  /** The user's Employee ID; the team timesheet opens on their reports. */
  employee?: string | null;
  employeeName?: string;
}>();

const emit = defineEmits<{ logout: [] }>();

interface NavItem {
  label: string;
  icon: string;
  to: string;
}

const COLLAPSED_KEY = "next-pms:isSidebarCollapsed";

const route = useRoute();
const { resolvedColorScheme, toggleColorScheme } = useColorScheme();

const can = (allowed: readonly Role[]) => hasAnyRole(props.roles, allowed);
const isActive = (item: NavItem) => route.path === item.to.split("?")[0];

const dashboards = computed<NavItem[]>(() => [
  ...(can(ROLE_ACCESS.leadershipDashboard)
    ? [
        {
          label: "Leadership",
          icon: "lucide-chart-column",
          to: "/dashboard/leadership",
        },
      ]
    : []),
  ...(can(ROLE_ACCESS.managerDashboard)
    ? [{ label: "Manager", icon: "lucide-briefcase", to: "/dashboard/manager" }]
    : []),
]);

const reviewsTimesheets = computed(() => can(ROLE_ACCESS.reviewTimesheets));

const timesheets = computed<NavItem[]>(() => {
  if (!reviewsTimesheets.value) {
    return [{ label: "Timesheet", icon: "lucide-clock", to: "/timesheet" }];
  }
  const team = props.employee
    ? `/timesheet/team?reportsTo=${encodeURIComponent(props.employee)}`
    : "/timesheet/team";
  return [
    { label: "Personal", icon: "lucide-clock", to: "/timesheet" },
    { label: "Team", icon: "lucide-users", to: team },
    { label: "Projects", icon: "lucide-folder", to: "/timesheet/project" },
  ];
});

const topItems = computed<NavItem[]>(() => [
  ...(timesheets.value.length === 1 ? timesheets.value : []),
  ...(can(ROLE_ACCESS.projects)
    ? [{ label: "Projects", icon: "lucide-folder", to: "/projects?status=Open" }]
    : []),
  { label: "Tasks", icon: "lucide-list-checks", to: "/tasks" },
  ...(dashboards.value.length === 1 ? dashboards.value : []),
]);

const allocations: NavItem[] = [
  { label: "Team", icon: "lucide-users", to: "/allocations/team" },
  { label: "Projects", icon: "lucide-folder", to: "/allocations/project" },
];

const sections = computed(() =>
  [
    { label: "Dashboards", items: dashboards.value },
    { label: "Timesheet", items: timesheets.value },
    { label: "Allocations", items: allocations },
  ].filter((section) => section.items.length > 1),
);

// Sections start closed unless they hold the current page.
const closedSections = ref<Record<string, boolean>>({});
watch(
  [sections, () => route.path],
  () => {
    for (const section of sections.value) {
      if (section.items.some(isActive)) {
        closedSections.value[section.label] = false;
      } else {
        closedSections.value[section.label] ??= true;
      }
    }
  },
  { immediate: true },
);

// Left unset (`null`) until the user toggles it, so the sidebar collapses by
// itself on narrow screens.
function readCollapsed(): boolean | null {
  try {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    return stored === null ? null : stored === "true";
  } catch {
    return null;
  }
}

const collapsed = ref(readCollapsed());
watch(collapsed, (value) => {
  try {
    if (value !== null) localStorage.setItem(COLLAPSED_KEY, String(value));
  } catch {
    // Storage is unavailable (private mode); the choice lasts for this visit.
  }
});

const menuItems = computed(() => [
  // Frappe pages outside this app, so not router routes.
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

    <!-- Sidebar leaves the body's layout to the app. The 8px inset matches the
         React sidebar and centres the icons in the collapsed 48px column. -->
    <div class="flex-1 overflow-y-auto px-2 pt-2">
      <SidebarItem
        v-for="item in topItems"
        :key="item.to"
        :label="item.label"
        :icon="item.icon"
        :route="item.to"
        :active="isActive(item)"
      />

      <SidebarSection
        v-for="section in sections"
        :key="section.label"
        v-model:collapsed="closedSections[section.label]"
        :label="section.label"
        collapsible
      >
        <SidebarItem
          v-for="item in section.items"
          :key="item.to"
          :label="item.label"
          :icon="item.icon"
          :route="item.to"
          :active="isActive(item)"
        />
      </SidebarSection>
    </div>

    <div class="p-2">
      <SidebarCollapseToggle />
    </div>
  </Sidebar>
</template>

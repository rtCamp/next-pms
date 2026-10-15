import {
  createRouter,
  createWebHistory,
  type RouteLocationRaw,
  type RouteLocationNormalized,
  type RouteRecordRaw,
} from "vue-router";
import { ROLE_ACCESS, useSession } from "./session";

const WorkInProgress = () => import("./pages/WorkInProgress.vue");

const routes: RouteRecordRaw[] = [
  { path: "/", redirect: { name: "timesheet-personal" } },
  {
    path: "/timesheet",
    name: "timesheet-personal",
    component: WorkInProgress,
    meta: { title: "Timesheet" },
  },
  {
    path: "/timesheet/team",
    name: "timesheet-team",
    component: WorkInProgress,
    meta: { title: "Team Timesheet", roles: ROLE_ACCESS.reviewTimesheets },
  },
  {
    path: "/timesheet/project",
    name: "timesheet-project",
    component: WorkInProgress,
    meta: { title: "Project Timesheet", roles: ROLE_ACCESS.reviewTimesheets },
  },
  {
    path: "/projects",
    name: "project",
    component: () => import("./pages/projects/Projects.vue"),
    meta: { title: "Projects", roles: ROLE_ACCESS.projects, scroll: false },
  },
  ...[
    "",
    "/notes/new",
    "/notes/:noteId/edit",
    "/notes/templates/:templateId/edit",
  ].map((suffix): RouteRecordRaw => ({
    path: `/projects/:projectId${suffix}`,
    component: WorkInProgress,
    meta: { title: "Project", roles: ROLE_ACCESS.projects },
  })),
  {
    path: "/tasks",
    name: "task",
    component: () => import("./pages/tasks/TaskList.vue"),
    meta: { title: "Tasks", scroll: false },
  },
  {
    path: "/allocations/team",
    name: "allocations-team",
    component: WorkInProgress,
    meta: { title: "Team Allocations" },
  },
  {
    path: "/allocations/project",
    name: "allocations-project",
    component: WorkInProgress,
    meta: { title: "Project Allocations" },
  },
  {
    path: "/dashboard/leadership",
    name: "dashboard-leadership",
    component: WorkInProgress,
    meta: {
      title: "Leadership Dashboard",
      roles: ROLE_ACCESS.leadershipDashboard,
    },
  },
  {
    path: "/dashboard/manager",
    name: "dashboard-manager",
    component: WorkInProgress,
    meta: { title: "Manager Dashboard", roles: ROLE_ACCESS.managerDashboard },
  },
  {
    path: "/no-access",
    name: "no-access",
    component: () => import("./pages/NoAccess.vue"),
    meta: { title: "No Access", standalone: true },
  },
  {
    path: "/no-employee",
    name: "no-employee",
    component: () => import("./pages/NoEmployee.vue"),
    meta: { title: "Access Restricted", standalone: true },
  },
  {
    path: "/not-found",
    name: "not-found",
    component: () => import("./pages/NotFound.vue"),
    meta: { title: "Page Not Found", standalone: true },
  },
  {
    path: "/:pathMatch(.*)*",
    component: () => import("./pages/NotFound.vue"),
    meta: { title: "Page Not Found", standalone: true },
  },
];

export const router = createRouter({
  // The same path as `frontendRoute` in vite.config.ts
  history: createWebHistory("/next-pms"),
  routes,
});

// Login is checked in main.ts before the app mounts, so every navigation here
// is by a signed-in user.
router.beforeEach(async (to): Promise<RouteLocationRaw | true> => {
  if (to.meta.standalone) return true;

  const session = useSession();
  await session.load();
  // The lookups failed (the error handler has already shown a toast). Let the
  // page render rather than send everyone to "no employee".
  if (session.hasEmployee === null) return true;

  if (!session.hasEmployee) return { name: "no-employee", replace: true };
  if (to.meta.roles && !session.hasAnyRole(to.meta.roles)) {
    return { name: "no-access", replace: true };
  }
  return true;
});

router.afterEach((to: RouteLocationNormalized) => {
  document.title = to.meta.title ? `${to.meta.title} | Next PMS` : "Next PMS";
});

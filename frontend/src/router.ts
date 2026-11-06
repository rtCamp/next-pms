import {
  createRouter,
  createWebHistory,
  type RouteLocationRaw,
  type RouteLocationNormalized,
  type RouteRecordRaw,
} from "vue-router";
import { NOTE_EDITOR_ROUTES } from "./pages/project-details/notes/constants";
import { ROLE_ACCESS, useSession } from "./session";

const routes: RouteRecordRaw[] = [
  { path: "/", redirect: { name: "timesheet-personal" } },
  {
    path: "/timesheet",
    name: "timesheet-personal",
    component: () => import("./pages/timesheet/personal/PersonalTimesheet.vue"),
    meta: { title: "Timesheet", scroll: false },
  },
  {
    path: "/timesheet/team",
    name: "timesheet-team",
    component: () => import("./pages/timesheet/team/TeamTimesheet.vue"),
    meta: {
      title: "Team Timesheet",
      roles: ROLE_ACCESS.reviewTimesheets,
      scroll: false,
    },
  },
  {
    path: "/timesheet/project",
    name: "timesheet-project",
    component: () => import("./pages/timesheet/project/ProjectTimesheet.vue"),
    meta: {
      title: "Project Timesheet",
      roles: ROLE_ACCESS.reviewTimesheets,
      scroll: false,
    },
  },
  {
    path: "/projects",
    name: "project",
    component: () => import("./pages/projects/Projects.vue"),
    meta: { title: "Projects", roles: ROLE_ACCESS.projects, scroll: false },
  },
  {
    path: "/projects/:projectId",
    name: "project-details",
    component: () => import("./pages/project-details/ProjectDetails.vue"),
    meta: { title: "Project", roles: ROLE_ACCESS.projects, scroll: false },
    children: [
      { path: "notes/new", name: NOTE_EDITOR_ROUTES.new },
      { path: "notes/:noteId/edit", name: NOTE_EDITOR_ROUTES.edit },
      {
        path: "notes/templates/:templateId/edit",
        name: NOTE_EDITOR_ROUTES.template,
      },
    ].map((child): RouteRecordRaw => ({
      ...child,
      component: () => import("./pages/project-details/notes/NoteEditor.vue"),
    })),
  },
  {
    path: "/tasks",
    name: "task",
    component: () => import("./pages/tasks/TaskList.vue"),
    meta: { title: "Tasks", scroll: false },
  },
  {
    path: "/allocations/team",
    name: "allocations-team",
    component: () => import("./pages/allocations/team/TeamAllocations.vue"),
    meta: { title: "Team Allocations", scroll: false },
  },
  {
    path: "/allocations/project",
    name: "allocations-project",
    component: () =>
      import("./pages/allocations/project/ProjectAllocations.vue"),
    meta: { title: "Project Allocations", scroll: false },
  },
  {
    path: "/dashboard/leadership",
    name: "dashboard-leadership",
    component: () => import("./pages/dashboard/LeadershipDashboard.vue"),
    meta: {
      title: "Leadership Dashboard",
      roles: ROLE_ACCESS.leadershipDashboard,
    },
  },
  {
    path: "/dashboard/manager",
    name: "dashboard-manager",
    component: () => import("./pages/dashboard/ManagerDashboard.vue"),
    meta: { title: "Manager Dashboard", roles: ROLE_ACCESS.managerDashboard },
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
  { path: "/:pathMatch(.*)*", redirect: { name: "not-found" } },
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
  // The lookups failed: App.vue shows the session error instead of the page,
  // rather than everyone being sent to "no employee".
  if (session.error) return true;

  if (!session.hasEmployee) return { name: "no-employee", replace: true };
  if (to.meta.roles && !session.hasAnyRole(to.meta.roles)) {
    return { name: "not-found", replace: true };
  }
  return true;
});

router.afterEach((to: RouteLocationNormalized) => {
  document.title = to.meta.title ? `${to.meta.title} | Next PMS` : "Next PMS";
});

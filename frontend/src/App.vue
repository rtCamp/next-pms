<script setup lang="ts">
import { computed } from "vue";
import { DesktopShell, FrappeUIProvider, Spinner, useCall } from "frappe-ui";
import {
  useRoute,
  useRouter,
  type RouteLocationNormalizedLoaded,
} from "vue-router";
import { ErrorFallback } from "@/components/ErrorFallback";
import { provideNotifications } from "@/composables/useNotifications";
import type { AppLink } from "./layout/apps";
import AppSidebar from "./layout/AppSidebar.vue";
import SessionError from "./layout/SessionError.vue";
import { ROLE_ACCESS, useSession } from "./session";

const route = useRoute();
const router = useRouter();
const session = useSession();
const apps = useCall<AppLink[]>({
  url: "/api/v2/method/frappe.apps.get_apps",
});
provideNotifications(() => session.hasAnyRole(ROLE_ACCESS.notifications));

// The first navigation waits for the session in the router guard.
const starting = computed(() => route.matched.length === 0);
const sessionFailed = computed(
  () => !route.meta.standalone && Boolean(session.error),
);

// Runs the guards again now that the employee and roles are known.
function recheckRoute() {
  router.replace({ path: route.fullPath, force: true });
}

// A project's page stays mounted across its own child routes (the note editor),
// and any other new path is a new page, so /projects/A to /projects/B doesn't
// carry A's state over.
function viewKey(viewRoute: RouteLocationNormalizedLoaded) {
  return viewRoute.matched[0]?.name === "project-details"
    ? `project:${String(viewRoute.params.projectId)}`
    : viewRoute.path;
}
</script>

<template>
  <FrappeUIProvider>
    <div class="h-screen bg-surface-base text-ink-gray-8">
      <div
        v-if="starting"
        class="flex h-full items-center justify-center"
        role="status"
        aria-label="Loading"
      >
        <Spinner class="size-6 text-ink-gray-5" />
      </div>
      <SessionError v-else-if="sessionFailed" @loaded="recheckRoute" />
      <DesktopShell v-else :scroll="route.meta.scroll !== false">
        <template v-if="!route.meta.standalone" #sidebar>
          <AppSidebar
            :roles="session.roles"
            :employee="session.employee"
            :employee-name="session.employeeName"
            :apps="apps.data ?? []"
            @logout="session.logout()"
          />
        </template>
        <RouterView v-slot="{ Component, route: viewRoute }">
          <!-- Keyed with the page, so a new page starts without the last one's error. -->
          <ErrorFallback :key="viewKey(viewRoute)">
            <component :is="Component" />
          </ErrorFallback>
        </RouterView>
      </DesktopShell>
    </div>
  </FrappeUIProvider>
</template>

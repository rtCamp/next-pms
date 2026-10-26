<script setup lang="ts">
import { DesktopShell, FrappeUIProvider, useCall } from "frappe-ui";
import { useRoute, type RouteLocationNormalizedLoaded } from "vue-router";
import type { AppLink } from "./layout/apps";
import AppSidebar from "./layout/AppSidebar.vue";
import { useSession } from "./session";

const route = useRoute();
const session = useSession();
const apps = useCall<AppLink[]>({
  url: "/api/v2/method/frappe.apps.get_apps",
});

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
      <DesktopShell :scroll="route.meta.scroll !== false">
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
          <component :is="Component" :key="viewKey(viewRoute)" />
        </RouterView>
      </DesktopShell>
    </div>
  </FrappeUIProvider>
</template>

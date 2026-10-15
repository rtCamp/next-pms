<script setup lang="ts">
import { DesktopShell, FrappeUIProvider, useCall } from "frappe-ui";
import { useRoute } from "vue-router";
import type { AppLink } from "./layout/apps";
import AppSidebar from "./layout/AppSidebar.vue";
import { useSession } from "./session";

const route = useRoute();
const session = useSession();
const apps = useCall<AppLink[]>({
  url: "/api/v2/method/frappe.apps.get_apps",
});
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
        <RouterView />
      </DesktopShell>
    </div>
  </FrappeUIProvider>
</template>

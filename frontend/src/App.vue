<script setup lang="ts">
import { DesktopShell, FrappeUIProvider } from "frappe-ui";
import { useRoute } from "vue-router";
import AppSidebar from "./layout/AppSidebar.vue";
import { useSession } from "./session";

const route = useRoute();
const session = useSession();
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
            @logout="session.logout()"
          />
        </template>
        <RouterView />
      </DesktopShell>
    </div>
  </FrappeUIProvider>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  Button,
  DesktopShell,
  FrappeUIProvider,
  Spinner,
  useCall,
} from "frappe-ui";
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
import StatusMessage from "./layout/StatusMessage.vue";
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
// It fails when the page's code can't be loaded, e.g. offline or after a deploy.
const startFailed = ref(false);
router.isReady().catch(() => {
  startFailed.value = true;
});

// Set by a failed session load and cleared only once a retry has loaded it and the
// guards have checked the route: a retry clears `session.error` as it starts.
const sessionFailed = ref(false);
watch(
  () => session.error,
  (error) => {
    if (error) sessionFailed.value = true;
  },
  { immediate: true },
);

function reloadPage() {
  window.location.reload();
}

async function recheckRoute() {
  await router.replace({
    path: route.path,
    query: route.query,
    hash: route.hash,
    force: true,
  });
  sessionFailed.value = false;
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
      <StatusMessage
        v-if="starting && startFailed"
        icon="lucide-cloud-off"
        title="Couldn't load Next PMS"
        description="Check your connection and reload the page."
      >
        <Button
          variant="solid"
          icon-left="lucide-refresh-cw"
          label="Reload"
          @click="reloadPage"
        />
      </StatusMessage>
      <div v-else-if="starting" class="flex h-full items-center justify-center">
        <Spinner class="size-6 text-ink-gray-5" />
      </div>
      <SessionError
        v-else-if="sessionFailed && !route.meta.standalone"
        @loaded="recheckRoute"
      />
      <DesktopShell v-else :scroll="route.meta.scroll !== false">
        <template v-if="!route.meta.standalone" #sidebar>
          <ErrorFallback>
            <AppSidebar
              :roles="session.roles"
              :employee="session.employee"
              :employee-name="session.employeeName"
              :apps="apps.data ?? []"
              @logout="session.logout()"
            />
          </ErrorFallback>
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

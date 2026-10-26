<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  Button,
  ErrorMessage,
  SettingsBody,
  SettingsContent,
  SettingsDialog,
  SettingsHeader,
  SettingsNavGroup,
  SettingsNavItem,
  SettingsPanel,
  SettingsSidebar,
  Spinner,
  toast,
  useDoc,
} from "frappe-ui";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { usePmsSettings, type PmsSettings } from "@/composables/usePmsSettings";
import { ROLE_ACCESS, hasAnyRole, type Role } from "@/session";
import { errorMessage } from "@/utils/errors";
import ProfilePanel from "./ProfilePanel.vue";
import ResourceManagementPanel from "./ResourceManagementPanel.vue";
import { provideSystemSettingsForm } from "./settingsForm";
import SystemTimesheetsPanel from "./SystemTimesheetsPanel.vue";
import {
  changedFields,
  toForm,
  type SystemSettings,
  type SystemSettingsForm,
} from "./systemSettings";
import TimesheetsPanel from "./TimesheetsPanel.vue";

const props = defineProps<{ roles: readonly Role[] }>();

defineOptions({ inheritAttrs: false });

const open = defineModel<boolean>("open", { default: false });
const tab = ref("profile");
const canManageSystem = computed(() =>
  hasAnyRole(props.roles, ROLE_ACCESS.systemSettings),
);

const pms = usePmsSettings();
const userForm = reactive({ weeks: "", useSystem: true });

function savedUserForm(data: PmsSettings | null) {
  const weeks = data?.auto_expand_weeks_by_default;
  return {
    weeks: weeks === null || weeks === undefined ? "" : String(weeks),
    useSystem: Boolean(data?.use_system_auto_expand_weeks ?? true),
  };
}

function resetUserForm() {
  Object.assign(userForm, savedUserForm(pms.data));
}

const userDirty = computed(() => {
  const saved = savedUserForm(pms.data);
  return (
    userForm.weeks !== saved.weeks || userForm.useSystem !== saved.useSystem
  );
});

const systemDoc = useDoc<SystemSettings>({
  doctype: "Timesheet Settings",
  name: "Timesheet Settings",
  immediate: false,
});
const savedSystem = ref<SystemSettingsForm>({});
const systemForm = reactive<SystemSettingsForm>({});
provideSystemSettingsForm(systemForm);

function resetSystemForm() {
  Object.assign(systemForm, savedSystem.value);
}

const systemChanges = computed(() =>
  changedFields(savedSystem.value, systemForm),
);
const systemDirty = computed(() => Object.keys(systemChanges.value).length > 0);

// A reload (on open, after a save) keeps the edits made while it was in flight.
watch(
  () => pms.data,
  (_data, previous) => {
    const saved = savedUserForm(previous ?? null);
    if (
      userForm.weeks === saved.weeks &&
      userForm.useSystem === saved.useSystem
    ) {
      resetUserForm();
    }
  },
  { immediate: true },
);
watch(
  () => systemDoc.doc,
  (doc) => {
    if (!doc) return;
    const edited = systemDirty.value;
    savedSystem.value = toForm(doc);
    if (!edited) resetSystemForm();
  },
);

watch(
  open,
  (isOpen) => {
    if (!isOpen) return;
    pms.reload();
    if (canManageSystem.value) systemDoc.reload();
  },
  { immediate: true },
);

const savingUser = ref(false);
async function saveUser(): Promise<boolean> {
  savingUser.value = true;
  try {
    await pms.save({
      auto_expand_weeks_by_default:
        userForm.weeks === "" ? null : Number(userForm.weeks),
      use_system_auto_expand_weeks: userForm.useSystem ? 1 : 0,
    });
    toast.success("Settings saved");
    return true;
  } catch (error) {
    toast.error(errorMessage(error));
    return false;
  } finally {
    savingUser.value = false;
  }
}

async function saveSystem(): Promise<boolean> {
  try {
    await systemDoc.setValue.submit(systemChanges.value);
    toast.success("Settings saved");
    // The user tab shows the system default for expanded weeks.
    pms.reload();
    return true;
  } catch (error) {
    toast.error(errorMessage(error));
    return false;
  }
}

const confirmClose = ref(false);

function onOpenChange(next: boolean) {
  if (!next && (userDirty.value || systemDirty.value)) {
    confirmClose.value = true;
    return;
  }
  open.value = next;
}

async function saveAndClose() {
  confirmClose.value = false;
  const saved = [
    !userDirty.value || (await saveUser()),
    !systemDirty.value || (await saveSystem()),
  ];
  if (saved.every(Boolean)) open.value = false;
}

function discardAndClose() {
  confirmClose.value = false;
  resetUserForm();
  resetSystemForm();
  open.value = false;
}
</script>

<template>
  <SettingsDialog v-model:tab="tab" :open="open" @update:open="onOpenChange">
    <SettingsSidebar>
      <SettingsNavGroup label="User Configuration">
        <SettingsNavItem value="profile">
          <template #prefix>
            <span class="lucide-user size-4 text-ink-gray-6" />
          </template>
          Profile
        </SettingsNavItem>
        <SettingsNavItem value="timesheets">
          <template #prefix>
            <span class="lucide-clock size-4 text-ink-gray-6" />
          </template>
          Timesheets
        </SettingsNavItem>
      </SettingsNavGroup>
      <SettingsNavGroup v-if="canManageSystem" label="System Configuration">
        <SettingsNavItem value="system-timesheets">
          <template #prefix>
            <span class="lucide-clock size-4 text-ink-gray-6" />
          </template>
          Timesheets
        </SettingsNavItem>
        <SettingsNavItem value="system-resource-management">
          <template #prefix>
            <span class="lucide-users size-4 text-ink-gray-6" />
          </template>
          Resource Management
        </SettingsNavItem>
      </SettingsNavGroup>
    </SettingsSidebar>

    <SettingsContent>
      <SettingsPanel value="profile">
        <SettingsHeader
          title="Profile"
          description="Manage your profile and login information."
        />
        <SettingsBody><ProfilePanel /></SettingsBody>
      </SettingsPanel>

      <SettingsPanel value="timesheets">
        <SettingsHeader
          title="Timesheets"
          description="Configure your timesheet preferences."
        >
          <template #actions>
            <Button
              variant="solid"
              label="Save"
              :loading="savingUser"
              :disabled="!userDirty || !pms.data"
              @click="saveUser"
            />
          </template>
        </SettingsHeader>
        <SettingsBody>
          <div v-if="!pms.data" class="flex justify-center">
            <Spinner v-if="pms.loading" class="size-6" />
            <ErrorMessage
              v-else-if="pms.error"
              :message="errorMessage(pms.error)"
            />
          </div>
          <TimesheetsPanel
            v-else
            v-model:weeks="userForm.weeks"
            v-model:use-system="userForm.useSystem"
            :system-weeks="pms.data?.system_auto_expand_weeks_by_default"
          />
        </SettingsBody>
      </SettingsPanel>

      <template v-if="canManageSystem">
        <SettingsPanel
          v-for="panel in [
            {
              value: 'system-timesheets',
              title: 'Timesheets',
              description: 'Configure global timesheet defaults.',
            },
            {
              value: 'system-resource-management',
              title: 'Resource Management',
              description: 'Configure global resource management settings.',
            },
          ]"
          :key="panel.value"
          :value="panel.value"
        >
          <SettingsHeader :title="panel.title" :description="panel.description">
            <template #actions>
              <Button
                variant="solid"
                label="Save"
                :loading="systemDoc.setValue.loading"
                :disabled="!systemDirty"
                @click="saveSystem"
              />
            </template>
          </SettingsHeader>
          <SettingsBody>
            <div v-if="!systemDoc.doc" class="flex justify-center">
              <Spinner v-if="systemDoc.loading" class="size-6" />
              <ErrorMessage
                v-else-if="systemDoc.error"
                :message="errorMessage(systemDoc.error)"
              />
            </div>
            <SystemTimesheetsPanel
              v-else-if="panel.value === 'system-timesheets'"
            />
            <ResourceManagementPanel v-else />
          </SettingsBody>
        </SettingsPanel>
      </template>
    </SettingsContent>
  </SettingsDialog>

  <UnsavedChangesDialog
    v-if="confirmClose"
    :open="confirmClose"
    @keep-editing="confirmClose = false"
    @discard="discardAndClose"
    @save="saveAndClose"
  />
</template>

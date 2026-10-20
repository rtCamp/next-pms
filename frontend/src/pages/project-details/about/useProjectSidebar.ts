import {
  computed,
  inject,
  provide,
  reactive,
  watch,
  type InjectionKey,
} from "vue";
import { toast, useCall } from "frappe-ui";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { errorMessage } from "@/utils/errors";
import {
  SHARE_ADD_METHOD,
  SHARE_SET_PERMISSION_METHOD,
  SIDEBAR_METHOD,
} from "./constants";
import {
  billingTeamUserIds,
  planManagerChange,
  splitMembers,
  toCustomers,
  toMembers,
} from "./sidebar";
import type { ManagerRole, ProjectSidebar } from "./types";

type ShareParams = Record<string, string | number>;

function createProjectSidebar() {
  const { projectId, doc, setValue } = useProjectDetails();

  const call = useCall<ProjectSidebar, { project: string }>({
    url: SIDEBAR_METHOD,
    params: () => ({ project: projectId.value }),
    refetch: true,
  });
  const shareAdd = useCall<unknown, ShareParams>({
    url: SHARE_ADD_METHOD,
    method: "POST",
    immediate: false,
  });
  const shareSetPermission = useCall<unknown, ShareParams>({
    url: SHARE_SET_PERMISSION_METHOD,
    method: "POST",
    immediate: false,
  });

  /** Keys of the writes queued or running, e.g. `member:<user>`. */
  const busy = reactive(new Set<string>());
  let queue: Promise<void> = Promise.resolve();

  // A Project change, from a realtime update or any save on the page, can change
  // what the sidebar shows. A queued write refetches when it's done instead.
  watch(
    () => doc.value?.modified,
    (modified, previous) => {
      if (busy.size) return;
      if (previous && modified !== previous) call.reload();
    },
  );

  const sidebar = computed(() => call.data);
  const members = computed(() =>
    sidebar.value ? toMembers(sidebar.value) : [],
  );
  const split = computed(() => splitMembers(members.value));
  const customers = computed(() =>
    sidebar.value ? toCustomers(sidebar.value) : [],
  );

  /**
   * Runs writes one at a time, as each call aborts its own previous request, and
   * refetches the sidebar after each so the next one checks the latest members.
   * A key already queued is ignored (double clicks).
   */
  function enqueue(key: string, write: () => Promise<void>) {
    if (busy.has(key)) return queue;
    busy.add(key);
    queue = queue.then(async () => {
      try {
        await write();
      } catch (error) {
        toast.error(errorMessage(error));
      } finally {
        await call.reload();
        if (call.error) toast.error(errorMessage(call.error));
        busy.delete(key);
      }
    });
    return queue;
  }

  function memberUserIds() {
    return sidebar.value?.members.map((member) => member.user) ?? [];
  }

  function share(userId: string) {
    return shareAdd.submit({
      doctype: "Project",
      name: projectId.value,
      user: userId,
      notify: 1,
      read: 1,
      write: 0,
      submit: 0,
      share: 0,
    });
  }

  function unshare(userId: string) {
    return shareSetPermission.submit({
      doctype: "Project",
      name: projectId.value,
      user: userId,
      permission_to: "read",
      value: 0,
      everyone: 0,
    });
  }

  function addMember(userId: string) {
    return enqueue(`member:${userId}`, async () => {
      if (memberUserIds().includes(userId)) return;
      await share(userId);
    });
  }

  function removeMember(userId: string) {
    return enqueue(`member:${userId}`, async () => {
      await unshare(userId);
    });
  }

  function updateManager(role: ManagerRole, userId: string | null) {
    return enqueue(`manager:${role}`, async () => {
      if (
        userId &&
        sidebar.value &&
        billingTeamUserIds(sidebar.value).has(userId)
      ) {
        toast.error("Billing team members cannot be assigned as a manager");
        return;
      }
      const project = doc.value;
      if (!project) return;
      const change = planManagerChange(role, userId, project, memberUserIds());
      await setValue({ [change.field]: userId ?? "" });
      if (change.shareWith) await share(change.shareWith);
      if (change.unshareFrom) await unshare(change.unshareFrom);
    });
  }

  function contactIds() {
    return (doc.value?.custom_customer_contacts ?? []).map(
      (row) => row.contact,
    );
  }

  function setContacts(ids: string[]) {
    return setValue({
      custom_customer_contacts: ids.map((contact) => ({ contact })),
    });
  }

  function addCustomer(contactId: string) {
    return enqueue(`customer:${contactId}`, async () => {
      const ids = contactIds();
      if (ids.includes(contactId)) return;
      await setContacts([...ids, contactId]);
    });
  }

  function removeCustomer(contactId: string) {
    return enqueue(`customer:${contactId}`, async () => {
      await setContacts(contactIds().filter((id) => id !== contactId));
    });
  }

  return {
    sidebar,
    /** True only while nothing has loaded yet. */
    loading: computed(() => call.loading && !call.data),
    /** Set when the sidebar couldn't be loaded at all. */
    error: computed(() => (call.data ? null : call.error)),
    reload: () => call.reload(),
    projectManager: computed(() => split.value.projectManager),
    engineeringManager: computed(() => split.value.engineeringManager),
    teamMembers: computed(() => split.value.team),
    customers,
    /** Contacts on the Project, including any the sidebar couldn't load. */
    customerContactIds: computed(contactIds),
    isBusy: (key: string) => busy.has(key),
    addMember,
    removeMember,
    updateManager,
    addCustomer,
    removeCustomer,
  };
}

export type ProjectSidebarState = ReturnType<typeof createProjectSidebar>;

const projectSidebarKey: InjectionKey<ProjectSidebarState> =
  Symbol("projectSidebar");

/** Loads the About sidebar's data and provides it, with its writes, to the sections. */
export function provideProjectSidebar(): ProjectSidebarState {
  const state = createProjectSidebar();
  provide(projectSidebarKey, state);
  return state;
}

/** The sidebar state provided by the About sidebar. */
export function useProjectSidebar(): ProjectSidebarState {
  const state = inject(projectSidebarKey);
  if (!state) {
    throw new Error(
      "useProjectSidebar() needs provideProjectSidebar() in a parent",
    );
  }
  return state;
}

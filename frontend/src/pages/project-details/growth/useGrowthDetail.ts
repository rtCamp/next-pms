import { computed, ref } from "vue";
import { dialog, FrappeResponseError, toast, useCall } from "frappe-ui";
import { canManageUpdate } from "@/pages/project-details/shared/permissions";
import {
  documentUrl,
  useDocumentWrite,
} from "@/pages/project-details/shared/useDocumentWrite";
import { useFollow } from "@/pages/project-details/shared/useFollow";
import { useOwnerGatedPermissions } from "@/pages/project-details/shared/useOwnerGatedPermissions";
import {
  useAttachments,
  useFollowers,
} from "@/pages/project-details/shared/useRecordExtras";
import { useUserDetails } from "@/pages/project-details/shared/useUserDetails";
import { useSession } from "@/session";
import { errorMessage, isAbortError } from "@/utils/errors";
import { GROWTH_DOCTYPE } from "./constants";
import {
  addedGrowthUpdateLog,
  deletedGrowthUpdateLog,
  editedGrowthUpdateLog,
  growthDetailUserIds,
  growthUpdateItems,
} from "./growth";
import type { GrowthDoc, GrowthUpdate, GrowthUpdateForm } from "./types";
import { useGrowth } from "./useGrowth";

/**
 * One growth initiative for the detail view: the document with its people, files,
 * followers and updates, follow, and the update log's writes. Reloads after any
 * change to an initiative, ToDo link writes included.
 */
export function useGrowthDetail(growthId: string) {
  const session = useSession();
  const growth = useGrowth();

  const doc = useCall<GrowthDoc>({
    url: documentUrl(GROWTH_DOCTYPE, growthId),
  });
  const initiative = computed(() => doc.data);
  const error = computed(() =>
    doc.error && !isAbortError(doc.error) ? doc.error : null,
  );
  const notFound = computed(
    () =>
      error.value instanceof FrappeResponseError &&
      error.value.type === "DoesNotExistError",
  );

  const users = useUserDetails(
    () => growthDetailUserIds(initiative.value),
    "userDetails",
  );
  const updates = computed(() =>
    growthUpdateItems(initiative.value?.update_log ?? [], users.value),
  );

  const attachments = useAttachments(GROWTH_DOCTYPE, growthId);
  const followers = useFollowers(GROWTH_DOCTYPE, growthId);
  const isFollowing = computed(() =>
    followers.followers.value.some(
      (follower) => follower.userId === session.userId,
    ),
  );
  const { toggleFollow: updateFollow } = useFollow(GROWTH_DOCTYPE);

  async function toggleFollow() {
    if (await updateFollow(growthId, isFollowing.value)) followers.reload();
  }

  const permissions = useOwnerGatedPermissions(
    () => initiative.value?.activity_owner,
  );

  function canManage(update: GrowthUpdate) {
    return canManageUpdate(
      permissions.value.canEdit,
      session.roles,
      session.userId,
      update.updated_by,
    );
  }

  const reload = () => doc.reload();
  growth.onGrowthChanged(reload);

  /** The Add / Edit update dialog: open while `updateDialogOpen`; `editingUpdate` is `null` when adding. */
  const updateDialogOpen = ref(false);
  const editingUpdate = ref<GrowthUpdate | null>(null);
  const savingUpdate = ref(false);

  function openAddUpdate() {
    editingUpdate.value = null;
    updateDialogOpen.value = true;
  }

  function openEditUpdate(update: GrowthUpdate) {
    editingUpdate.value = update;
    updateDialogOpen.value = true;
  }

  function closeUpdateDialog() {
    updateDialogOpen.value = false;
  }

  const saveLog = useDocumentWrite(GROWTH_DOCTYPE, "PUT");

  function writeLog(current: GrowthDoc, log: unknown[]) {
    return growth.localWrite(
      () =>
        saveLog(current.name, { modified: current.modified, update_log: log }),
      () => current.name,
    );
  }

  /** Adds an update, or saves the one being edited; resolves `true` once saved. */
  async function saveUpdate(form: GrowthUpdateForm): Promise<boolean> {
    const current = initiative.value;
    if (!current || savingUpdate.value) return false;
    const editing = editingUpdate.value;
    const closing = growth.isClosing(form.status);
    savingUpdate.value = true;
    try {
      await writeLog(
        current,
        editing
          ? editedGrowthUpdateLog(current, editing.name, form, closing)
          : addedGrowthUpdateLog(current, form, closing),
      );
    } catch (error) {
      if (!isAbortError(error)) toast.error(errorMessage(error));
      return false;
    } finally {
      savingUpdate.value = false;
    }
    toast.success(editing ? "Update saved" : "Update added");
    reload();
    growth.refresh();
    return true;
  }

  function requestDeleteUpdate(update: GrowthUpdate) {
    dialog.danger({
      title: "Delete update",
      message:
        "Are you sure you want to delete this update? This action cannot be undone.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        const current = initiative.value;
        if (!current) return;
        try {
          await writeLog(current, deletedGrowthUpdateLog(current, update.name));
        } catch (error) {
          throw new Error(errorMessage(error));
        }
        toast.success("Update deleted");
        reload();
        growth.refresh();
      },
    });
  }

  return {
    initiative,
    /** The first read is still running. */
    loading: computed(() => doc.loading && !doc.data),
    /** The read failed for another reason than a missing initiative. */
    loadError: computed(() => (notFound.value ? null : error.value)),
    notFound,
    reload,
    users,
    updates,
    files: attachments.files,
    reloadFiles: attachments.reload,
    followers: followers.followers,
    isFollowing,
    toggleFollow,
    permissions,
    canManage,
    updateDialogOpen,
    editingUpdate,
    savingUpdate,
    openAddUpdate,
    openEditUpdate,
    closeUpdateDialog,
    saveUpdate,
    requestDeleteUpdate,
  };
}

export type GrowthDetailState = ReturnType<typeof useGrowthDetail>;

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
import { RISK_DOCTYPE } from "./constants";
import {
  addedUpdateLog,
  deletedUpdateLog,
  editedUpdateLog,
  riskDetailUserIds,
  riskUpdateItems,
} from "./risks";
import type { RiskDoc, RiskUpdate, RiskUpdateForm } from "./types";
import { useRisks } from "./useRisks";

/**
 * One risk for the detail view: the document with its people, files, followers and
 * updates, follow, and the update log's writes. Reloads after any change to a risk.
 */
export function useRiskDetail(riskId: string) {
  const session = useSession();
  const risks = useRisks();

  const doc = useCall<RiskDoc>({ url: documentUrl(RISK_DOCTYPE, riskId) });
  const risk = computed(() => doc.data);
  const error = computed(() =>
    doc.error && !isAbortError(doc.error) ? doc.error : null,
  );
  const notFound = computed(
    () =>
      error.value instanceof FrappeResponseError &&
      error.value.type === "DoesNotExistError",
  );

  const users = useUserDetails(() => riskDetailUserIds(risk.value));
  const updates = computed(() =>
    riskUpdateItems(risk.value?.risk_update_log ?? [], users.value),
  );

  const attachments = useAttachments(RISK_DOCTYPE, riskId);
  const followers = useFollowers(RISK_DOCTYPE, riskId);
  const isFollowing = computed(() =>
    followers.followers.value.some(
      (follower) => follower.userId === session.userId,
    ),
  );
  const { toggleFollow: updateFollow } = useFollow(RISK_DOCTYPE);

  async function toggleFollow() {
    if (await updateFollow(riskId, isFollowing.value)) followers.reload();
  }

  const permissions = useOwnerGatedPermissions(() => risk.value?.risk_owner);

  function canManage(update: RiskUpdate) {
    return canManageUpdate(
      permissions.value.canEdit,
      session.roles,
      session.userId,
      update.updated_by,
    );
  }

  const reload = () => doc.reload();
  risks.onRisksChanged((name) => {
    if (!name || name === riskId) reload();
  });

  /** The Add / Edit update dialog: open while `updateDialogOpen`; `editingUpdate` is `null` when adding. */
  const updateDialogOpen = ref(false);
  const editingUpdate = ref<RiskUpdate | null>(null);
  const savingUpdate = ref(false);

  function openAddUpdate() {
    editingUpdate.value = null;
    updateDialogOpen.value = true;
  }

  function openEditUpdate(update: RiskUpdate) {
    editingUpdate.value = update;
    updateDialogOpen.value = true;
  }

  function closeUpdateDialog() {
    updateDialogOpen.value = false;
  }

  const saveLog = useDocumentWrite(RISK_DOCTYPE, "PUT");

  function writeLog(current: RiskDoc, log: unknown[]) {
    return risks.localWrite(
      () =>
        saveLog(current.name, {
          modified: current.modified,
          risk_update_log: log,
        }),
      () => current.name,
    );
  }

  /** Adds an update, or saves the one being edited; resolves `true` once saved. */
  async function saveUpdate(form: RiskUpdateForm): Promise<boolean> {
    const current = risk.value;
    if (!current || savingUpdate.value) return false;
    const editing = editingUpdate.value;
    savingUpdate.value = true;
    try {
      await writeLog(
        current,
        editing
          ? editedUpdateLog(current, editing.name, form)
          : addedUpdateLog(current, form),
      );
    } catch (error) {
      if (!isAbortError(error)) toast.error(errorMessage(error));
      return false;
    } finally {
      savingUpdate.value = false;
    }
    reload();
    risks.refresh();
    return true;
  }

  function requestDeleteUpdate(update: RiskUpdate) {
    dialog.danger({
      title: "Delete update",
      message:
        "Are you sure you want to delete this update? This action cannot be undone.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        const current = risk.value;
        if (!current) return;
        try {
          await writeLog(current, deletedUpdateLog(current, update.name));
        } catch (error) {
          throw new Error(errorMessage(error));
        }
        toast.success("Update deleted");
        reload();
        risks.refresh();
      },
    });
  }

  function onUploaded() {
    attachments.reload();
    reload();
  }

  return {
    risk,
    /** The first read is still running. */
    loading: computed(() => doc.loading && !doc.data),
    /** The first read failed for another reason than a missing risk; a failed reload keeps the risk shown. */
    loadError: computed(() =>
      notFound.value || doc.data ? null : error.value,
    ),
    notFound,
    reload,
    users,
    updates,
    files: attachments.files,
    onUploaded,
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

export type RiskDetailState = ReturnType<typeof useRiskDetail>;

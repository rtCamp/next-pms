import { computed, reactive, ref, shallowRef, watch } from "vue";
import { toast, useCall } from "frappe-ui";
import { useCustomerLookup } from "@/composables/useCustomerLookup";
import { useEmployeeLookup } from "@/composables/useEmployeeLookup";
import { useProjectEmployeeAccess } from "@/composables/useProjectEmployeeAccess";
import {
  useProjectLookup,
  type ProjectLookupOption,
} from "@/composables/useProjectLookup";
import { errorMessage } from "@/utils/errors";
import {
  allocationEditLocks,
  allocationPayload,
  computeTotalHours,
  emptyAllocationForm,
  formFromRequest,
  formRefreshTargets,
  lastBookedDate,
  validateAllocationForm,
  type AllocationForm,
  type AllocationFormContext,
  type AllocationFormErrors,
  type AllocationPayload,
} from "./allocationForm";
import type { AllocationDialogs } from "./useAllocationDialogs";
import { useEmployeeAvailability } from "./useEmployeeAvailability";
import { useOverAllocation } from "./useOverAllocation";

const ALLOCATION_METHOD =
  "/api/v2/method/next_pms.resource_management.api.allocation";

/** Projects an allocation can be booked on. */
const ALLOCATABLE_PROJECT_FILTERS = [
  ["status", "!=", "Cancelled"],
  ["is_active", "=", "Yes"],
];

/**
 * The Add / Edit allocation dialog's state: the fields, their lookups, the checks shown
 * while editing (project access, over-allocation, availability) and the save.
 */
export function useAllocationForm(dialogs: AllocationDialogs) {
  const open = computed(() => dialogs.form.open);
  const mode = computed(() => dialogs.form.request?.mode ?? "add");

  const form = reactive<AllocationForm>(emptyAllocationForm());
  const context = shallowRef<AllocationFormContext>({
    isAiCreated: false,
    override: [],
  });
  const errors = reactive<AllocationFormErrors>({});
  const employeeImage = ref<string>();
  const employeeQuery = ref("");
  const projectQuery = ref("");
  const submitting = ref(false);

  function clearErrors() {
    for (const key of Object.keys(errors)) {
      delete errors[key as keyof AllocationForm];
    }
  }

  watch(
    open,
    (isOpen) => {
      const request = dialogs.form.request;
      if (!isOpen || !request) return;
      const next = formFromRequest(
        request.mode,
        request.data,
        request.customerId,
      );
      Object.assign(form, next.form);
      context.value = next.context;
      employeeImage.value = undefined;
      employeeQuery.value = "";
      projectQuery.value = "";
      clearErrors();
    },
    { immediate: true },
  );

  // A field's error goes away once it changes.
  for (const key of Object.keys(
    emptyAllocationForm(),
  ) as (keyof AllocationForm)[]) {
    watch(
      () => form[key],
      () => delete errors[key],
    );
  }

  const locks = computed(() => allocationEditLocks(mode.value, context.value));

  const employeeLookup = useEmployeeLookup({
    enabled: open,
    query: () =>
      employeeQuery.value === form.employeeLabel ? "" : employeeQuery.value,
    projectId: () => form.projectId,
    selected: () =>
      form.employeeId
        ? {
            label: form.employeeLabel || form.employeeId,
            value: form.employeeId,
            image: employeeImage.value,
          }
        : null,
  });

  const projectLookup = useProjectLookup({
    enabled: open,
    query: () =>
      projectQuery.value === form.projectLabel ? "" : projectQuery.value,
    employeeId: () => form.employeeId,
    filters: ALLOCATABLE_PROJECT_FILTERS,
    selected: () =>
      form.projectId
        ? {
            label: form.projectLabel || form.projectId,
            value: form.projectId,
            customer: form.customerId || undefined,
          }
        : null,
  });

  const customerLookup = useCustomerLookup({
    enabled: () => open.value && Boolean(form.customerId),
    query: () => form.customerId,
    selected: () =>
      form.customerId
        ? {
            label: form.customerLabel || form.customerId,
            value: form.customerId,
          }
        : null,
  });

  function setEmployee(value: string | number | null | undefined) {
    const employeeId = value ? String(value) : "";
    const option = employeeLookup.options.find(
      (candidate) => candidate.value === employeeId,
    );
    form.employeeId = employeeId;
    form.employeeLabel = option?.label ?? employeeId;
    employeeImage.value = option?.image;
  }

  function setProject(value: string | number | null | undefined) {
    const projectId = value ? String(value) : "";
    const option = projectLookup.options.find(
      (candidate) => candidate.value === projectId,
    ) as ProjectLookupOption | undefined;
    form.projectId = projectId;
    form.projectLabel = option?.label ?? projectId;
    form.customerId = option?.customer ?? "";
    form.customerLabel = "";
  }

  const access = useProjectEmployeeAccess({
    projectId: () => form.projectId,
    employeeId: () => form.employeeId,
    enabled: open,
  });
  const projectHasNoMembers = computed(
    () => Boolean(form.projectId) && access.hasAnswer && !access.hasAnyMember,
  );
  const employeeHasNoProjects = computed(
    () => Boolean(form.employeeId) && access.hasAnswer && !access.hasAnyProject,
  );
  const isMismatch = computed(
    () =>
      Boolean(form.projectId && form.employeeId) &&
      access.hasAnswer &&
      !access.isValid,
  );
  const isAccessPending = computed(
    () =>
      access.loading ||
      (Boolean(form.projectId || form.employeeId) && !access.hasAnswer),
  );
  const isAiAccessUnavailable = computed(
    () => context.value.isAiCreated && !access.loading && !access.hasAnswer,
  );

  const repeatWeeks = computed(() =>
    mode.value === "add" && form.recurrence === "recurring"
      ? Math.max(0, form.repeatFor ?? 0)
      : 0,
  );
  const overAllocatedDays = useOverAllocation(() => ({
    enabled: open.value,
    employeeId: form.employeeId,
    fromDate: form.fromDate,
    toDate: form.toDate,
    hoursPerDay: form.hoursPerDay,
    includeWeekends: form.includeWeekends,
    includeHolidays: form.includeHolidays,
    repeatWeeks: repeatWeeks.value,
    allocationId: context.value.allocationId,
  }));
  const availability = useEmployeeAvailability({
    employeeId: () => form.employeeId,
    startDate: () => form.fromDate,
    endDate: () => lastBookedDate(form),
    includeWeekends: () => form.includeWeekends,
    enabled: open,
  });
  const totalHours = computed(() =>
    computeTotalHours({ ...form, availability: availability.value }),
  );

  const handleAllocation = useCall<
    unknown,
    { allocation: AllocationPayload; repeat_till_week_count: number }
  >({
    url: `${ALLOCATION_METHOD}.handle_allocation`,
    method: "POST",
    immediate: false,
  });
  const editAllocation = useCall<
    unknown,
    { name: string; edit_mode: "only_this"; allocation: AllocationPayload }
  >({
    url: `${ALLOCATION_METHOD}.edit_allocation`,
    method: "POST",
    immediate: false,
  });

  function close() {
    dialogs.form.open = false;
  }

  /** Saves the form; on success closes, refreshes the touched rows and clears the draft. */
  async function save() {
    const request = dialogs.form.request;
    const allocation = allocationPayload(form, context.value);
    const allocationId = context.value.allocationId;
    const targets = formRefreshTargets(form, context.value);
    submitting.value = true;
    try {
      await dialogs.runWrite(async () => {
        if (mode.value === "edit" && allocationId) {
          await editAllocation.submit({
            name: allocationId,
            edit_mode: "only_this",
            allocation,
          });
        } else {
          await handleAllocation.submit({
            allocation,
            repeat_till_week_count:
              form.recurrence === "recurring" ? (form.repeatFor ?? 0) : 0,
          });
        }
        toast.success(
          context.value.isAiCreated
            ? "Allocation approved successfully"
            : mode.value === "edit"
              ? "Allocation updated successfully"
              : "Allocation created successfully",
        );
        close();
        await dialogs.refresh(targets);
        request?.data.onSuccess?.();
      });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      submitting.value = false;
    }
  }

  /** Whether an AI allocation's approval would add the employee to the project's team. */
  const approveConfirmOpen = ref(false);

  async function submit() {
    clearErrors();
    Object.assign(errors, validateAllocationForm(form));
    if (Object.keys(errors).length) return;
    if (context.value.isAiCreated) {
      if (isAccessPending.value) {
        toast.error(
          "Project access is still being checked. Please wait and try again.",
        );
        return;
      }
      if (!access.hasAnswer) {
        toast.error(
          "Unable to verify project access. Please retry the access check.",
        );
        access.retry();
        return;
      }
      if (isMismatch.value) {
        approveConfirmOpen.value = true;
        return;
      }
    }
    await save();
  }

  async function confirmApproval() {
    approveConfirmOpen.value = false;
    await save();
  }

  const canSubmit = computed(
    () =>
      !submitting.value &&
      !(locks.value.isMetadataLocked && !locks.value.canApproveLocked) &&
      !(
        context.value.isAiCreated &&
        (isAccessPending.value || !access.hasAnswer)
      ) &&
      !(isMismatch.value && !context.value.isAiCreated),
  );

  return reactive({
    open,
    mode,
    form,
    context,
    errors,
    locks,
    employeeQuery,
    projectQuery,
    employeeLookup,
    projectLookup,
    customerLookup,
    setEmployee,
    setProject,
    access,
    projectHasNoMembers,
    employeeHasNoProjects,
    isMismatch,
    isAiAccessUnavailable,
    overAllocatedDays,
    availability,
    totalHours,
    submitting,
    canSubmit,
    approveConfirmOpen,
    submit,
    confirmApproval,
    close,
  });
}

export type AllocationFormState = ReturnType<typeof useAllocationForm>;

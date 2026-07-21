/**
 * External Dependencies
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Accordion } from "@base-ui/react/accordion";
import { floatToTime, mergeClassNames as cn } from "@next-pms/design-system";
import { ApprovalStatus } from "@next-pms/design-system/components";
import { stripTags } from "@next-pms/design-system/utils";
import {
  Alert,
  Badge,
  Button,
  StaticTextEditor,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { EditAlt, Compose, AddSm, Delete } from "@rtcamp/frappe-ui-react/icons";
import { useStore } from "@tanstack/react-form";
import { FrappeError, useFrappePostCall } from "frappe-react-sdk";

/**
 * Internal Dependencies
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useUnsavedChangesSource } from "@/pages/allocations/unsavedChanges/useUnsavedChanges";
import { TaskDataItemProps } from "@/types/timesheet";
import { useInlineTimeEntryForm } from "./form";
import { TimeEntryForm } from "./timeEntryForm";
import type { InlineTimeEntryProps, TimeEntryFormValues } from "./types";
import { useResizeEngagement } from "./useResizeEngagement";

export const ENTRY_FORM_MODE = {
  DEFAULT: "default",
  ADD: "add",
  EDIT: "edit",
} as const;

export type EntryFormMode =
  (typeof ENTRY_FORM_MODE)[keyof typeof ENTRY_FORM_MODE];

/**
 * InlineTimeEntry Component
 * @description This component is used to show inline time entry form in the popover when user clicks on
 * the cell in task row of timesheet table.User can enter the duration and comment for the time entry and
 * submit the form to save the time entry for the task and date.
 * @param date - Date for which the time entry is being added.
 * @param taskKey - Task name for the timesheet entry (eg: TASK-0001).
 * @param employee - Employee for the timesheet entry
 * @param dailyWorkingHours - Daily working hours for the task.
 * @param totalUsedHoursInDay - Total used hours in the day for the task.
 * @param onSubmitSuccess - Callback function to be called after successful submission of time entry.
 * @param timeEntry - Time entry data for the cell
 * @param tasks - All time entries for the task for the day.
 * @param disabled - Whether the time entry form is disabled or not.
 */
export const InlineTimeEntry = ({
  date,
  taskKey,
  employee,
  dailyWorkingHours = 8,
  totalUsedHoursInDay,
  onSubmitSuccess,
  onEngagedChange,
  timeEntry,
  tasks,
  disabled,
}: InlineTimeEntryProps) => {
  const toast = useToasts();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [entryFormMode, setEntryFormMode] = useState<EntryFormMode>(
    ENTRY_FORM_MODE.DEFAULT,
  );
  const [selectedEntry, setSelectedEntry] = useState<TaskDataItemProps | null>(
    null,
  );
  const [addDraft, setAddDraft] = useState<{
    duration: number;
    comment: string;
  } | null>(null);
  const {
    isResizeActive: commentResizeActive,
    onResizePointerDown: handleCommentPointerDown,
  } = useResizeEngagement();
  const [collapsedEntryNames, setCollapsedEntryNames] = useState<string[]>([]);
  const [stayEngaged, setStayEngaged] = useState(false);
  const hasInitializedInteractiveModeRef = useRef(false);
  const editBaselineRef = useRef<{
    duration: number;
    comment: string;
    date: string;
  } | null>(null);
  const pendingProceedAfterSaveRef = useRef<(() => void) | null>(null);
  const frozenTasksRef = useRef(tasks);

  const { call: saveTime, loading: isSaving } = useFrappePostCall(
    "next_pms.timesheet.api.timesheet.save",
  );
  const { call: updateTimesheet, loading: isUpdating } = useFrappePostCall(
    "next_pms.timesheet.api.timesheet.bulk_update_timesheet_detail",
  );
  const { call: deleteTimesheet, loading: isDeleting } = useFrappePostCall(
    "next_pms.timesheet.api.timesheet.delete",
  );

  const isSavingEntry = isSaving || isUpdating;
  const isMutating = isSavingEntry || isDeleting;

  const hoursLeft = (dailyWorkingHours ?? 0) - (totalUsedHoursInDay ?? 0);
  const effectiveHoursLeft =
    entryFormMode === ENTRY_FORM_MODE.EDIT && selectedEntry
      ? hoursLeft + selectedEntry.hours
      : hoursLeft;
  const defaultDuration = hoursLeft >= 0.5 ? 0.5 : 0;
  const isDraftAvailableInEdit =
    entryFormMode === ENTRY_FORM_MODE.EDIT && addDraft !== null;

  const defaultValues = useMemo<TimeEntryFormValues>(
    () => ({
      task: taskKey,
      date: date,
      duration: defaultDuration,
      comment: "",
    }),
    [taskKey, date, defaultDuration],
  );

  const form = useInlineTimeEntryForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      setSubmitError(null);

      try {
        if (entryFormMode === ENTRY_FORM_MODE.EDIT && selectedEntry) {
          await updateTimesheet({
            data: [
              {
                name: selectedEntry.name,
                parent: selectedEntry.parent,
                task: value.task,
                date: value.date,
                description: value.comment,
                hours: value.duration,
                is_billable: selectedEntry.is_billable,
              },
            ],
          });
          toast.success("Time Entry updated successfully");
        } else if (employee && date) {
          await saveTime({
            date: value.date,
            description: value.comment,
            task: value.task,
            hours: value.duration,
            employee,
          });
          toast.success("Time Entry submitted successfully");
        }
        if (tasks.length === 0 && entryFormMode === ENTRY_FORM_MODE.DEFAULT) {
          onSubmitSuccess?.();
        }
        pendingProceedAfterSaveRef.current?.();
      } catch (err) {
        setSubmitError(parseFrappeErrorMsg(err as FrappeError));
      } finally {
        pendingProceedAfterSaveRef.current = null;
        form.reset();
        editBaselineRef.current = null;
        setSelectedEntry(null);
        setAddDraft(null);
        setEntryFormMode(ENTRY_FORM_MODE.DEFAULT);
      }
    },
  });

  const {
    duration: liveDuration,
    comment: liveComment,
    date: liveDate,
  } = useStore(form.store, (state) => state.values);
  const hasUnsavedChanges =
    entryFormMode === ENTRY_FORM_MODE.EDIT && editBaselineRef.current
      ? liveDuration !== editBaselineRef.current.duration ||
        liveComment !== editBaselineRef.current.comment ||
        liveDate !== editBaselineRef.current.date
      : liveDuration !== defaultValues.duration ||
        liveComment !== defaultValues.comment;
  const baseEngaged =
    entryFormMode !== ENTRY_FORM_MODE.DEFAULT ||
    hasUnsavedChanges ||
    commentResizeActive;

  useEffect(() => {
    if (baseEngaged) {
      setStayEngaged(true);
    }
  }, [baseEngaged]);
  const isEngaged = baseEngaged || stayEngaged;

  // Snapshot the list while this popover's own mutation is in flight, so the realtime
  // data (which arrives before the response of the mutation) can't cause flicker of the list.
  useEffect(() => {
    if (!isMutating) {
      frozenTasksRef.current = tasks;
    }
  }, [isMutating, tasks]);
  const displayTasks = isMutating ? frozenTasksRef.current : tasks;
  const hasNoTimeEntries = displayTasks.length === 0;

  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
  hasUnsavedChangesRef.current = hasUnsavedChanges;

  // Layout effect so the pin lands before the browser fires the hover-leave.
  useLayoutEffect(() => {
    onEngagedChange?.(isEngaged);
  }, [isEngaged, onEngagedChange]);

  const discardChanges = useCallback(() => {
    form.reset();
    editBaselineRef.current = null;
    setSelectedEntry(null);
    setAddDraft(null);
    setStayEngaged(false);
    setEntryFormMode(ENTRY_FORM_MODE.DEFAULT);
  }, [form]);

  const unsavedChangesSourceRef = useUnsavedChangesSource();
  useEffect(() => {
    const source = {
      hasUnsavedChanges: () => hasUnsavedChangesRef.current,
      saveChanges: (onSaved?: () => void) => {
        pendingProceedAfterSaveRef.current = onSaved ?? null;
        void form.handleSubmit().finally(() => {
          pendingProceedAfterSaveRef.current = null;
        });
      },
      discardChanges,
    };
    unsavedChangesSourceRef.current = source;
    return () => {
      if (unsavedChangesSourceRef.current === source) {
        unsavedChangesSourceRef.current = null;
      }
    };
  }, [unsavedChangesSourceRef, form, discardChanges]);

  const handleDelete = useCallback(async () => {
    if (!selectedEntry) return;
    try {
      await deleteTimesheet({
        parent: selectedEntry.parent,
        name: selectedEntry.name,
      });
      toast.success("Time Entry deleted successfully");
      // Deleting the last remaining entry leaves nothing to show, so close.
      if (tasks.length <= 1) {
        onSubmitSuccess?.();
      }
    } catch (err) {
      const error = parseFrappeErrorMsg(err as FrappeError);
      toast.error(error);
    } finally {
      form.reset();
      editBaselineRef.current = null;
      setSelectedEntry(null);
      setAddDraft(null);
      setEntryFormMode(ENTRY_FORM_MODE.DEFAULT);
    }
  }, [selectedEntry, deleteTimesheet, toast, form, tasks, onSubmitSuccess]);

  const handleEditEntry = useCallback(
    (entry: TaskDataItemProps) => {
      setSubmitError(null);
      if (entryFormMode === ENTRY_FORM_MODE.ADD) {
        const { duration, comment } = form.state.values;
        const hasDraftValue =
          duration !== defaultValues.duration ||
          comment !== defaultValues.comment;
        setAddDraft(hasDraftValue ? { duration, comment } : null);
      }
      if (!hasInitializedInteractiveModeRef.current) {
        setCollapsedEntryNames(
          tasks.map((timeEntry: TaskDataItemProps) => timeEntry.name),
        );
        hasInitializedInteractiveModeRef.current = true;
      }
      setSelectedEntry(entry);
      setEntryFormMode(ENTRY_FORM_MODE.EDIT);
      editBaselineRef.current = {
        duration: entry.hours,
        comment: entry.description ?? "",
        date,
      };
      setCollapsedEntryNames((prev) =>
        prev.filter((name) => name !== entry.name),
      );
      form.setFieldValue("duration", entry.hours);
      form.setFieldValue("comment", entry.description ?? "");
      form.setFieldValue("date", date);
    },
    [entryFormMode, form, defaultValues, date, tasks],
  );

  const handleToggleAddMode = useCallback(() => {
    setSubmitError(null);
    if (entryFormMode === ENTRY_FORM_MODE.ADD) {
      void form.handleSubmit();
      return;
    }

    setSelectedEntry(null);
    setEntryFormMode(ENTRY_FORM_MODE.ADD);
    editBaselineRef.current = null;
    if (!hasInitializedInteractiveModeRef.current) {
      setCollapsedEntryNames(
        tasks.map((timeEntry: TaskDataItemProps) => timeEntry.name),
      );
      hasInitializedInteractiveModeRef.current = true;
    }

    if (addDraft) {
      form.setFieldValue("duration", addDraft.duration);
      form.setFieldValue("comment", addDraft.comment);
      setAddDraft(null);
      return;
    }

    form.setFieldValue("duration", defaultDuration);
    form.setFieldValue("comment", "");
  }, [entryFormMode, form, addDraft, defaultDuration, tasks]);

  const handleSubmit = useCallback(
    (e: React.KeyboardEvent<Element> | null = null) => {
      if (e === null) {
        void form.handleSubmit();
        return;
      }

      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void form.handleSubmit();
      }
    },
    [form],
  );

  const handleToggleEntryExpand = useCallback((entryName: string) => {
    setCollapsedEntryNames((prev) => {
      if (prev.includes(entryName)) {
        return prev.filter((name) => name !== entryName);
      }
      return [...prev, entryName];
    });
  }, []);

  if (disabled && tasks.length === 0) {
    return null;
  }

  return (
    <div className="animate-fade-in min-w-68 w-fit max-w-[min(720px,90vw)] max-h-[min(500px,90dvh)] overflow-auto scrollbar-thin shadow bg-surface-modal rounded-lg flex flex-col gap-2 p-2">
      {displayTasks.map((entry: TaskDataItemProps, index: number) => {
        const isEntryApproved = entry.custom_approval_status === "Approved";
        const isEditingThisEntry =
          entryFormMode === ENTRY_FORM_MODE.EDIT &&
          selectedEntry?.name === entry.name;
        const isExpanded =
          isEditingThisEntry || !collapsedEntryNames.includes(entry.name);

        return (
          <div key={entry.name} className="w-full min-w-0 group">
            <Accordion.Root
              value={isExpanded ? [entry.name] : []}
              onValueChange={() => handleToggleEntryExpand(entry.name)}
            >
              <Accordion.Item
                value={entry.name}
                className={cn("border-outline-gray-modals", {
                  "pb-2 border-b": !(
                    disabled && displayTasks.length - 1 === index
                  ),
                })}
              >
                {!isEditingThisEntry ? (
                  <Accordion.Trigger
                    nativeButton={false}
                    render={(props) => (
                      <div
                        {...props}
                        className={cn(
                          "w-full relative gap-2 cursor-pointer text-left",
                          "focus:outline-none focus-visible:ring focus-visible:ring-outline-gray-3 rounded-sm",
                          !isExpanded
                            ? "grid grid-cols-[auto_minmax(0,1fr)] items-center"
                            : "flex flex-col items-start ",
                        )}
                      >
                        <div
                          className={cn(
                            "flex justify-between items-center",
                            isExpanded && "w-full",
                          )}
                        >
                          <Badge
                            prefix={
                              timeEntry.nonBillable ? (
                                <div className="flex items-center justify-center w-3 h-3">
                                  <span className="block z-10 -bottom-0.5 left-1/2 w-1 h-1 rounded-full bg-surface-amber-3 transform -translate-x-1/2"></span>
                                </div>
                              ) : null
                            }
                            variant="subtle"
                            size="md"
                            className="gap-0 lining-nums tabular-nums text-ink-gray-8"
                          >
                            <span>
                              {entry.hours
                                ? floatToTime(entry.hours, 2)
                                : "00:00"}
                            </span>
                            <ApprovalStatus
                              status={entry.custom_approval_status || "None"}
                              className="w-3 m-1"
                            />
                          </Badge>
                        </div>
                        {!isExpanded ? (
                          <span
                            className={cn(
                              "block min-w-0 max-w-full truncate pr-4 text-sm text-ink-gray-6 contain-[inline-size]",
                            )}
                          >
                            {entry.description
                              ? stripTags(entry.description)
                              : null}
                          </span>
                        ) : null}
                        {!disabled && !isEntryApproved ? (
                          <Button
                            className={cn(
                              "w-5 h-5 absolute right-0 top-0 opacity-0 pointer-events-none",
                              "group-hover:opacity-100 group-hover:pointer-events-auto",
                              "group-focus-within:opacity-100 group-focus-within:pointer-events-auto",
                              !isExpanded &&
                                "group-active:not-hover:opacity-0 group-active:not-hover:pointer-events-none",
                            )}
                            variant="ghost"
                            icon={() => (
                              <EditAlt className="text-ink-gray-7" size={16} />
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEntry(entry);
                            }}
                          />
                        ) : null}
                      </div>
                    )}
                  />
                ) : null}
                <Accordion.Panel className="accordion-panel">
                  <div className="w-full pt-2">
                    {!disabled && isEditingThisEntry ? (
                      <TimeEntryForm
                        form={form}
                        mode="edit"
                        hoursLeft={effectiveHoursLeft}
                        durationLabel="Edit time"
                        maxDurationInHours={dailyWorkingHours}
                        editBaseline={editBaselineRef.current}
                        isSaving={isSavingEntry}
                        isMutating={isMutating}
                        submitError={submitError}
                        onSave={() => handleSubmit()}
                        onCommentKeyDown={handleSubmit}
                        onCommentPointerDown={handleCommentPointerDown}
                      >
                        <Button
                          variant="subtle"
                          theme="red"
                          size="sm"
                          iconLeft={() => <Delete size={16} />}
                          onClick={handleDelete}
                          loading={isDeleting}
                          disabled={isSavingEntry}
                        >
                          Delete entry
                        </Button>
                      </TimeEntryForm>
                    ) : (
                      <div
                        className="w-full min-w-0"
                        onPointerDownCapture={handleCommentPointerDown}
                      >
                        <StaticTextEditor
                          content={entry.description}
                          editorClass={cn(
                            "max-h-40 resize prose-sm overflow-auto scrollbar-thin bg-surface-white text-ink-gray-7 text-base leading-5.25",
                            "box-border w-full min-w-64 max-w-[min(680px,calc(90vw-2rem))]",
                            "contain-[inline-size] wrap-anywhere **:max-w-full **:wrap-anywhere",
                          )}
                        />
                        {entry.custom_approval_status === "Rejected" &&
                        entry.custom_rejection_reason ? (
                          <Alert
                            title="Rejection reason"
                            variant="outline"
                            theme="red"
                            dismissable={false}
                            renderIcon={false}
                            renderDescription={entry.custom_rejection_reason}
                            className="mt-2 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-ink-red-4 [&_p]:text-xs [&_p]:text-ink-red-3 p-2"
                          />
                        ) : null}
                      </div>
                    )}
                  </div>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion.Root>
          </div>
        );
      })}

      {!disabled ? (
        <div className="flex flex-col w-full gap-2">
          {hasNoTimeEntries || entryFormMode === ENTRY_FORM_MODE.ADD ? (
            <TimeEntryForm
              form={form}
              mode="add"
              hoursLeft={effectiveHoursLeft}
              durationLabel={hasNoTimeEntries ? false : "Add time"}
              maxDurationInHours={dailyWorkingHours}
              isSaving={isSavingEntry}
              isMutating={isMutating}
              submitError={submitError}
              onSave={() => handleSubmit()}
              onCommentKeyDown={handleSubmit}
              onCommentPointerDown={handleCommentPointerDown}
            />
          ) : null}
          {!hasNoTimeEntries && entryFormMode !== ENTRY_FORM_MODE.ADD ? (
            <div className="flex justify-between w-full gap-2">
              <Button
                className={cn(
                  "text-ink-gray-7",
                  isMutating && "text-ink-gray-4",
                )}
                variant="ghost"
                size="sm"
                iconLeft={() =>
                  isDraftAvailableInEdit ? (
                    <Compose size={16} />
                  ) : (
                    <AddSm size={16} />
                  )
                }
                onClick={handleToggleAddMode}
                disabled={isMutating}
              >
                {isDraftAvailableInEdit ? "Draft" : "Add time"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

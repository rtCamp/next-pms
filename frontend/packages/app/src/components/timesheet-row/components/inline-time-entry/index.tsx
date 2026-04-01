/**
 * External Dependencies
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { Accordion } from "@base-ui/react/accordion";
import { floatToTime, mergeClassNames as cn } from "@next-pms/design-system";
import { Badge, Button, useToasts } from "@rtcamp/frappe-ui-react";
import { FrappeError, useFrappePostCall } from "frappe-react-sdk";
import { Edit, Pen, Plus, Trash2 } from "lucide-react";

/**
 * Internal Dependencies
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { TaskDataItemProps } from "@/types/timesheet";
import { useInlineTimeEntryForm } from "./form";
import { TimeEntryForm } from "./timeEntryForm";
import type { InlineTimeEntryProps, TimeEntryFormValues } from "./types";

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
 * @param task - Task name for the timesheet entry (eg: TASK-0001).
 * @param employee - Employee for the timesheet entry
 * @param dailyWorkingHours - Daily working hours for the task.
 * @param totalUsedHoursInDay - Total used hours in the day for the task.
 * @param onSubmitSuccess - Callback function to be called after successful submission of time entry.
 * @param timeEntry - Time entry data for the cell
 * @param tasks - All time entries for the task for the week, used to show in the inline time entry form.
 * @param disabled - Whether the time entry form is disabled or not.
 */
export const InlineTimeEntry = ({
  date,
  taskKey,
  employee,
  dailyWorkingHours = 8,
  totalUsedHoursInDay,
  onSubmitSuccess,
  timeEntry,
  tasks,
  disabled,
}: InlineTimeEntryProps) => {
  const toast = useToasts();
  const [submitting, setSubmitting] = useState(false);
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
  const [collapsedEntryNames, setCollapsedEntryNames] = useState<string[]>([]);
  const hasInitializedInteractiveModeRef = useRef(false);
  const editBaselineRef = useRef<{ duration: number; comment: string } | null>(
    null,
  );

  const { call: saveTime } = useFrappePostCall(
    "next_pms.timesheet.api.timesheet.save",
  );
  const { call: updateTimesheet } = useFrappePostCall(
    "next_pms.timesheet.api.timesheet.bulk_update_timesheet_detail",
  );
  const { call: deleteTimesheet } = useFrappePostCall(
    "next_pms.timesheet.api.timesheet.delete",
  );

  const hoursLeft = (dailyWorkingHours ?? 0) - (totalUsedHoursInDay ?? 0);
  const effectiveHoursLeft =
    entryFormMode === ENTRY_FORM_MODE.EDIT && selectedEntry
      ? hoursLeft + selectedEntry.hours
      : hoursLeft;
  const defaultDuration = hoursLeft >= 0.5 ? 0.5 : 0;
  const hasNoTimeEntries = (tasks.length ?? 0) === 0;
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
      setSubmitting(true);

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
        if (hasNoTimeEntries && entryFormMode === ENTRY_FORM_MODE.DEFAULT) {
          onSubmitSuccess?.();
        }
      } catch (err) {
        const error = parseFrappeErrorMsg(err as FrappeError);
        toast.error(error);
      } finally {
        setSubmitting(false);
        form.reset();
        editBaselineRef.current = null;
        setSelectedEntry(null);
        setAddDraft(null);
        setEntryFormMode(ENTRY_FORM_MODE.DEFAULT);
      }
    },
  });

  const handleDelete = useCallback(async () => {
    if (!selectedEntry) return;
    setSubmitting(true);
    try {
      await deleteTimesheet({
        parent: selectedEntry.parent,
        name: selectedEntry.name,
      });
      toast.success("Time Entry deleted successfully");
    } catch (err) {
      const error = parseFrappeErrorMsg(err as FrappeError);
      toast.error(error);
    } finally {
      setSubmitting(false);
      form.reset();
      editBaselineRef.current = null;
      setSelectedEntry(null);
      setAddDraft(null);
      setEntryFormMode(ENTRY_FORM_MODE.DEFAULT);
    }
  }, [selectedEntry, deleteTimesheet, toast, form]);

  const handleEditEntry = useCallback(
    (entry: TaskDataItemProps) => {
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
      };
      setCollapsedEntryNames((prev) =>
        prev.filter((name) => name !== entry.name),
      );
      form.setFieldValue("duration", entry.hours);
      form.setFieldValue("comment", entry.description ?? "");
    },
    [entryFormMode, form, defaultValues, tasks],
  );

  const handleToggleAddMode = useCallback(() => {
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

  return (
    <div className="animate-fade-in w-68 max-h-[min(350px,90dvh)] overflow-y-auto scrollbar-thin shadow bg-surface-modal rounded-lg flex flex-col gap-2 p-2">
      {tasks.map((entry: TaskDataItemProps, index: number) => {
        const isEditingThisEntry =
          entryFormMode === ENTRY_FORM_MODE.EDIT &&
          selectedEntry?.name === entry.name;
        const isExpanded =
          isEditingThisEntry || !collapsedEntryNames.includes(entry.name);

        return (
          <div key={entry.name} className="w-full group">
            <Accordion.Root
              value={isExpanded ? [entry.name] : []}
              onValueChange={() => handleToggleEntryExpand(entry.name)}
            >
              <Accordion.Item
                value={entry.name}
                className={cn("border-outline-gray-modals", {
                  "pb-2 border-b": !(disabled && tasks.length - 1 === index),
                })}
              >
                {!isEditingThisEntry ? (
                  <Accordion.Trigger
                    nativeButton={false}
                    render={(props) => (
                      <div
                        {...props}
                        className={cn(
                          "w-full relative flex justify-start gap-2 cursor-pointer text-left",
                          "focus:outline-none focus-visible:ring focus-visible:ring-outline-gray-3 rounded-sm",
                          !isExpanded
                            ? "flex-row items-center"
                            : "flex-col items-start ",
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
                            className="gap-0 lining-nums tabular-nums text-ink-gray-9"
                          >
                            {entry.hours
                              ? floatToTime(entry.hours, 2)
                              : "00:00"}
                          </Badge>
                        </div>
                        {!isExpanded ? (
                          <span
                            className={cn(
                              "w-full min-w-0 text-base truncate text-ink-gray-6",
                              {
                                "group-hover:pr-4 group-focus-within:pr-4":
                                  !disabled,
                              },
                            )}
                          >
                            {entry.description}
                          </span>
                        ) : null}
                        {!disabled ? (
                          <Button
                            className={cn(
                              "w-5 h-5 absolute right-0 top-0 opacity-0 pointer-events-none",
                              "group-hover:opacity-100 group-hover:pointer-events-auto",
                              "group-focus-within:opacity-100 group-focus-within:pointer-events-auto",
                            )}
                            variant="ghost"
                            icon={() => (
                              <Edit className="text-ink-gray-7" size={16} />
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
                  <div className="pt-2">
                    {!disabled && isEditingThisEntry ? (
                      <TimeEntryForm
                        form={form}
                        mode="edit"
                        hoursLeft={effectiveHoursLeft}
                        durationLabel="Edit time"
                        durationVariant="default"
                        maxDurationInHours={dailyWorkingHours}
                        editBaseline={editBaselineRef.current}
                        submitting={submitting}
                        onSave={() => handleSubmit()}
                        onCommentKeyDown={handleSubmit}
                      >
                        <Button
                          variant="subtle"
                          theme="red"
                          size="sm"
                          iconLeft={() => <Trash2 size={16} />}
                          onClick={handleDelete}
                          disabled={submitting}
                        >
                          Delete entry
                        </Button>
                      </TimeEntryForm>
                    ) : (
                      <span className="text-base whitespace-pre-wrap wrap-break-word line-clamp-6 text-ink-gray-6">
                        {entry.description}
                      </span>
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
              durationLabel="Add time"
              durationVariant={hasNoTimeEntries ? "compact" : "default"}
              maxDurationInHours={dailyWorkingHours}
              submitting={submitting}
              onSave={() => handleSubmit()}
              onCommentKeyDown={handleSubmit}
            />
          ) : null}
          {!hasNoTimeEntries && entryFormMode !== ENTRY_FORM_MODE.ADD ? (
            <div className="flex justify-between w-full gap-2">
              <Button
                variant="ghost"
                size="sm"
                iconLeft={() =>
                  isDraftAvailableInEdit ? (
                    <Pen size={16} />
                  ) : (
                    <Plus size={16} />
                  )
                }
                onClick={handleToggleAddMode}
                disabled={submitting}
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

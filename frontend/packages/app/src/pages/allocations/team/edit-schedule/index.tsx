/**
 * External dependencies.
 */
import { DayChip, DurationInput } from "@next-pms/design-system/components";
import {
  Button,
  Dialog,
  ErrorMessage,
  TextInput,
} from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { mergeClassNames as cn } from "@/lib/utils";
import type { EditScheduleModalProps } from "./types";
import { useScheduleEditor } from "./useScheduleEditor";
import { formatRange, getRangeHours, toDisplayHours } from "./utils";

function EditScheduleModal({
  open,
  onOpenChange,
  initialValues,
  onSave,
}: EditScheduleModalProps) {
  const {
    days,
    draftHoursPerDay,
    previewRows,
    totalHours,
    canSave,
    headerRangeLabel,
    submitting,
    submitError,
    handleDayClick,
    handleDurationChange,
    handleSave,
    closeModal,
  } = useScheduleEditor({ open, initialValues, onSave, onOpenChange });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          onOpenChange(true);
          return;
        }
        closeModal();
      }}
      options={{
        title: () => (
          <span className="text-lg font-medium text-ink-gray-8">
            Edit schedule
          </span>
        ),
        size: "sm",
      }}
      actions={
        <div className="-mt-5 flex w-full items-center justify-end gap-2">
          <Button variant="ghost" label="Cancel" onClick={closeModal} />
          <Button
            variant="solid"
            label="Save changes"
            onClick={handleSave}
            loading={submitting}
            disabled={submitting || !canSave}
          />
        </div>
      }
    >
      <div className="-mt-2 space-y-4">
        <div className="space-y-1.5 pl-0.5">
          <div className="flex items-center justify-between text-base text-ink-gray-5">
            <span>Select dates to edit</span>
            <span className="text-right">{headerRangeLabel}</span>
          </div>

          <div className="relative overflow-x-auto overflow-y-visible pb-2 no-scrollbar">
            <div className="flex min-w-fit items-center gap-1 pr-8">
              {days.map((day) => (
                <DayChip
                  key={day.date}
                  dayLabel={day.dayLabel}
                  dayNumber={day.dayNumber}
                  monthLabel={day.monthLabel}
                  isMonthBoundary={day.isMonthBoundary}
                  state={day.isSelected ? "active" : "default"}
                  onClick={() => handleDayClick(day.date)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex w-full items-start gap-2">
          <div className="flex-1 space-y-1.5">
            <label className="block text-base text-ink-gray-5">
              Edit Hours / day
            </label>
            <DurationInput
              value={draftHoursPerDay}
              variant="compact"
              onChange={handleDurationChange}
            />
          </div>

          <div className="flex-1 space-y-1.5">
            <label className="block text-base text-ink-gray-5">
              Total hours
            </label>
            <TextInput
              value={totalHours}
              disabled
              variant="outline"
              size="md"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-base text-ink-gray-5">
            Schedule summary
          </label>

          <div className="overflow-hidden rounded-lg border border-outline-gray-2">
            <table className="w-full table-fixed border-collapse">
              <tbody>
                {previewRows.map((row) => (
                  <tr
                    key={`${row.startDate}_${row.endDate}`}
                    className={cn(
                      "border-b border-outline-gray-2 last:border-b-0 transition-opacity",
                      row.isSelected && "bg-surface-gray-2",
                      row.isSelected && !row.isModified && "opacity-50",
                    )}
                  >
                    <td className="w-1/2 truncate border-r border-outline-gray-2 px-3 py-2.5 text-sm text-ink-gray-6">
                      {formatRange(row.startDate, row.endDate)}
                    </td>
                    <td className="w-1/2 px-3 py-2.5 text-sm">
                      <span className="text-ink-gray-6">
                        {toDisplayHours(row.hoursPerDay)}h/day
                      </span>
                      <span className="text-ink-gray-5">
                        {` · ${toDisplayHours(
                          getRangeHours(
                            row.startDate,
                            row.endDate,
                            row.hoursPerDay,
                          ),
                        )} hours`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {submitError ? <ErrorMessage message={submitError} /> : null}
        </div>
      </div>
    </Dialog>
  );
}

export default EditScheduleModal;

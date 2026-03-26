/**
 * External Dependencies
 */
import { useState, useCallback } from "react";
import { TaskStatus, DurationInput } from "@next-pms/design-system/components";
import { floatToTime } from "@next-pms/design-system";
import { Button, Textarea } from "@rtcamp/frappe-ui-react";
import { Edit, Check, X, Trash2 } from "lucide-react";

/**
 * Internal Dependencies
 */
import type { TimesheetEntry } from "../../utils";

interface EntryRowProps {
  entry: TimesheetEntry;
  onSave: (timesheetId: string, updates: { description: string; hours: number }) => void;
}

const EntryRow = ({ entry, onSave }: EntryRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(entry.description);
  const [hours, setHours] = useState(entry.hours);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancel = useCallback(() => {
    setDescription(entry.description);
    setHours(entry.hours);
    setIsEditing(false);
  }, [entry.description, entry.hours]);

  const handleSave = useCallback(() => {
    onSave(entry.timesheetId, { description, hours });
    setIsEditing(false);
  }, [entry.timesheetId, description, hours, onSave]);

  if (isEditing) {
    return (
      <div className="px-3.5 py-3 flex gap-3 border-b border-outline-gray-modals last:border-b-0 ">
        <TaskStatus status={entry.status} />
        <div className="flex-1 min-w-0">
          <div className="space-y-1">
            <p className="text-base font-medium text-ink-gray-7">{entry.taskName}</p>
            <p className="text-xs text-ink-gray-5">{entry.projectName}</p>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              className="bg-white border-outline-gray-2"
              rows={2}
            />
          </div>
        </div>
        <DurationInput
          value={hours}
          onChange={setHours}
          variant="compact"
        />

        <div className="flex flex-col gap-2">
          <Button
            className="m-0 size-fit"
            variant="ghost"
            icon={() => <Check size={16} className="text-ink-green-4" />}
            onClick={handleSave}
          />
          <Button
            className="m-0 size-fit"
            variant="ghost"
            icon={() => <X size={16} className="text-ink-gray-5" />}
            onClick={handleCancel}
          />
          <Button
            className="m-0 size-fit"
            variant="ghost"
            icon={() => <Trash2 size={16} className="text-ink-red-4" />}
            onClick={() => {}}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-3.5 py-3 flex gap-3 border-b border-outline-gray-modals last:border-b-0 group">
      <TaskStatus status={entry.status} />
      <div className="flex-1 min-w-0">
        <div className="space-y-1">
          <p className="text-base font-medium text-ink-gray-7">{entry.taskName}</p>
          <p className="text-xs text-ink-gray-5">{entry.projectName}</p>
          <p className="text-sm text-ink-gray-7 mt-3">{entry.description}</p>
        </div>
      </div>
      <span className="size-fit text-md text-ink-gray-6 rounded-sm outline outline-offset-4 outline-outline-gray-modals">{floatToTime(entry.hours, 2, 2)}</span>
      <Button
        className="m-0 size-fit hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
        variant="ghost"
        icon={() => <Edit size={16} className="text-ink-gray-7" />}
        onClick={handleEdit}
      />
    </div>
  );
};

export default EntryRow;

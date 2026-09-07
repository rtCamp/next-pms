/**
 * External dependencies.
 */
import { Button } from "@rtcamp/frappe-ui-react";
import { EditAlt } from "@rtcamp/frappe-ui-react/icons";

type TrackingHeaderProps = {
  canCustomize: boolean;
  isEditing: boolean;
  isDirty: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onAddWidgets: () => void;
};

export function TrackingHeader({
  canCustomize,
  isEditing,
  isDirty,
  isSaving,
  onEdit,
  onCancel,
  onSave,
  onAddWidgets,
}: TrackingHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h1 className="text-xl font-semibold text-ink-gray-8">Tracking</h1>
      {canCustomize &&
        (isEditing ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onAddWidgets} disabled={isSaving}>
              Add widgets
            </Button>
            <Button variant="subtle" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="solid"
              onClick={onSave}
              disabled={!isDirty || isSaving}
            >
              Save
            </Button>
          </div>
        ) : (
          <Button
            variant="solid"
            iconLeft={() => <EditAlt size={16} />}
            onClick={onEdit}
          >
            Edit
          </Button>
        ))}
    </div>
  );
}

/**
 * External dependencies.
 */
import { Button } from "@rtcamp/frappe-ui-react";
import { EditAlt } from "@rtcamp/frappe-ui-react/icons";

type TrackingHeaderProps = {
  canCustomize: boolean;
  isEditing: boolean;
  isSaving: boolean;
  onToggleEdit: () => void;
  onAddWidgets: () => void;
};

export function TrackingHeader({
  canCustomize,
  isEditing,
  isSaving,
  onToggleEdit,
  onAddWidgets,
}: TrackingHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h1 className="text-xl font-semibold text-ink-gray-8">Tracking</h1>
      {canCustomize && (
        <div className="flex items-center gap-2">
          {isEditing && (
            <Button variant="ghost" onClick={onAddWidgets} disabled={isSaving}>
              Add widgets
            </Button>
          )}
          <Button
            variant={isEditing ? "subtle" : "solid"}
            iconLeft={isEditing ? undefined : () => <EditAlt size={16} />}
            onClick={onToggleEdit}
            disabled={isSaving}
          >
            {isEditing ? "Done" : "Edit"}
          </Button>
        </div>
      )}
    </div>
  );
}

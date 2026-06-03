import { Avatar, Button } from "@rtcamp/frappe-ui-react";

type NoteEditorSubHeaderProps = {
  userName: string;
  userImage: string;
  canSave: boolean;
  isSubmitting: boolean;
  onSave: () => void;
};

export function NoteEditorSubHeader({
  userName,
  userImage,
  canSave,
  isSubmitting,
  onSave,
}: NoteEditorSubHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-8">
      <div className="flex items-center gap-2">
        <Avatar
          size="xs"
          shape="circle"
          label={userName}
          image={userImage || undefined}
        />
        <span className="truncate text-base font-medium text-ink-gray-7">
          {userName}
        </span>
      </div>
      <Button
        variant="solid"
        theme="gray"
        size="sm"
        label="Save note"
        loading={isSubmitting}
        disabled={!canSave || isSubmitting}
        onClick={onSave}
      />
    </div>
  );
}

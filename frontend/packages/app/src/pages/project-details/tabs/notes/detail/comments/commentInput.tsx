/**
 * External dependencies.
 */
import { useState } from "react";
import { Avatar, Button, TextEditor } from "@rtcamp/frappe-ui-react";
import { Send } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { mergeClassNames as cn, stripTags } from "@/lib/utils";

type CommentInputProps = {
  onSubmit: (comment: string) => Promise<void>;
  placeholder?: string;
  initialValue?: string;
  isSubmitting?: boolean;
  autoFocus?: boolean;
  /** Clears the editor after a successful submit (bottom new-comment bar). */
  resetOnSubmit?: boolean;
  onCancel?: () => void;
  avatar?: { label: string; image?: string | null };
};

export function CommentInput({
  onSubmit,
  placeholder = "Add a comment...",
  initialValue = "",
  isSubmitting = false,
  autoFocus = false,
  resetOnSubmit = false,
  onCancel,
  avatar,
}: CommentInputProps) {
  const [draft, setDraft] = useState(initialValue);
  // Remounting the editor is the reliable way to reset TipTap content, since
  // the `content` prop is only read on mount.
  const [editorKey, setEditorKey] = useState(0);

  const isEmpty = stripTags(draft).trim().length === 0;

  const handleSubmit = async () => {
    if (isEmpty || isSubmitting) return;
    try {
      await onSubmit(draft);
    } catch {
      // The hook already surfaces the error via a toast; keep the draft so the
      // user can retry, and swallow the rejection so the void caller below
      // doesn't raise an unhandled promise rejection.
      return;
    }
    if (resetOnSubmit) {
      setDraft("");
      setEditorKey((k) => k + 1);
    }
  };

  return (
    <div className="flex items-start gap-2">
      {avatar && (
        <Avatar
          size="sm"
          shape="circle"
          label={avatar.label}
          image={avatar.image || undefined}
        />
      )}
      <div className="flex w-full flex-col gap-2 rounded-md border border-outline-gray-2 p-2">
        <TextEditor
          key={editorKey}
          content={initialValue}
          editable={!isSubmitting}
          autofocus={autoFocus}
          fixedMenu={false}
          placeholder={placeholder}
          onChange={setDraft}
          editorClass={cn(
            "prose prose-sm max-w-none min-h-[2.5rem] text-ink-gray-8 focus:outline-none",
          )}
        />
        <div className="flex items-center justify-end gap-2">
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              label="Cancel"
              onClick={onCancel}
              disabled={isSubmitting}
            />
          )}
          <Button
            variant="solid"
            theme="gray"
            size="sm"
            label="Send"
            iconLeft={Send}
            loading={isSubmitting}
            disabled={isEmpty || isSubmitting}
            onClick={() => void handleSubmit()}
          />
        </div>
      </div>
    </div>
  );
}

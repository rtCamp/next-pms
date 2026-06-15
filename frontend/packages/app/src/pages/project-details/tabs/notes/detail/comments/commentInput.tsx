/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { Button, TextEditor } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { stripTags } from "@/lib/utils";

type CommentInputProps = {
  onSubmit: (comment: string) => Promise<void>;
  placeholder?: string;
  initialValue?: string;
  isSubmitting?: boolean;
  autoFocus?: boolean;
  resetOnSubmit?: boolean;
  onCancel?: () => void;
  submitLabel?: string;
  collapsible?: boolean;
  showToolbar?: boolean;
};

export function CommentInput({
  onSubmit,
  placeholder = "Add a comment...",
  initialValue = "",
  isSubmitting = false,
  autoFocus = false,
  resetOnSubmit = false,
  onCancel,
  submitLabel = "Post",
  collapsible = false,
}: CommentInputProps) {
  const [draft, setDraft] = useState(initialValue);
  const [isExpanded, setIsExpanded] = useState(
    !collapsible || autoFocus || stripTags(initialValue).trim().length > 0,
  );
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    setDraft(initialValue);
    setEditorKey((key) => key + 1);
  }, [initialValue]);

  const isEmpty = stripTags(draft).trim().length === 0;

  const resetEditor = () => {
    setDraft(initialValue);
    setEditorKey((key) => key + 1);
  };

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
    if (resetOnSubmit || collapsible) {
      setDraft("");
      setEditorKey((key) => key + 1);
    }
    if (collapsible) {
      setIsExpanded(false);
    }
  };

  const handleCancel = () => {
    resetEditor();
    if (collapsible) {
      setIsExpanded(false);
    }
    onCancel?.();
  };

  // Dummy input to avoid rendering the heavy TextEditor component.
  if (!isExpanded) {
    return (
      <input
        className="transition-colors w-full min-h-8 outline-none appearance-none text-base rounded h-7 border border-outline-gray-2 bg-surface-white placeholder-ink-gray-4 hover:border-outline-gray-3 hover:shadow-sm focus:bg-surface-white focus:border-outline-gray-4 focus:shadow-sm focus:ring-0 focus-visible:ring-2 focus-visible:ring-outline-gray-3 pl-2 pr-2 py-1.5"
        onFocus={() => setIsExpanded(true)}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full flex-col gap-2">
        <TextEditor
          key={editorKey}
          content={draft}
          editable={!isSubmitting}
          autofocus={autoFocus || collapsible}
          fixedMenu={false}
          placeholder={placeholder}
          onChange={setDraft}
          editorClass="min-h-11 w-full max-w-full rounded-lg border border-outline-gray-2 bg-surface-white px-2 text-ink-gray-8 prose-sm prose-p:my-0 focus:outline-none"
        />
        <div className="flex items-center justify-end gap-2">
          {(onCancel || collapsible) && (
            <Button
              variant="ghost"
              size="sm"
              label="Cancel"
              onClick={handleCancel}
              disabled={isSubmitting}
            />
          )}
          <Button
            variant="solid"
            theme="gray"
            size="sm"
            label={submitLabel}
            loading={isSubmitting}
            disabled={isEmpty || isSubmitting}
            onClick={() => void handleSubmit()}
          />
        </div>
      </div>
    </div>
  );
}

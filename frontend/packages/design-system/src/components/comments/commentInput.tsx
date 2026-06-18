/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { mergeClassNames as cn } from "@next-pms/design-system";
import { Avatar, Button, TextEditor } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import {
  CommentInputContext,
  useCommentInputContext,
} from "./commentInputContext";
import { CommentInputContextValue } from "./types";
import { stripTags } from "../../utils";

export type CommentInputProps = {
  onSubmit: (comment: string) => Promise<void>;
  placeholder?: string;
  initialValue?: string;
  isSubmitting?: boolean;
  autoFocus?: boolean;
  resetOnSubmit?: boolean;
  onCancel?: () => void;
  submitLabel?: string;
  collapsible?: boolean;
  children?: React.ReactNode;
};

function CommentInputRoot({
  onSubmit,
  placeholder = "Add a comment...",
  initialValue = "",
  isSubmitting = false,
  autoFocus = false,
  resetOnSubmit = false,
  onCancel,
  submitLabel = "Post",
  collapsible = false,
  children,
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
    await onSubmit(draft);
    if (resetOnSubmit || collapsible) {
      setDraft("");
      setEditorKey((key) => key + 1);
    }
    if (collapsible) setIsExpanded(false);
  };

  const handleCancel = () => {
    resetEditor();
    if (collapsible) setIsExpanded(false);
    onCancel?.();
  };

  const value: CommentInputContextValue = {
    draft,
    setDraft,
    isExpanded,
    setIsExpanded,
    editorKey,
    isEmpty,
    isSubmitting,
    autoFocus,
    collapsible,
    showCancel: !!onCancel || collapsible,
    handleSubmit,
    handleCancel,
  };

  // Composable - consumer controls layout via sub-components.
  if (children) {
    return (
      <CommentInputContext.Provider value={value}>
        {children}
      </CommentInputContext.Provider>
    );
  }

  // Default layout (backward-compat, no children).
  return (
    <CommentInputContext.Provider value={value}>
      {!isExpanded && collapsible ? (
        <CommentInputTrigger placeholder={placeholder} />
      ) : (
        <CommentInputContent>
          <CommentInputEditor placeholder={placeholder} />
          <CommentInputActions submitLabel={submitLabel} />
        </CommentInputContent>
      )}
    </CommentInputContext.Provider>
  );
}

// Sub-components

function CommentInputTrigger({
  placeholder = "Add a comment...",
  className,
  avatarName,
  avatarImage,
}: {
  placeholder?: string;
  className?: string;
  avatarName?: string;
  avatarImage?: string;
}) {
  const { isExpanded, collapsible, setIsExpanded } = useCommentInputContext();

  if (isExpanded || !collapsible) return null;

  const input = (
    <input
      aria-label={placeholder}
      type="text"
      className={cn(
        "transition-colors w-full min-h-8 outline-none appearance-none text-base rounded h-7 border border-outline-gray-2 bg-surface-white placeholder-ink-gray-4 hover:border-outline-gray-3 hover:shadow-sm focus:bg-surface-white focus:border-outline-gray-4 focus:shadow-sm focus:ring-0 focus-visible:ring-2 focus-visible:ring-outline-gray-3 pl-2 pr-2 py-1.5",
        className,
      )}
      onFocus={() => setIsExpanded(true)}
      placeholder={placeholder}
    />
  );

  if (!avatarName && !avatarImage) return input;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Avatar
        size="lg"
        shape="circle"
        label={avatarName ?? ""}
        image={avatarImage}
      />
      {input}
    </div>
  );
}

function CommentInputContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isExpanded, collapsible } = useCommentInputContext();

  if (!isExpanded && collapsible) return null;

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      {children}
    </div>
  );
}

function CommentInputEditor({
  placeholder = "Add a comment...",
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  const { draft, setDraft, editorKey, isSubmitting, autoFocus, collapsible } =
    useCommentInputContext();

  return (
    <TextEditor
      key={editorKey}
      content={draft}
      editable={!isSubmitting}
      autofocus={autoFocus || collapsible}
      fixedMenu={false}
      placeholder={placeholder}
      onChange={setDraft}
      editorClass={cn(
        "min-h-11 w-full max-w-full rounded-lg border border-outline-gray-2 bg-surface-white px-2 text-ink-gray-8 prose-sm prose-p:my-0 focus:outline-none",
        className,
      )}
    />
  );
}

function CommentInputActions({
  submitLabel = "Post",
}: {
  submitLabel?: string;
}) {
  const { isEmpty, isSubmitting, showCancel, handleSubmit, handleCancel } =
    useCommentInputContext();

  return (
    <div className="flex items-center justify-end gap-2">
      {showCancel && (
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
  );
}

// Export

export const CommentInput = Object.assign(CommentInputRoot, {
  Trigger: CommentInputTrigger,
  Content: CommentInputContent,
  Editor: CommentInputEditor,
  Actions: CommentInputActions,
});

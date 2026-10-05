/**
 * External dependencies.
 */
import { AlertTriangle } from "@rtcamp/frappe-ui-react/icons";

interface UpdateLogNoteProps {
  message: string;
}

export function UpdateLogNote({ message }: UpdateLogNoteProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-surface-violet-1 px-2.5 py-2">
      <AlertTriangle className="size-4 shrink-0 text-ink-violet-4" />
      <p className="min-w-0 flex-1 text-left text-xs text-ink-gray-8">
        {message}
      </p>
    </div>
  );
}

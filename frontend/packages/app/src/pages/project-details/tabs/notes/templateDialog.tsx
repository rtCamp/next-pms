/**
 * External dependencies.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Dialog, TextInput } from "@rtcamp/frappe-ui-react";
import { Search } from "@rtcamp/frappe-ui-react/icons";
import { Spinner } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import {
  useNoteTemplateLookup,
  type NoteTemplateOption,
} from "@/hooks/useNoteTemplateLookup";
import { ROUTES } from "@/lib/constant";
import { mergeClassNames as cn, stripTags } from "@/lib/utils";
import { TEMPLATE_PARAM } from "./constants";

type TemplateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
};

export function TemplateDialog({
  open,
  onOpenChange,
  projectId,
}: TemplateDialogProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<NoteTemplateOption | null>(null);

  const { options, isLoading } = useNoteTemplateLookup({
    shouldFetch: open,
    query,
  });

  const handleUseTemplate = () => {
    if (!selected) return;
    onOpenChange(false);
    navigate(
      `${ROUTES.project}/${projectId}/notes/new?${TEMPLATE_PARAM}=${encodeURIComponent(selected.value)}`,
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      options={{
        title: () => <span className="text-lg font-medium">Add Template</span>,
      }}
      actions={
        <div className="flex items-center justify-end w-full gap-2">
          <Button
            variant="ghost"
            label="Cancel"
            onClick={() => onOpenChange(false)}
          />
          <Button
            variant="solid"
            theme="gray"
            label="Use template"
            disabled={!selected}
            onClick={handleUseTemplate}
          />
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <TextInput
          size="md"
          variant="outline"
          placeholder="Search template"
          prefix={() => <Search className="size-4 text-ink-gray-5" />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-col gap-1">
          <span className="text-sm text-ink-gray-5">Templates</span>
          {isLoading ? (
            <Spinner className="py-10" />
          ) : options.length === 0 ? (
            <div className="py-10 text-center text-sm text-ink-gray-4">
              No templates found
            </div>
          ) : (
            <div className="flex max-h-80 flex-col gap-1 overflow-auto scrollbar-thin">
              {options.map((template) => (
                <button
                  key={template.value}
                  type="button"
                  onClick={() => setSelected(template)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left hover:bg-surface-gray-2",
                    selected?.value === template.value && "bg-surface-gray-3",
                  )}
                >
                  <span className="w-full truncate text-base font-medium text-ink-gray-8">
                    {template.label}
                  </span>
                  <span className="w-full truncate text-sm text-ink-gray-5">
                    {stripTags(template.description)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}

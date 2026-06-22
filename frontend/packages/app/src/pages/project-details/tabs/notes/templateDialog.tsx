/**
 * External dependencies.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@next-pms/design-system/components";
import { stripTags } from "@next-pms/design-system/utils";
import { Button, Dialog, TextInput } from "@rtcamp/frappe-ui-react";
import { Search } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import {
  useNoteTemplateLookup,
  type NoteTemplateOption,
} from "@/hooks/useNoteTemplateLookup";
import { ROUTES } from "@/lib/constant";
import { mergeClassNames as cn } from "@/lib/utils";
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
    keepPreviousData: true,
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
        title: () => (
          <span className="text-[20px] font-medium">Add Template</span>
        ),
        size: "md",
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
      <div className="flex flex-col gap-3 -my-4">
        <TextInput
          size="md"
          variant="subtle"
          placeholder="Search template"
          prefix={() => <Search className="size-4 text-ink-gray-5" />}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
        />
        <div className="relative flex flex-col gap-1">
          <span className="text-base text-ink-gray-5">Templates</span>
          {!isLoading && options.length === 0 ? (
            <div className="py-10 h-80 max-h-80 flex items-center justify-center">
              <span className="text-center text-base text-ink-gray-4">
                No templates found
              </span>
            </div>
          ) : (
            <div
              className={cn(
                "flex h-80 max-h-80 flex-col gap-1 overflow-auto scrollbar-thin opacity-100 transition-opacity duration-150",
                isLoading && "pointer-events-none opacity-50",
              )}
            >
              {options.map((template) => (
                <button
                  key={template.value}
                  type="button"
                  onClick={() => setSelected(template)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-md px-3 py-2 text-left text-ink-gray-8 hover:bg-surface-gray-2",
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
          {isLoading && (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <Spinner />
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}

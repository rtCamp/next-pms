/**
 * External dependencies.
 */
import { useState } from "react";
import { useNavigate } from "react-router";
import { Spinner } from "@next-pms/design-system/components";
import { stripTags } from "@next-pms/design-system/utils";
import {
  Button,
  Combobox,
  Dialog,
  TextInput,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { DeleteAlt, Search } from "@rtcamp/frappe-ui-react/icons";
import { useFrappeDeleteDoc, type FrappeError } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useNoteTemplateCategoryLookup } from "@/hooks/useNoteTemplateCategoryLookup";
import {
  useNoteTemplateLookup,
  type NoteTemplateOption,
} from "@/hooks/useNoteTemplateLookup";
import { ROUTES } from "@/lib/constant";
import { mergeClassNames as cn, parseFrappeErrorMsg } from "@/lib/utils";
import { TEMPLATE_DOCTYPE, TEMPLATE_PARAM } from "./constants";

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
  const [category, setCategory] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [selected, setSelected] = useState<NoteTemplateOption | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToasts();
  const { deleteDoc } = useFrappeDeleteDoc();

  const { options, isLoading, mutate } = useNoteTemplateLookup({
    shouldFetch: open,
    keepPreviousData: true,
    query,
    category: category ?? undefined,
  });

  const { options: categoryOptions, isLoading: isCategoryLoading } =
    useNoteTemplateCategoryLookup({
      shouldFetch: open,
      query: categorySearch,
      keepPreviousData: true,
    });

  const handleDeleteTemplate = async (template: NoteTemplateOption) => {
    setIsDeleting(true);
    try {
      await deleteDoc(TEMPLATE_DOCTYPE, template.value);
      setSelected((current) =>
        current?.value === template.value ? null : current,
      );
      await mutate();
      setConfirmingDelete(null);
      toast.success("Template deleted");
    } catch (err) {
      toast.error(parseFrappeErrorMsg(err as FrappeError));
    } finally {
      setIsDeleting(false);
    }
  };

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
      className="my-0"
      classNames={{
        header: "mb-5",
        content: "pt-5 pb-2 sm:px-3",
        viewport: "justify-start pt-30",
        footer: "pb-6 sm:px-3",
      }}
      options={{
        title: () => (
          <span className="text-[20px] font-medium px-3">Add Template</span>
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
      <div className="flex flex-col gap-5">
        <TextInput
          size="md"
          className="mx-3"
          variant="subtle"
          placeholder="Search template"
          prefix={() => <Search className="size-4 text-ink-gray-5" />}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
            setConfirmingDelete(null);
          }}
        />
        <Combobox
          className="px-3"
          inputClassName="bg-surface-white h-8 border-outline-gray-2 text-ink-gray-7"
          loading={isCategoryLoading}
          options={categoryOptions}
          searchValue={categorySearch}
          placeholder="All categories"
          value={category}
          openOnFocus
          onSearchChange={setCategorySearch}
          onChange={(value) => {
            setCategory(value);
            setSelected(null);
            setConfirmingDelete(null);
          }}
        />
        <div className="relative flex flex-col gap-2">
          <span className="text-base text-ink-gray-5 mx-3">Templates</span>
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
                <div
                  key={template.value}
                  className={cn(
                    "flex items-center gap-1 rounded-md pr-3 text-ink-gray-8 hover:bg-surface-gray-2",
                    selected?.value === template.value && "bg-surface-gray-3",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelected(template)}
                    className="flex min-w-0 flex-1 flex-col items-start gap-1 rounded-md px-3 py-2 text-left"
                  >
                    <div className="flex w-full items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-base font-medium text-ink-gray-8">
                        {template.label}
                      </span>
                      {template.category && (
                        <span className="text-xs text-ink-gray-7 px-1.5 py-0.75 border border-outline-gray-2 rounded-[5px]">
                          {template.category}
                        </span>
                      )}
                    </div>
                    <span className="w-full truncate text-sm text-ink-gray-5">
                      {template.template_description ||
                        stripTags(template.description)}
                    </span>
                  </button>
                  {confirmingDelete === template.value ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        theme="gray"
                        size="sm"
                        label="Cancel"
                        disabled={isDeleting}
                        onClick={() => setConfirmingDelete(null)}
                      />
                      <Button
                        type="button"
                        variant="solid"
                        theme="red"
                        size="sm"
                        label="Delete"
                        loading={isDeleting}
                        onClick={() => void handleDeleteTemplate(template)}
                      />
                    </div>
                  ) : (
                    <Button
                      className="shrink-0"
                      type="button"
                      variant="ghost"
                      theme="gray"
                      size="sm"
                      icon={DeleteAlt}
                      aria-label={`Delete ${template.label}`}
                      onClick={() => setConfirmingDelete(template.value)}
                    />
                  )}
                </div>
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

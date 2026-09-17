/**
 * External dependencies.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Combobox,
  Dialog,
  ErrorMessage,
  Textarea,
  TextInput,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { useForm } from "@tanstack/react-form";
import {
  FrappeError,
  useFrappeCreateDoc,
  useFrappePostCall,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useNoteTemplateCategoryLookup } from "@/hooks/useNoteTemplateCategoryLookup";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { noteTemplateFormSchema } from "./schema";
import {
  TEMPLATE_DESCRIPTION_MAX_LENGTH,
  TEMPLATE_DOCTYPE,
} from "../constants";

const CATEGORY_DOCTYPE = "Project Status Update Template Category";

type SaveTemplateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Name of the template being edited; absent when creating a new one. */
  templateName?: string;
  /** Note title carried over from the editor. */
  defaultTitle: string;
  /** Category carried over from the template being edited. */
  defaultCategory?: string | null;
  /** Short description carried over from the template being edited. */
  defaultDescription?: string;
  /** Note body stored as the template content. */
  description: string;
  onSaved: () => void;
};

export function SaveTemplateDialog({
  open,
  onOpenChange,
  templateName,
  defaultTitle,
  defaultCategory = null,
  defaultDescription = "",
  description,
  onSaved,
}: SaveTemplateDialogProps) {
  const toast = useToasts();
  const [categorySearch, setCategorySearch] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { createDoc, loading: isCreating } = useFrappeCreateDoc();
  const { updateDoc, loading: isUpdating } = useFrappeUpdateDoc();
  const { call: renameDoc, loading: isRenaming } = useFrappePostCall(
    "frappe.client.rename_doc",
  );
  const isEditing = Boolean(templateName);
  const isSaving = isCreating || isUpdating || isRenaming;

  const { options: existingCategories, isLoading: isCategoryLoading } =
    useNoteTemplateCategoryLookup({
      shouldFetch: open,
      query: categorySearch,
      keepPreviousData: true,
    });

  const pendingCategory = categorySearch.trim();

  // Unmatched search text is offered as an option so it can be picked and kept.
  const categoryOptions = useMemo(() => {
    if (
      !pendingCategory ||
      existingCategories.some(
        (option) =>
          option.label.toLowerCase() === pendingCategory.toLowerCase(),
      )
    ) {
      return existingCategories;
    }

    return [
      ...existingCategories,
      {
        label: pendingCategory,
        value: pendingCategory,
        description: "New category",
      },
    ];
  }, [existingCategories, pendingCategory]);

  const resolveCategory = async (selected: string | null) => {
    if (!selected) return null;

    if (!existingCategories.some((option) => option.value === selected)) {
      try {
        await createDoc(CATEGORY_DOCTYPE, { __newname: selected });
      } catch {
        // Ignore duplicate category creation errors.
      }
    }

    return selected;
  };

  const form = useForm({
    defaultValues: {
      title: defaultTitle,
      category: defaultCategory,
      template_description: defaultDescription,
    },
    validators: {
      onSubmit: noteTemplateFormSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);

      try {
        const category = await resolveCategory(value.category);

        if (templateName) {
          // Template name is the document name (autoname: field:template_name).
          if (value.title !== templateName) {
            await renameDoc({
              doctype: TEMPLATE_DOCTYPE,
              old_name: templateName,
              new_name: value.title,
            });
          }

          await updateDoc(TEMPLATE_DOCTYPE, value.title, {
            title: value.title,
            description,
            category: category ?? "",
            template_description: value.template_description,
          });

          toast.success("Template updated");
        } else {
          await createDoc(TEMPLATE_DOCTYPE, {
            template_name: value.title,
            title: value.title,
            description,
            ...(category ? { category } : {}),
            ...(value.template_description
              ? { template_description: value.template_description }
              : {}),
          });

          toast.success("Template saved");
        }

        onSaved();
      } catch (err) {
        setSubmitError(parseFrappeErrorMsg(err as FrappeError));
      }
    },
  });

  useEffect(() => {
    if (!open) return;

    form.reset({
      title: defaultTitle,
      category: defaultCategory,
      template_description: defaultDescription,
    });
    setCategorySearch(defaultCategory ?? "");
    setSubmitError(null);
  }, [open, defaultTitle, defaultCategory, defaultDescription, form]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      className="my-0 max-w-110"
      classNames={{
        viewport: "justify-start pt-30",
        header: "mb-5.25",
        content: "pt-5 pb-4",
        footer: "pb-6",
      }}
      options={{
        title: isEditing ? "Edit template" : "New template",
        size: "md",
      }}
      actions={
        <form.Subscribe selector={(state) => state.values.title.trim()}>
          {(title) => (
            <Button
              className="w-full h-7"
              variant="solid"
              theme="gray"
              label={isEditing ? "Save changes" : "Save template"}
              onClick={() => form.handleSubmit()}
              disabled={isSaving || !title}
              loading={isSaving}
            />
          )}
        </form.Subscribe>
      }
    >
      <div className="-mt-2 space-y-4">
        <form.Field
          name="title"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="block text-base text-ink-gray-5">Title</label>
              <TextInput
                variant="outline"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Add template title"
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </div>
          )}
        />

        <form.Field
          name="category"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="block text-base text-ink-gray-5">
                Category
              </label>
              <Combobox
                inputClassName="bg-surface-white h-8 border-outline-gray-2 text-ink-gray-7"
                loading={isCategoryLoading}
                options={categoryOptions}
                searchValue={categorySearch}
                placeholder="Select notes category"
                value={field.state.value}
                openOnFocus
                onSearchChange={(search) => {
                  if (!search) return;

                  setCategorySearch(search);
                  const trimmed = search.trim();
                  const match = existingCategories.find(
                    (option) =>
                      option.label.toLowerCase() === trimmed.toLowerCase(),
                  );
                  field.handleChange(match?.value ?? trimmed);
                }}
                onChange={(value, option) => {
                  setCategorySearch(
                    typeof option === "string"
                      ? option
                      : (option?.label ?? value ?? ""),
                  );
                  field.handleChange(value);
                }}
                emptyMessage="Type to add a category"
              />
            </div>
          )}
        />

        <form.Field
          name="template_description"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="block text-base text-ink-gray-5">
                Description
              </label>
              <Textarea
                variant="outline"
                rows={4}
                value={field.state.value}
                onChange={(e) =>
                  field.handleChange(
                    e.target.value.slice(0, TEMPLATE_DESCRIPTION_MAX_LENGTH),
                  )
                }
                placeholder="Type something"
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </div>
          )}
        />

        {submitError ? <ErrorMessage message={submitError} /> : null}
      </div>
    </Dialog>
  );
}

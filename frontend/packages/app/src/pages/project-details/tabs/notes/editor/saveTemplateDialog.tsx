/**
 * External dependencies.
 */
import { useContext, useEffect, useMemo, useState } from "react";
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
  FrappeContext,
  FrappeError,
  useFrappeCreateDoc,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useNoteTemplateCategoryLookup } from "@/hooks/useNoteTemplateCategoryLookup";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { noteTemplateFormSchema } from "./schema";
import { TEMPLATE_DESCRIPTION_MAX_LENGTH } from "../constants";

const TEMPLATE_DOCTYPE = "Project Status Update Template";
const CATEGORY_DOCTYPE = "Project Status Update Template Category";

type SaveTemplateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Note title carried over from the editor. */
  defaultTitle: string;
  /** Note body stored as the template content. */
  description: string;
  onSaved: () => void;
};

export function SaveTemplateDialog({
  open,
  onOpenChange,
  defaultTitle,
  description,
  onSaved,
}: SaveTemplateDialogProps) {
  const toast = useToasts();
  const frappe = useContext(FrappeContext);
  const [categorySearch, setCategorySearch] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { createDoc, loading: isSaving } = useFrappeCreateDoc();

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

    const existing = await frappe?.db.getCount(CATEGORY_DOCTYPE, [
      ["name", "=", selected],
    ]);
    if (!existing) {
      await createDoc(CATEGORY_DOCTYPE, { __newname: selected });
    }

    return selected;
  };

  const form = useForm({
    defaultValues: {
      title: defaultTitle,
      category: null as string | null,
      template_description: "",
    },
    validators: {
      onSubmit: noteTemplateFormSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);

      try {
        const category = await resolveCategory(value.category);

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
      category: null,
      template_description: "",
    });
    setCategorySearch("");
    setSubmitError(null);
  }, [open, defaultTitle, form]);

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
      options={{ title: "New Template", size: "md" }}
      actions={
        <form.Subscribe selector={(state) => state.values.title.trim()}>
          {(title) => (
            <Button
              className="w-full h-7"
              variant="solid"
              theme="gray"
              label="Save template"
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
                  // The combobox blanks its input on select and on close, so an
                  // empty search is a reset rather than the user clearing it.
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

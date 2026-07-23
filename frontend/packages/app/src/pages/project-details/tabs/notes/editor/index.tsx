/**
 * External dependencies.
 */
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Spinner } from "@next-pms/design-system/components";
import {
  Avatar,
  Button,
  ErrorMessage,
  TextEditor,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { useForm } from "@tanstack/react-form";
import {
  FrappeError,
  useFrappeGetCall,
  useFrappePostCall,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { UnsavedChangesProvider } from "@/pages/allocations/unsavedChanges/UnsavedChangesProvider";
import { useUnsavedChangesSource } from "@/pages/allocations/unsavedChanges/useUnsavedChanges";
import { useProjectDetail } from "@/pages/project-details/context";
import { useUser } from "@/providers/user";
import { noteFormSchema } from "./schema";
import { TEMPLATE_PARAM } from "../constants";
import { useNotes } from "../context";

function NoteEditor() {
  const navigate = useNavigate();
  const { noteId } = useParams<{
    noteId?: string;
  }>();
  const mode: "edit" | "new" = noteId ? "edit" : "new";
  const [searchParams] = useSearchParams();
  const templateName = mode === "new" ? searchParams.get(TEMPLATE_PARAM) : null;
  const userName = useUser((s) => s.state.userName);
  const userImage = useUser((s) => s.state.image);
  const projectId = useProjectDetail((s) => s.projectId);
  const refresh = useNotes((s) => s.actions.refresh);
  const toast = useToasts();
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const sourceRef = useUnsavedChangesSource();

  const { call: createNote, loading: isCreating } = useFrappePostCall(
    "next_pms.timesheet.api.project_status_update.create_project_status_update",
  );
  const { call: updateNote, loading: isUpdating } = useFrappePostCall(
    "next_pms.timesheet.api.project_status_update.update_project_status_update",
  );
  const { data: noteData, isLoading: isNoteLoading } = useFrappeGetCall(
    "next_pms.timesheet.api.project_status_update.get_project_status_update",
    { name: noteId },
    mode === "edit" && noteId ? undefined : null,
  );
  const {
    data: templateData,
    isLoading: isTemplateLoading,
    error: templateError,
  } = useFrappeGetCall(
    "frappe.client.get",
    { doctype: "Project Status Update Template", name: templateName },
    templateName ? undefined : null,
    { shouldRetryOnError: false },
  );

  const form = useForm({
    defaultValues: {
      project: projectId,
      title: noteData?.message.title || templateData?.message?.title || "",
      description:
        noteData?.message.description ||
        templateData?.message?.description ||
        "",
      status: "Publish",
    },
    validators: {
      onSubmit: noteFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const payload = {
          title: value.title,
          description: value.description,
          status: value.status,
        };

        if (mode === "new") {
          await createNote({
            project: value.project,
            ...payload,
          });
        } else {
          await updateNote({
            name: noteId,
            ...payload,
          });
        }

        toast.success("Note saved");
        await refresh();
        form.reset(value);
        navigate(`${ROUTES.project}/${projectId}?tab=notes`);
      } catch (err) {
        const error = parseFrappeErrorMsg(err as FrappeError);
        toast.error(error);
      }
    },
  });

  useEffect(() => {
    const ready =
      (mode === "edit" && !!noteData?.message) ||
      (mode === "new" &&
        (!templateName || !!templateData?.message || !!templateError));
    if (ready) {
      setIsFormInitialized(true);
    }
  }, [noteData, templateData, templateError, templateName, mode]);

  const isInputDisabled =
    isCreating || isUpdating || isNoteLoading || isTemplateLoading;

  useEffect(() => {
    if (isFormInitialized && titleRef.current) {
      titleRef.current.focus();
    }
  }, [isFormInitialized]);

  useImperativeHandle(
    sourceRef,
    () => ({
      hasUnsavedChanges: () => form.state.isDirty,
      saveChanges: () => {
        void form.handleSubmit();
      },
      discardChanges: () => form.reset(),
    }),
    [form],
  );

  return (
    <div className="flex justify-center">
      {isNoteLoading || isTemplateLoading || !isFormInitialized ? (
        <Spinner className="py-10" />
      ) : (
        <div className="max-w-200 w-full p-4">
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
            <form.Subscribe selector={(state) => state.isDirty}>
              {(isDirty) => (
                <Button
                  variant="solid"
                  theme="gray"
                  size="sm"
                  label="Save note"
                  loading={isCreating || isUpdating}
                  disabled={isInputDisabled || !isDirty}
                  onClick={() => form.handleSubmit()}
                />
              )}
            </form.Subscribe>
          </div>
          <div className="flex flex-col gap-2 pt-4">
            <form.Field
              name="title"
              children={(field) => {
                return (
                  <>
                    <input
                      ref={titleRef}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={isInputDisabled}
                      placeholder="Add note title"
                      aria-label="Note title"
                      className="w-full resize-none border-0 bg-transparent text-3xl font-semibold leading-tight text-ink-gray-7 placeholder:text-ink-gray-4 focus:outline-none"
                    />
                    {!field.state.meta.isValid && (
                      <ErrorMessage
                        message={field.state.meta.errors[0]?.message}
                      />
                    )}
                  </>
                );
              }}
            />

            <form.Field
              name="description"
              children={(field) => {
                return (
                  <>
                    <TextEditor
                      content={field.state.value}
                      onChange={(value) => field.handleChange(value)}
                      placeholder="Type a note description..."
                      editable={!isInputDisabled}
                      fixedMenu={false}
                      editorClass="prose prose-sm max-w-none min-h-[400px] text-ink-gray-6 [&_:is(h1,h2,h3,h4,h5,h6)]:text-ink-gray-7 focus:outline-none"
                    />
                    {!field.state.meta.isValid && (
                      <ErrorMessage
                        message={field.state.meta.errors[0]?.message}
                      />
                    )}
                  </>
                );
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function NoteEditorWithUnsavedGuard() {
  return (
    <UnsavedChangesProvider>
      <NoteEditor />
    </UnsavedChangesProvider>
  );
}

export default NoteEditorWithUnsavedGuard;

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ErrorFallback, Spinner } from "@next-pms/design-system/components";
import { useToasts } from "@rtcamp/frappe-ui-react";
import type { FrappeError } from "frappe-react-sdk";

import { parseFrappeErrorMsg } from "@/lib/utils";
import { ProjectDetailHeader } from "@/pages/project-details/header";
import { ProjectDetailProvider } from "@/pages/project-details/provider";
import { useUser } from "@/providers/user";
import { buildNotesGridPath } from "./constants";
import { NoteEditorSubHeader } from "./subHeader";
import type { NoteEditorMode } from "./types";
import { useNoteDetail } from "./useNoteDetail";
import { useNoteMutation } from "./useNoteMutation";
import { NoteEditorWorkspace } from "./workspace";

type NoteEditorProps = {
  mode: NoteEditorMode;
};

export function NoteEditor({ mode }: NoteEditorProps) {
  const { projectId = "", noteId } = useParams<{
    projectId: string;
    noteId?: string;
  }>();

  return (
    <ProjectDetailProvider projectId={projectId}>
      <div className="flex h-full flex-col">
        <ProjectDetailHeader />
        <div className="flex-1 overflow-auto scrollbar-thin">
          <div className="mx-auto w-full max-w-[800px] px-4 py-6">
            <ErrorFallback>
              <NoteEditorGate
                mode={mode}
                projectId={projectId}
                noteId={noteId}
              />
            </ErrorFallback>
          </div>
        </div>
      </div>
    </ProjectDetailProvider>
  );
}

type NoteEditorBodyProps = {
  mode: NoteEditorMode;
  projectId: string;
  noteId: string | undefined;
};

/**
 * Defers Workspace mount until edit-mode data has arrived so the underlying
 * TextEditor captures the loaded description on its first render (tiptap only
 * reads `content` on mount; subsequent prop changes are ignored).
 */
function NoteEditorGate({ mode, projectId, noteId }: NoteEditorBodyProps) {
  const { note, isLoading, error } = useNoteDetail(
    mode === "edit" ? noteId : undefined,
  );

  if (error) throw error;

  if (mode === "edit" && (isLoading || !note)) {
    return <Spinner className="py-10" />;
  }

  return (
    <NoteEditorBody
      mode={mode}
      projectId={projectId}
      noteId={noteId}
      initialTitle={mode === "edit" ? note?.title ?? "" : ""}
      initialDescription={mode === "edit" ? note?.description ?? "" : ""}
    />
  );
}

type NoteEditorBodyInnerProps = NoteEditorBodyProps & {
  initialTitle: string;
  initialDescription: string;
};

function NoteEditorBody({
  mode,
  projectId,
  noteId,
  initialTitle,
  initialDescription,
}: NoteEditorBodyInnerProps) {
  const navigate = useNavigate();
  const toast = useToasts();
  const userName = useUser((s) => s.state.userName);
  const userImage = useUser((s) => s.state.image);

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);

  const { save, isSubmitting } = useNoteMutation(
    mode === "edit" && noteId
      ? { mode: "edit", projectId, noteId }
      : { mode: "new", projectId },
  );

  const canSave = title.trim().length > 0;

  const handleSave = async () => {
    try {
      await save({ title, description });
      toast.success("Note saved");
      navigate(buildNotesGridPath(projectId));
    } catch (err) {
      toast.error(parseFrappeErrorMsg(err as FrappeError));
    }
  };

  return (
    <div className="flex flex-col">
      <NoteEditorSubHeader
        userName={userName}
        userImage={userImage}
        canSave={canSave}
        isSubmitting={isSubmitting}
        onSave={handleSave}
      />
      <NoteEditorWorkspace
        mode={mode}
        title={title}
        description={description}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
      />
    </div>
  );
}

export default NoteEditor;

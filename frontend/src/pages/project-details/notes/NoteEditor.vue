<script setup lang="ts">
import {
  computed,
  nextTick,
  reactive,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Avatar,
  Button,
  ErrorMessage,
  Spinner,
  toast,
  useCall,
} from "frappe-ui";
import { useUnsavedChangesSource } from "@/composables/useUnsavedChanges";
import { TAB_PARAM } from "@/pages/project-details/constants";
import LoadError from "@/pages/project-details/LoadError.vue";
import RichTextEditor from "@/pages/project-details/RichTextEditor.vue";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { useSession } from "@/session";
import { errorMessage, isAbortError } from "@/utils/errors";
import { queryString } from "@/utils/query";
import {
  EDITOR_MODE_PARAM,
  NOTES_API,
  PUBLISH_STATUS,
  TEMPLATE_DOCTYPE,
  TEMPLATE_EDITOR_MODE,
  TEMPLATE_PARAM,
} from "./constants";
import {
  hasBody,
  initialNoteForm,
  isNoteFormDirty,
  noteFormErrors,
} from "./notes";
import type { FormErrors, NoteDetails, NoteForm, NoteTemplate } from "./types";

type Params = Record<string, unknown>;

const route = useRoute();
const router = useRouter();
const session = useSession();
const { projectId } = useProjectDetails();

// Read once: the editor's route view is keyed by the full path.
const noteId = String(route.params.noteId ?? "");
const templateId = String(route.params.templateId ?? "");
const templateMode =
  Boolean(templateId) ||
  (!noteId &&
    queryString(route.query[EDITOR_MODE_PARAM]) === TEMPLATE_EDITOR_MODE);
const templateName =
  templateId || (noteId ? "" : queryString(route.query[TEMPLATE_PARAM]));

const noteCall = useCall<NoteDetails, Params>({
  url: `${NOTES_API}.get_project_status_update`,
  params: { name: noteId },
  immediate: Boolean(noteId),
});
const templateCall = useCall<NoteTemplate, Params>({
  url: "/api/v2/method/frappe.client.get",
  params: { doctype: TEMPLATE_DOCTYPE, name: templateName },
  immediate: Boolean(templateName),
});
const createCall = useCall<NoteDetails, Params>({
  url: `${NOTES_API}.create_project_status_update`,
  method: "POST",
  immediate: false,
});
const updateCall = useCall<NoteDetails, Params>({
  url: `${NOTES_API}.update_project_status_update`,
  method: "POST",
  immediate: false,
});

function failure(error: unknown) {
  return error && !isAbortError(error) ? error : null;
}

/** A note or template being edited that couldn't be read; a missing `?template=` starts blank, as React. */
const loadError = computed(() =>
  noteId
    ? failure(noteCall.error)
    : templateId
      ? failure(templateCall.error)
      : null,
);

const form = reactive<NoteForm>({ title: "", description: "" });
const initial = shallowRef<NoteForm>({ ...form });
const initialized = ref(false);
const errors = ref<FormErrors<NoteForm>>({});
const saving = ref(false);

const dirty = computed(() => isNoteFormDirty(form, initial.value));

const titleInput = useTemplateRef<HTMLInputElement>("titleInput");

watch(
  () =>
    noteId
      ? noteCall.data
      : !templateName || templateCall.data || templateCall.error,
  async (ready) => {
    if (!ready || initialized.value) return;
    initial.value = initialNoteForm(noteCall.data, templateCall.data);
    Object.assign(form, initial.value);
    initialized.value = true;
    await nextTick();
    titleInput.value?.focus();
  },
  { immediate: true },
);

watch(
  () => form.title,
  () => (errors.value.title = undefined),
);
watch(
  () => form.description,
  () => (errors.value.description = undefined),
);

function markClean() {
  initial.value = { ...form };
}

function goToList() {
  return router.push({
    name: "project-details",
    params: { projectId: projectId.value },
    query: { [TAB_PARAM]: "notes" },
  });
}

async function saveNote(onSaved?: () => void) {
  errors.value = noteFormErrors(form);
  if (saving.value || Object.keys(errors.value).length) return;
  const payload = {
    title: form.title,
    description: form.description,
    status: PUBLISH_STATUS,
  };
  saving.value = true;
  try {
    if (noteId) await updateCall.submit({ name: noteId, ...payload });
    else await createCall.submit({ project: projectId.value, ...payload });
  } catch (error) {
    toast.error(errorMessage(error));
    return;
  } finally {
    saving.value = false;
  }
  toast.success("Note saved");
  markClean();
  onSaved?.();
  goToList();
}

useUnsavedChangesSource({
  hasUnsavedChanges: () => dirty.value,
  saveChanges: (onSaved) => saveNote(onSaved),
  discardChanges: () => Object.assign(form, initial.value),
});

const canSaveTemplate = computed(
  () => Boolean(form.title.trim()) && hasBody(form.description),
);
</script>

<template>
  <LoadError
    v-if="loadError"
    :title="
      templateId ? 'Couldn\'t load the template' : 'Couldn\'t load the note'
    "
    :error="loadError"
    @retry="noteId ? noteCall.reload() : templateCall.reload()"
  />
  <div v-else-if="!initialized" class="flex justify-center py-10">
    <Spinner class="size-5" />
  </div>
  <div v-else class="flex justify-center">
    <!-- eslint-disable-next-line better-tailwindcss/no-restricted-classes -- React's 800px column is past the max-width scale -->
    <div class="w-full max-w-[800px] p-4">
      <div class="flex items-center justify-between gap-8">
        <div class="flex min-w-0 items-center gap-2">
          <Avatar
            size="xs"
            :label="session.userName ?? ''"
            :image="session.userImage || undefined"
          />
          <span class="truncate text-base-medium text-ink-gray-7">
            {{ session.userName }}
          </span>
        </div>
        <Button
          v-if="templateMode"
          variant="solid"
          label="Save template"
          :disabled="saving || !canSaveTemplate"
        />
        <Button
          v-else
          variant="solid"
          label="Save note"
          :loading="saving"
          :disabled="saving || !dirty"
          @click="saveNote()"
        />
      </div>
      <div class="flex flex-col gap-2 pt-4">
        <input
          ref="titleInput"
          v-model="form.title"
          class="w-full border-0 bg-transparent p-0 text-4xl-semibold leading-tight text-ink-gray-7 placeholder:text-ink-gray-4 focus-visible:outline-none"
          :disabled="saving"
          :placeholder="templateMode ? 'Add template title' : 'Add note title'"
          :aria-label="templateMode ? 'Template title' : 'Note title'"
        />
        <ErrorMessage v-if="errors.title" :message="errors.title" />
        <RichTextEditor
          v-model="form.description"
          variant="borderless"
          label="Description"
          placeholder="Type a note description..."
          content-class="min-h-100"
          :disabled="saving"
        />
        <ErrorMessage v-if="errors.description" :message="errors.description" />
      </div>
    </div>
  </div>
</template>

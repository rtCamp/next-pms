<script setup lang="ts">
import { computed } from "vue";
import { Spinner, useCall } from "frappe-ui";
import { Comments } from "@/components/Comments";
import LoadError from "@/pages/project-details/LoadError.vue";
import { useProjectComments } from "@/pages/project-details/useProjectComments";
import { useSession } from "@/session";
import { isAbortError } from "@/utils/errors";
import { NOTES_API } from "./constants";
import type { NoteDetails } from "./types";

const props = defineProps<{ noteId: string }>();

const session = useSession();
const noteParams = () => ({ name: props.noteId });

const details = useCall<NoteDetails, { name: string }>({
  url: `${NOTES_API}.get_project_status_update`,
  params: noteParams,
});

const loadError = computed(() =>
  details.error && !isAbortError(details.error) ? details.error : null,
);

const { commentProps } = useProjectComments({
  list: {
    comments: () => details.data?.comments ?? [],
    loading: () => details.loading,
    reload: () => details.reload(),
  },
  add: {
    url: `${NOTES_API}.add_comment_to_project_status_update`,
    params: noteParams,
  },
  update: {
    url: `${NOTES_API}.update_comment_in_project_status_update`,
    params: noteParams,
  },
  delete: {
    url: `${NOTES_API}.delete_comment_from_project_status_update`,
    params: noteParams,
  },
});
</script>

<template>
  <LoadError
    v-if="loadError && !details.data"
    title="Couldn't load the comments"
    :error="loadError"
    @retry="details.reload()"
  />
  <div v-else-if="!details.data" class="flex justify-center py-10">
    <Spinner class="size-5" />
  </div>
  <Comments
    v-else
    v-bind="commentProps"
    title="Comments"
    input-placeholder="Type a comment"
    input-submit-label="Post"
    :input-avatar-name="session.userName"
    :input-avatar-image="session.userImage || null"
  />
</template>

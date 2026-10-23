<script setup lang="ts">
import { Comments } from "@/components/Comments";
import { useProjectComments } from "@/pages/project-details/useProjectComments";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { useSession } from "@/session";
import { FEEDBACK_API } from "./constants";
import LoadError from "./LoadError.vue";

const props = defineProps<{ feedbackId: string }>();

const { projectId } = useProjectDetails();
const session = useSession();

const { commentProps, error, reload } = useProjectComments({
  list: {
    url: `${FEEDBACK_API}.get_feedback_comments`,
    params: () => ({ feedback: props.feedbackId }),
  },
  add: {
    url: `${FEEDBACK_API}.add_comment_to_feedback`,
    params: () => ({ feedback: props.feedbackId, project: projectId.value }),
  },
  update: { url: `${FEEDBACK_API}.update_comment_in_feedback` },
  delete: { url: `${FEEDBACK_API}.delete_comment_from_feedback` },
});
</script>

<template>
  <LoadError
    v-if="error"
    title="Couldn't load the comments"
    :error="error"
    @retry="reload()"
  />
  <Comments
    v-else
    v-bind="commentProps"
    class="mt-0 gap-4 border-none pt-0"
    title="Comments"
    input-placeholder="Add a comment"
    input-submit-label="Post"
    input-trigger-class="sticky bottom-0 -mb-6 bg-gradient-to-t from-surface-elevation-1 pb-6"
    :input-avatar-name="session.userName"
    :input-avatar-image="session.userImage || null"
  >
    <template #title>
      <h3 class="text-2xl-semibold text-ink-gray-7">Comments</h3>
    </template>
  </Comments>
</template>

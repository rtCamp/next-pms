<script setup lang="ts">
import { Comments } from "@/components/Comments";
import { useProjectComments } from "@/pages/project-details/useProjectComments";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { RAG_API } from "./constants";
import type { RagComment } from "./types";

const props = defineProps<{
  comments: RagComment[];
  isReloading: boolean;
  reload: () => Promise<unknown>;
}>();

const { projectId } = useProjectDetails();
const projectParams = () => ({ project: projectId.value });

const { commentProps } = useProjectComments({
  list: {
    comments: () => props.comments,
    loading: () => props.isReloading,
    reload: () => props.reload(),
  },
  add: { url: `${RAG_API}.add_project_rag_comment`, params: projectParams },
  update: {
    url: `${RAG_API}.update_project_rag_comment`,
    params: projectParams,
  },
  delete: {
    url: `${RAG_API}.delete_project_rag_comment`,
    params: projectParams,
  },
});
</script>

<template>
  <Comments
    v-bind="commentProps"
    title="Comments"
    input-placeholder="Add a comment"
    input-submit-label="Post"
  />
</template>

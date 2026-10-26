<script setup lang="ts">
import { Button, Spinner } from "frappe-ui";
import { RichText } from "@/components/RichText";
import LoadError from "@/pages/project-details/LoadError.vue";
import DocumentUploadButton from "@/pages/project-details/shared/DocumentUploadButton.vue";
import FileCard from "@/pages/project-details/shared/FileCard.vue";
import UpdateEntry from "@/pages/project-details/shared/UpdateEntry.vue";
import { RISK_DOCTYPE } from "./constants";
import RiskDetailHeader from "./RiskDetailHeader.vue";
import RiskLevelPill from "./RiskLevelPill.vue";
import RiskStatusBadge from "./RiskStatusBadge.vue";
import RiskUpdateDialog from "./RiskUpdateDialog.vue";
import { useRiskDetail } from "./useRiskDetail";

const props = defineProps<{ riskId: string }>();

const detail = useRiskDetail(props.riskId);
const {
  risk,
  loading,
  loadError,
  notFound,
  users,
  updates,
  files,
  followers,
  isFollowing,
  permissions,
} = detail;
</script>

<template>
  <div v-if="loading" class="flex justify-center py-10">
    <Spinner class="size-5" />
  </div>
  <p v-else-if="notFound" class="py-10 text-center text-sm text-ink-gray-5">
    Risk not found.
  </p>
  <LoadError
    v-else-if="loadError"
    title="Couldn't load the risk"
    :error="loadError"
    @retry="detail.reload()"
  />
  <div v-else-if="risk" class="flex flex-col gap-3.5">
    <RiskDetailHeader
      :risk="risk"
      :users="users"
      :followers="followers"
      :following="isFollowing"
      @toggle-follow="detail.toggleFollow()"
    />
    <div>
      <section class="mb-5">
        <RichText
          v-if="risk.summary"
          :content="risk.summary"
          kit="richText"
          class="prose-sm w-full max-w-full leading-normal text-ink-gray-7"
        />
        <p v-else class="text-sm text-ink-gray-5">No summary provided.</p>
      </section>
      <section class="mb-4.5">
        <h3 class="mb-2 text-lg-medium text-ink-gray-7">Mitigation plan</h3>
        <RichText
          v-if="risk.mitigation_plan"
          :content="risk.mitigation_plan"
          kit="richText"
          class="prose-sm w-full max-w-full leading-normal text-ink-gray-7"
        />
        <p v-else class="text-sm text-ink-gray-5">
          No mitigation plan provided.
        </p>
      </section>
      <section class="mb-4.5">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-lg-medium text-ink-gray-7">Additional documents</h3>
          <DocumentUploadButton
            v-if="permissions.canEdit"
            :doctype="RISK_DOCTYPE"
            :docname="risk.name"
            @uploaded="detail.onUploaded()"
          />
        </div>
        <div v-if="files.length" class="flex flex-wrap gap-3">
          <FileCard v-for="file in files" :key="file.name" :file="file" />
        </div>
        <p v-else class="text-sm text-ink-gray-5">No documents attached.</p>
      </section>
      <section>
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-lg-medium text-ink-gray-7">Updates</h3>
          <Button
            v-if="permissions.canEdit"
            variant="ghost"
            icon="lucide-plus"
            label="Add update"
            @click="detail.openAddUpdate()"
          />
        </div>
        <div v-if="updates.length">
          <UpdateEntry
            v-for="update in updates"
            :key="update.name"
            :author="update.author"
            :updated-at="update.updated_at"
            :note="update.note"
            :can-manage="detail.canManage(update)"
            @edit="detail.openEditUpdate(update)"
            @delete="detail.requestDeleteUpdate(update)"
          >
            <template #badges>
              <span
                v-if="update.status"
                class="rounded-full bg-surface-gray-2 px-2 py-1 text-sm text-ink-gray-7"
              >
                <RiskStatusBadge :status="update.status" />
              </span>
              <RiskLevelPill :level="update.risk_level" />
            </template>
          </UpdateEntry>
        </div>
        <p v-else class="text-sm text-ink-gray-5">No updates yet.</p>
      </section>
    </div>
    <RiskUpdateDialog :detail="detail" />
  </div>
</template>

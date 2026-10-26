<script setup lang="ts">
import { computed } from "vue";
import { Button, Spinner } from "frappe-ui";
import { RichText } from "@/components/RichText";
import LoadError from "@/pages/project-details/LoadError.vue";
import ActivitySection from "@/pages/project-details/shared/ActivitySection.vue";
import DocumentUploadButton from "@/pages/project-details/shared/DocumentUploadButton.vue";
import FileCard from "@/pages/project-details/shared/FileCard.vue";
import UpdateEntry from "@/pages/project-details/shared/UpdateEntry.vue";
import LinkedTodos from "@/pages/project-details/to-do/LinkedTodos.vue";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { formatCurrency } from "@/utils/format";
import { GROWTH_DOCTYPE } from "./constants";
import GrowthDetailHeader from "./GrowthDetailHeader.vue";
import GrowthPriorityPill from "./GrowthPriorityPill.vue";
import GrowthStatusBadge from "./GrowthStatusBadge.vue";
import { growthDetails } from "./growth";
import { useGrowthDetail } from "./useGrowthDetail";

const props = defineProps<{ growthId: string }>();

const { doc: project } = useProjectDetails();
const detail = useGrowthDetail(props.growthId);
const {
  initiative,
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

const currency = computed(
  () => project.value?.custom_currency || window.boot?.sysdefaults?.currency,
);
const details = computed(() =>
  initiative.value ? growthDetails(initiative.value, currency.value) : [],
);
const record = computed(() => ({
  doctype: GROWTH_DOCTYPE,
  name: props.growthId,
  title: initiative.value?.activity ?? "",
  type: "Growth Initiative" as const,
}));
</script>

<template>
  <div v-if="loading" class="flex justify-center py-10">
    <Spinner class="size-5" />
  </div>
  <p v-else-if="notFound" class="py-10 text-center text-sm text-ink-gray-5">
    Growth initiative not found.
  </p>
  <LoadError
    v-else-if="loadError"
    title="Couldn't load the growth initiative"
    :error="loadError"
    @retry="detail.reload()"
  />
  <div v-else-if="initiative" class="flex flex-col gap-3.5">
    <GrowthDetailHeader
      :initiative="initiative"
      :users="users"
      :followers="followers"
      :following="isFollowing"
      @toggle-follow="detail.toggleFollow()"
    />
    <div>
      <section class="mb-5">
        <RichText
          v-if="initiative.description"
          :content="initiative.description"
          kit="richText"
          class="prose-sm w-full max-w-full leading-normal text-ink-gray-7"
        />
        <p v-else class="text-sm text-ink-gray-5">No description provided.</p>
      </section>
      <section class="mb-4.5">
        <h3 class="mb-2 text-lg-medium text-ink-gray-7">
          Desired outcome / ROI
        </h3>
        <RichText
          v-if="initiative.desired_outcome"
          :content="initiative.desired_outcome"
          kit="richText"
          class="prose-sm w-full max-w-full leading-normal text-ink-gray-7"
        />
        <p v-else class="text-sm text-ink-gray-5">
          No desired outcome provided.
        </p>
      </section>
      <section class="mb-4.5">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-lg-medium text-ink-gray-7">Additional documents</h3>
          <DocumentUploadButton
            v-if="permissions.canEdit"
            :doctype="GROWTH_DOCTYPE"
            :docname="initiative.name"
            @uploaded="detail.reloadFiles()"
          />
        </div>
        <div v-if="files.length" class="flex flex-wrap gap-3">
          <FileCard v-for="file in files" :key="file.name" :file="file" />
        </div>
        <p v-else class="text-sm text-ink-gray-5">No documents attached.</p>
      </section>
      <section class="mb-4.5">
        <LinkedTodos
          :record="record"
          :can-edit="permissions.canEdit"
          empty-message="No action items yet."
        >
          <template #title>
            <h3 class="text-lg-medium text-ink-gray-7">Action items</h3>
          </template>
        </LinkedTodos>
      </section>
      <section class="mb-4.5">
        <h3 class="mb-2 text-lg-medium text-ink-gray-7">Details</h3>
        <!-- eslint-disable-next-line better-tailwindcss/no-restricted-classes -- labels size to their text beside the values; no grid template token for it -->
        <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-base">
          <template v-for="{ label, value } in details" :key="label">
            <dt class="text-ink-gray-5">{{ label }}</dt>
            <dd class="text-ink-gray-7">{{ value }}</dd>
          </template>
        </dl>
      </section>
      <section class="mb-4.5">
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
                class="rounded-full bg-surface-gray-2 px-2 py-1"
              >
                <GrowthStatusBadge :status="update.status" />
              </span>
              <span
                v-if="update.closed_status"
                class="rounded-full bg-surface-gray-2 px-2 py-1"
              >
                {{ update.closed_status }}
              </span>
              <GrowthPriorityPill
                v-if="update.client_priority"
                :priority="update.client_priority"
              />
              <span
                v-if="update.billable_outcome"
                class="rounded-full bg-surface-gray-2 px-2 py-1"
              >
                {{ formatCurrency(update.billable_outcome, currency) }}
              </span>
            </template>
          </UpdateEntry>
        </div>
        <p v-else class="text-sm text-ink-gray-5">No updates yet.</p>
      </section>
      <ActivitySection
        :doctype="GROWTH_DOCTYPE"
        :name="initiative.name"
        :modified="initiative.modified"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { Spinner, toast, useCall } from "frappe-ui";
import { errorMessage } from "@/utils/errors";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import EmailCard from "./EmailCard.vue";
import type { ApiCommunication } from "./types";
import { toSortedEmails } from "./utils";

const { projectId } = useProjectDetails();

const emailsCall = useCall<ApiCommunication[], { project: string }>({
  url: "/api/v2/method/next_pms.next_projects.api.email.get_project_emails",
  params: () => ({ project: projectId.value }),
  refetch: true,
});

const emails = computed(() => toSortedEmails(emailsCall.data ?? []));

watch(
  () => emailsCall.error,
  (error) => {
    if (error) toast.error(errorMessage(error));
  },
);
</script>

<template>
  <div
    v-if="emailsCall.loading && !emailsCall.data"
    class="flex h-64 items-center justify-center"
  >
    <Spinner class="size-6" />
  </div>
  <p
    v-else-if="!emails.length"
    class="py-6 text-center text-base text-ink-gray-5"
  >
    No emails found.
  </p>
  <div v-else class="flex flex-col gap-4">
    <h2 class="text-2xl-semibold text-ink-gray-7">Email</h2>
    <div class="flex flex-col">
      <EmailCard
        v-for="(email, index) in emails"
        :key="email.id"
        :email="email"
        :default-expanded="index === 0"
        :is-last="index === emails.length - 1"
      />
    </div>
  </div>
</template>

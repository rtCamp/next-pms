<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  Button,
  Checkbox,
  dayjs,
  DateRangePicker,
  Select,
  TextInput,
  toast,
  Tooltip,
  useCall,
  type DateRangeValue,
} from "frappe-ui";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { errorMessage } from "@/utils/errors";
import { REPORT_API } from "./constants";
import SlackChannelField from "./SlackChannelField.vue";
import { durationPresets, previousReportUrl, repositoryOptions } from "./utils";

const props = defineProps<{ generating: boolean }>();

const { projectId, doc, reload } = useProjectDetails();

const dateRange = ref<DateRangeValue>([]);
const repository = ref("");
const board = ref("");
const includePreviousReport = ref(false);

const presets = durationPresets();
const today = dayjs().format("YYYY-MM-DD");

const repositories = computed(() =>
  repositoryOptions(doc.value?.custom_project_repository_connections),
);
watch(
  repositories,
  (options) => {
    if (!repository.value && options[0]) repository.value = options[0].value;
  },
  { immediate: true },
);

const boardsCall = useCall<string[], { repository: string }>({
  url: `${REPORT_API}.get_repository_project_boards`,
  params: () => ({ repository: repository.value }),
  refetch: true,
  immediate: Boolean(repository.value),
});
const boards = computed(() =>
  repository.value
    ? (boardsCall.data ?? []).map((name) => ({ label: name, value: name }))
    : [],
);
watch(boards, (options) => {
  if (!options.some((option) => option.value === board.value)) {
    board.value = options[0]?.value ?? "";
  }
});

const generateCall = useCall<unknown, Record<string, unknown>>({
  url: `${REPORT_API}.generate_pm_report`,
  method: "POST",
  immediate: false,
});

async function generate() {
  const previous = previousReportUrl(doc.value?.custom_project_reports ?? []);
  try {
    await generateCall.submit({
      project: projectId.value,
      from_date: dateRange.value[0] ?? "",
      to_date: dateRange.value[1] ?? "",
      selected_repo: repository.value,
      selected_board: board.value,
      previous_doc_url:
        includePreviousReport.value && previous ? previous : undefined,
    });
  } catch (error) {
    toast.error(errorMessage(error));
    return;
  }
  reload();
  toast.success(
    "Report is being generated. You'll be notified when it's ready",
  );
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="generate">
    <h2 class="text-2xl-semibold text-ink-gray-8">Report Configuration</h2>

    <div class="grid grid-cols-2 gap-4">
      <DateRangePicker
        v-model="dateRange"
        label="Report Duration"
        placeholder="Select duration"
        format="MMM D, YYYY"
        variant="outline"
        :max="today"
        :typeable="false"
      >
        <template #actions="{ setRange, close }">
          <Button
            v-for="preset in presets"
            :key="preset.label"
            size="sm"
            variant="ghost"
            :label="preset.label"
            @click="
              setRange(preset.range);
              close();
            "
          />
        </template>
      </DateRangePicker>

      <SlackChannelField />

      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- frappe-ui's Select renders a <label> from `label` -->
      <Select
        v-model="repository"
        class="col-span-2"
        label="GitHub Repository"
        variant="outline"
        :options="repositories"
        placeholder="Select repository…"
      />

      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- frappe-ui's Select renders a <label> from `label` -->
      <Select
        v-model="board"
        class="col-span-2"
        label="Project Board"
        variant="outline"
        :options="boards"
        :disabled="!boards.length"
        placeholder="Select project board…"
      />

      <TextInput
        class="col-span-2"
        label="Report Drive Link"
        variant="outline"
        :model-value="doc?.custom_project_drive_link ?? ''"
        disabled
        placeholder="Not set"
      />

      <Checkbox
        v-model="includePreviousReport"
        class="col-span-2"
        label="Include previous report as reference"
      />
    </div>

    <div class="flex justify-end">
      <Tooltip
        text="A report is currently being generated"
        :disabled="!props.generating"
      >
        <span>
          <Button
            type="submit"
            variant="solid"
            label="Generate Project Report"
            :loading="generateCall.loading"
            :disabled="generateCall.loading || props.generating"
          />
        </span>
      </Tooltip>
    </div>
  </form>
</template>

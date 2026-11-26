<script setup lang="ts">
import { ref } from "vue";
import { Button, Dropdown, Select, TextInput } from "frappe-ui";
import { useRouter } from "vue-router";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import {
  EDITOR_MODE_PARAM,
  NOTE_EDITOR_ROUTES,
  TEMPLATE_EDITOR_MODE,
} from "./constants";
import SubscribeButton from "./SubscribeButton.vue";
import TemplatePickerDialog from "./TemplatePickerDialog.vue";
import { useNotes } from "./useNotes";

const router = useRouter();
const { projectId } = useProjectDetails();
const { titleInput, descriptionInput, author, authorOptions } = useNotes();

const pickerOpen = ref(false);

const createOptions = [
  { label: "New from template", onClick: () => (pickerOpen.value = true) },
  {
    label: "New blank note",
    onClick: () =>
      router.push({
        name: NOTE_EDITOR_ROUTES.new,
        params: { projectId: projectId.value },
      }),
  },
  {
    label: "Create template",
    onClick: () =>
      router.push({
        name: NOTE_EDITOR_ROUTES.new,
        params: { projectId: projectId.value },
        query: { [EDITOR_MODE_PARAM]: TEMPLATE_EDITOR_MODE },
      }),
  },
];
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-1 flex-wrap items-center justify-between gap-2">
      <h2 class="text-2xl-semibold leading-tighter text-ink-gray-7">Notes</h2>
      <div class="flex items-center gap-2">
        <SubscribeButton />
        <Dropdown :options="createOptions" align="end">
          <Button
            variant="solid"
            icon-left="lucide-plus"
            icon-right="lucide-chevron-down"
            label="Create"
          />
        </Dropdown>
      </div>
    </div>
    <div
      class="flex flex-wrap items-center justify-between gap-2 max-md:flex-col max-md:items-stretch"
    >
      <div class="flex flex-1 gap-2 max-md:flex-col">
        <TextInput
          v-model="titleInput"
          class="w-full max-w-64 max-md:max-w-none"
          placeholder="Search title"
          aria-label="Search title"
        />
        <TextInput
          v-model="descriptionInput"
          class="w-full max-w-64 max-md:max-w-none"
          placeholder="Search description"
          aria-label="Search description"
        />
      </div>
      <!-- Select shows "All" for the "" option; unset, it shows the name as React does. -->
      <Select
        :model-value="author || undefined"
        class="w-fit max-md:w-full"
        :options="authorOptions"
        placeholder="Select Author"
        aria-label="Author"
        @update:model-value="author = String($event ?? '')"
      />
    </div>
    <TemplatePickerDialog v-model:open="pickerOpen" />
  </div>
</template>

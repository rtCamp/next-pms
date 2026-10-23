<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  Button,
  Combobox,
  Dialog,
  dialog,
  Spinner,
  TextInput,
  toast,
  useCall,
} from "frappe-ui";
import { useDoctypeLinkLookup } from "@/composables/useDoctypeLinkLookup";
import { useRemoteLookup } from "@/composables/useRemoteLookup";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { errorMessage } from "@/utils/errors";
import {
  CATEGORY_DOCTYPE,
  NOTE_EDITOR_ROUTES,
  TEMPLATE_DOCTYPE,
  TEMPLATE_PARAM,
  TEMPLATE_PICKER_LIMIT,
} from "./constants";
import { templateListFilters, templateSummary } from "./notes";
import type { NoteTemplate } from "./types";

const open = defineModel<boolean>("open", { required: true });

const router = useRouter();
const { projectId } = useProjectDetails();

const query = ref("");
const category = ref<string | null>(null);
const categoryQuery = ref("");
const selected = ref<string | null>(null);
/** Bumped to read the templates again after a delete. */
const reloads = ref(0);

const TEMPLATE_FIELDS = [
  "name",
  "template_name",
  "title",
  "description",
  "template_description",
  "category",
];

const templates = useRemoteLookup<
  NoteTemplate[],
  NoteTemplate,
  { label: string; value: string; template: NoteTemplate }
>({
  method: "frappe.client.get_list",
  enabled: open,
  query,
  params: (search) => {
    const { filters, or_filters } = templateListFilters(search, category.value);
    return {
      doctype: TEMPLATE_DOCTYPE,
      fields: JSON.stringify(TEMPLATE_FIELDS),
      limit_page_length: TEMPLATE_PICKER_LIMIT,
      order_by: "modified desc",
      filters: filters && JSON.stringify(filters),
      or_filters: or_filters && JSON.stringify(or_filters),
      start: 0,
    };
  },
  getItems: (rows) => rows ?? [],
  toOption: (template) => ({
    label: template.template_name,
    value: template.name,
    template,
  }),
  refetchOn: () => [category.value, reloads.value],
});

const categories = useDoctypeLinkLookup({
  doctype: CATEGORY_DOCTYPE,
  enabled: open,
  query: categoryQuery,
});

watch([query, category], () => (selected.value = null));

const deleteCall = useCall<unknown, { doctype: string; name: string }>({
  url: "/api/v2/method/frappe.client.delete",
  method: "POST",
  immediate: false,
});

function requestDelete(template: NoteTemplate) {
  dialog.danger({
    title: "Delete template",
    message:
      "Are you sure you want to delete this template? This action cannot be undone.",
    confirmLabel: "Delete",
    onConfirm: async () => {
      try {
        await deleteCall.submit({
          doctype: TEMPLATE_DOCTYPE,
          name: template.name,
        });
      } catch (error) {
        throw new Error(errorMessage(error));
      }
      if (selected.value === template.name) selected.value = null;
      reloads.value++;
      toast.success("Template deleted");
    },
  });
}

function editTemplate(template: NoteTemplate) {
  open.value = false;
  router.push({
    name: NOTE_EDITOR_ROUTES.template,
    params: { projectId: projectId.value, templateId: template.name },
  });
}

function useTemplate() {
  if (!selected.value) return;
  open.value = false;
  router.push({
    name: NOTE_EDITOR_ROUTES.new,
    params: { projectId: projectId.value },
    query: { [TEMPLATE_PARAM]: selected.value },
  });
}
</script>

<template>
  <Dialog v-model:open="open" title="Add Template" size="md" position="top">
    <div class="flex flex-col gap-5">
      <TextInput
        v-model="query"
        size="md"
        placeholder="Search template"
        aria-label="Search template"
      >
        <template #prefix>
          <span
            class="lucide-search size-4 text-ink-gray-5"
            aria-hidden="true"
          />
        </template>
      </TextInput>
      <Combobox
        v-model="category"
        v-model:query="categoryQuery"
        variant="outline"
        :options="categories.options"
        :loading="categories.loading"
        :filterable="false"
        open-on-focus
        placeholder="All categories"
        aria-label="Category"
      />
      <div class="relative flex flex-col gap-2">
        <span class="text-base text-ink-gray-5">Templates</span>
        <div
          v-if="!templates.loading && !templates.options.length"
          class="flex h-80 items-center justify-center"
        >
          <span class="text-base text-ink-gray-4">No templates found</span>
        </div>
        <div
          v-else
          class="flex h-80 flex-col gap-1 overflow-auto transition-opacity duration-150"
          :class="templates.loading && 'pointer-events-none opacity-50'"
        >
          <div
            v-for="option in templates.options"
            :key="option.value"
            class="flex items-center gap-1 rounded-5 pr-3 text-ink-gray-8 hover:bg-surface-gray-2"
            :class="selected === option.value && 'bg-surface-gray-3'"
          >
            <button
              type="button"
              class="flex min-w-0 flex-1 items-center gap-2 rounded-5 px-3 py-2 text-left"
              :aria-pressed="selected === option.value"
              @click="selected = option.value"
            >
              <span class="flex min-w-0 flex-1 flex-col gap-1">
                <span class="w-full truncate text-base-medium text-ink-gray-8">
                  {{ option.label }}
                </span>
                <span class="w-full truncate text-sm text-ink-gray-5">
                  {{ templateSummary(option.template) }}
                </span>
              </span>
              <span
                v-if="option.template.category"
                class="shrink-0 rounded-2 border border-outline-gray-2 px-1.5 py-0.5 text-xs text-ink-gray-7"
              >
                {{ option.template.category }}
              </span>
            </button>
            <div class="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                icon="lucide-pencil"
                :label="`Edit ${option.label}`"
                @click="editTemplate(option.template)"
              />
              <Button
                variant="ghost"
                icon="lucide-trash-2"
                :label="`Delete ${option.label}`"
                @click="requestDelete(option.template)"
              />
            </div>
          </div>
        </div>
        <div
          v-if="templates.loading"
          class="absolute inset-0 flex items-center justify-center"
        >
          <Spinner class="size-5" />
        </div>
      </div>
    </div>
    <template #actions>
      <div class="flex w-full items-center justify-end gap-2">
        <Button variant="ghost" label="Cancel" @click="open = false" />
        <Button
          variant="solid"
          label="Use template"
          :disabled="!selected"
          @click="useTemplate"
        />
      </div>
    </template>
  </Dialog>
</template>

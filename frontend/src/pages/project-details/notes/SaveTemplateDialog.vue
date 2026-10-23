<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  Button,
  Combobox,
  Dialog,
  ErrorMessage,
  FrappeResponseError,
  Textarea,
  TextInput,
  toast,
  useCall,
} from "frappe-ui";
import { useDoctypeLinkLookup } from "@/composables/useDoctypeLinkLookup";
import { errorMessage } from "@/utils/errors";
import {
  CATEGORY_DOCTYPE,
  TEMPLATE_DESCRIPTION_MAX_LENGTH,
  TEMPLATE_DOCTYPE,
} from "./constants";
import {
  categoryOptions,
  newTemplateDoc,
  templateFormErrors,
  templateValues,
} from "./notes";
import type { FormErrors, TemplateForm } from "./types";

const props = defineProps<{
  /** The template being edited (its name); absent for a new one. */
  templateName?: string;
  defaultTitle: string;
  defaultCategory: string | null;
  defaultDescription: string;
  /** The editor's body, saved as the template's content. */
  description: string;
}>();
const emit = defineEmits<{ saved: [] }>();
const open = defineModel<boolean>("open", { required: true });

type Params = Record<string, unknown>;
const clientCall = (method: string) =>
  useCall<unknown, Params>({
    url: `/api/v2/method/frappe.client.${method}`,
    method: "POST",
    immediate: false,
  });
const insertCall = clientCall("insert");
const renameCall = clientCall("rename_doc");
const setValueCall = clientCall("set_value");

const form = reactive<TemplateForm>({
  title: "",
  category: null,
  template_description: "",
});
const errors = ref<FormErrors<TemplateForm>>({});
const submitError = ref<string | null>(null);
const saving = ref(false);
const categoryQuery = ref("");

watch(
  open,
  (isOpen) => {
    if (!isOpen) return;
    Object.assign(form, {
      title: props.defaultTitle,
      category: props.defaultCategory,
      template_description: props.defaultDescription,
    });
    categoryQuery.value = props.defaultCategory ?? "";
    errors.value = {};
    submitError.value = null;
  },
  { immediate: true },
);

const categories = useDoctypeLinkLookup({
  doctype: CATEGORY_DOCTYPE,
  enabled: open,
  query: categoryQuery,
});
const options = computed(() =>
  categoryOptions(categories.options, categoryQuery.value),
);

// As React: typed text is the category, matched to an existing one's case.
watch(categoryQuery, (query) => {
  const typed = query.trim();
  if (!typed) return;
  const match = categories.options.find(
    (option) => option.label.toLowerCase() === typed.toLowerCase(),
  );
  form.category = match?.value ?? typed;
});

async function ensureCategory(category: string | null) {
  if (!category || categories.options.some((o) => o.value === category)) {
    return;
  }
  try {
    await insertCall.submit({
      doc: JSON.stringify({ doctype: CATEGORY_DOCTYPE, __newname: category }),
    });
  } catch (error) {
    // Created meanwhile, or missed by the search: use it.
    if (
      !(error instanceof FrappeResponseError) ||
      error.type !== "DuplicateEntryError"
    ) {
      throw error;
    }
  }
}

async function save() {
  if (props.templateName) {
    let name = props.templateName;
    if (form.title !== name) {
      await renameCall.submit({
        doctype: TEMPLATE_DOCTYPE,
        old_name: name,
        new_name: form.title,
      });
      name = form.title;
    }
    await setValueCall.submit({
      doctype: TEMPLATE_DOCTYPE,
      name,
      fieldname: JSON.stringify(templateValues(form, props.description)),
    });
  } else {
    await insertCall.submit({
      doc: JSON.stringify({
        doctype: TEMPLATE_DOCTYPE,
        ...newTemplateDoc(form, props.description),
      }),
    });
  }
}

async function submit() {
  errors.value = templateFormErrors(form);
  if (saving.value || Object.keys(errors.value).length) return;
  saving.value = true;
  submitError.value = null;
  try {
    await ensureCategory(form.category);
    await save();
  } catch (error) {
    submitError.value = errorMessage(error);
    return;
  } finally {
    saving.value = false;
  }
  toast.success(props.templateName ? "Template updated" : "Template saved");
  emit("saved");
}
</script>

<template>
  <Dialog
    v-model:open="open"
    :title="templateName ? 'Edit template' : 'New template'"
    size="md"
    position="top"
    :dismissible="!saving"
  >
    <form class="space-y-4" novalidate @submit.prevent="submit">
      <TextInput
        v-model="form.title"
        label="Title"
        variant="outline"
        size="md"
        placeholder="Add template title"
        :error="errors.title"
      />
      <Combobox
        v-model="form.category"
        v-model:query="categoryQuery"
        label="Category"
        variant="outline"
        size="md"
        :options="options"
        :loading="categories.loading"
        :filterable="false"
        open-on-focus
        placeholder="Select notes category"
        empty-text="Type to add a category"
      />
      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- frappe-ui's Textarea renders a <label> from `label` -->
      <Textarea
        v-model="form.template_description"
        label="Description"
        variant="outline"
        :rows="4"
        :maxlength="TEMPLATE_DESCRIPTION_MAX_LENGTH"
        placeholder="Type something"
        :error="errors.template_description"
      />
      <ErrorMessage v-if="submitError" :message="submitError" />
    </form>
    <template #actions>
      <Button
        class="w-full"
        variant="solid"
        :label="templateName ? 'Save changes' : 'Save template'"
        :loading="saving"
        :disabled="saving || !form.title.trim()"
        @click="submit"
      />
    </template>
  </Dialog>
</template>

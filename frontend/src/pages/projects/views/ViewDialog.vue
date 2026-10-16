<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { Button, Dialog, FormLabel, Switch, TextInput, toast } from "frappe-ui";
import { errorMessage } from "@/utils/errors";
import { DEFAULT_VIEW_ICON } from "./constants";
import EmojiPicker from "./EmojiPicker.vue";
import { useProjectViews } from "./useProjectViews";

const views = useProjectViews();

const open = computed({
  get: () => views.viewDialog !== null,
  set: (value) => {
    if (!value && !submitting.value) views.viewDialog = null;
  },
});
const isEdit = computed(() => views.viewDialog?.mode === "edit");

const form = reactive({ name: "", icon: DEFAULT_VIEW_ICON, isPublic: false });
const nameError = ref("");
const submitting = ref(false);

watch(
  () => views.viewDialog,
  (state) => {
    if (!state) return;
    const view = state.mode === "edit" ? state.view : null;
    form.name = view?.label ?? "";
    form.icon =
      view?.icon && !view.icon.startsWith("lucide-")
        ? view.icon
        : DEFAULT_VIEW_ICON;
    form.isPublic = Boolean(view?.public);
    nameError.value = "";
  },
);
watch(
  () => form.name,
  () => (nameError.value = ""),
);

async function submit() {
  if (!form.name.trim()) {
    nameError.value = "Enter View Name";
    return;
  }
  submitting.value = true;
  try {
    await views.saveViewDialog({
      label: form.name.trim(),
      icon: form.icon,
      isPublic: form.isPublic,
    });
  } catch (error) {
    toast.error(errorMessage(error));
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Dialog
    v-model:open="open"
    :title="isEdit ? 'Edit View' : 'Create View'"
    position="top"
    :padding-top="88"
    :dismissible="!submitting"
  >
    <form class="space-y-4" novalidate @submit.prevent="submit">
      <div class="space-y-1.5">
        <FormLabel label="Name" required />
        <div class="flex items-start gap-2">
          <EmojiPicker v-model="form.icon" />
          <TextInput
            v-model="form.name"
            class="flex-1"
            size="md"
            variant="outline"
            placeholder="View Name"
            aria-label="View Name"
            :error="nameError"
          />
        </div>
      </div>
      <Switch v-model="form.isPublic" size="sm" label="Make this view public" />
    </form>

    <template #actions>
      <div class="flex w-full items-center justify-end gap-2">
        <Button
          variant="ghost"
          label="Cancel"
          :disabled="submitting"
          @click="open = false"
        />
        <Button
          variant="solid"
          :label="isEdit ? 'Update' : 'Create'"
          :disabled="submitting"
          @click="submit"
        />
      </div>
    </template>
  </Dialog>
</template>

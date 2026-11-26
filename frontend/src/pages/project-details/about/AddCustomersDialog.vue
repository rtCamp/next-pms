<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Avatar, Button, Dialog, Spinner, TextInput } from "frappe-ui";
import { useCustomerContactLookup } from "@/pages/project-details/useCustomerContactLookup";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { errorMessage } from "@/utils/errors";
import { useProjectSidebar } from "./useProjectSidebar";

const open = defineModel<boolean>("open", { required: true });

const { doc } = useProjectDetails();
const { customerContactIds, addCustomer, removeCustomer, isBusy } =
  useProjectSidebar();

const customer = computed(() => doc.value?.customer ?? "");

const query = ref("");
watch(open, (isOpen) => {
  if (!isOpen) query.value = "";
});

const lookup = useCustomerContactLookup({
  customer,
  enabled: open,
  query,
});

const rows = computed(() =>
  lookup.options.map((option) => ({
    ...option,
    added: customerContactIds.value.includes(option.value),
    busy: isBusy(`customer:${option.value}`),
  })),
);
</script>

<template>
  <Dialog v-model:open="open" title="Add customers" size="lg" position="top">
    <div class="flex flex-col gap-3">
      <TextInput
        v-model="query"
        role="searchbox"
        variant="subtle"
        placeholder="Search customers"
        aria-label="Search customers"
        :disabled="!customer"
      >
        <template #prefix>
          <span
            class="lucide-search size-4 text-ink-gray-5"
            aria-hidden="true"
          />
        </template>
      </TextInput>

      <!-- eslint-disable better-tailwindcss/no-restricted-classes -- a thin scrollbar as React's list; no utility for scrollbar-width -->
      <div
        class="h-55 overflow-y-auto rounded-6 border border-outline-gray-2 px-2.5 py-2 [scrollbar-width:thin]"
      >
        <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
        <p
          v-if="!customer"
          class="py-6 text-center text-base leading-tighter text-ink-gray-5"
        >
          Set a customer on the project to add its contacts.
        </p>
        <div
          v-else-if="lookup.loading && !rows.length"
          class="flex h-full items-center justify-center"
        >
          <Spinner class="size-4" />
        </div>
        <p
          v-else-if="lookup.error"
          role="alert"
          class="py-6 text-center text-base leading-tighter text-ink-red-6"
        >
          {{ errorMessage(lookup.error) }}
        </p>
        <p
          v-else-if="!rows.length"
          class="py-6 text-center text-base leading-tighter text-ink-gray-5"
        >
          No matching customers
        </p>
        <ul
          v-else
          class="flex flex-col divide-y divide-outline-gray-1 pb-2"
          aria-label="Customer contacts"
        >
          <li
            v-for="row in rows"
            :key="row.value"
            class="flex items-center gap-1 py-2 first:pt-0 last:pb-0"
          >
            <div class="flex min-w-0 flex-1 items-center gap-2">
              <Avatar size="sm" :label="row.label" />
              <div class="flex min-w-0 flex-1 flex-col">
                <span
                  class="truncate text-base-medium leading-tighter text-ink-gray-7"
                >
                  {{ row.label }}
                </span>
                <span class="truncate text-sm text-ink-gray-5">
                  {{ row.value }}
                </span>
              </div>
            </div>
            <Button
              v-if="row.added"
              variant="subtle"
              theme="red"
              label="Remove"
              :loading="row.busy"
              @click="removeCustomer(row.value)"
            />
            <Button
              v-else
              variant="subtle"
              theme="gray"
              label="Add"
              :loading="row.busy"
              @click="addCustomer(row.value)"
            />
          </li>
        </ul>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Avatar, Combobox, useCall } from "frappe-ui";

interface Approver {
  name: string;
  employee_name: string;
  image?: string | null;
}

const reportsTo = defineModel<string | null>({ default: null });

const approvers = useCall<Approver[]>({
  url: "/api/v2/method/next_pms.timesheet.api.get_approver_details",
});

const options = computed(() => [
  { label: "All", value: "" },
  ...(approvers.data ?? []).map((employee) => ({
    label: employee.employee_name,
    value: employee.name,
    image: employee.image ?? undefined,
  })),
]);

const model = computed({
  get: () => reportsTo.value,
  set: (value: string | number | null | undefined) =>
    (reportsTo.value = value ? String(value) : null),
});

function avatarOf(option: unknown) {
  return option as { label: string; value: string; image?: string };
}
</script>

<template>
  <Combobox
    v-model="model"
    class="w-44"
    :options="options"
    :loading="approvers.loading"
    open-on-focus
    placeholder="Reports to"
    aria-label="Reports to"
  >
    <template #item-prefix="{ item }">
      <Avatar
        v-if="avatarOf(item).value"
        size="xs"
        :image="avatarOf(item).image"
        :label="avatarOf(item).label"
      />
    </template>
  </Combobox>
</template>

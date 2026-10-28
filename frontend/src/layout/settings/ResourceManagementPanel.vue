<script setup lang="ts">
import { computed } from "vue";
import { Button, Checkbox, Combobox, FormLabel, Select } from "frappe-ui";
import { InfoHoverCard } from "@/components/InfoHoverCard";
import { useSession } from "@/session";
import { WEEK_DAY_OPTIONS } from "./constants";
import { SETTINGS_HELP } from "./help";
import SettingsLinkField from "./SettingsLinkField.vue";
import SettingsMultiSelectField from "./SettingsMultiSelectField.vue";
import { useSystemSettingsForm } from "./settingsForm";

const { form, flag, table } = useSystemSettingsForm();
const session = useSession();

const sendReminder = flag("send_missing_allocation_reminder");
const designations = table("designations", "designation");

const currencyOptions = computed(() =>
  session.currencies.map((currency) => ({ label: currency, value: currency })),
);
const currency = computed({
  get: () => form.default_currency || null,
  set: (value) => {
    form.default_currency = value ? String(value) : null;
  },
});
</script>

<template>
  <div class="pt-10">
    <section>
      <h3 class="text-lg-semibold text-ink-gray-8">Rate Display</h3>
      <div class="mt-5 max-w-sm space-y-1.5">
        <div class="flex min-w-0 items-center gap-1.5">
          <FormLabel id="default-currency" label="Default Currency" />
          <InfoHoverCard :help="SETTINGS_HELP.defaultCurrency" />
        </div>
        <Combobox
          id="default-currency"
          v-model="currency"
          class="w-full"
          size="md"
          variant="outline"
          :options="currencyOptions"
          open-on-focus
          placeholder="Select Currency"
        >
          <template v-if="currency" #suffix="{ clear }">
            <Button
              class="size-4 shrink-0"
              variant="ghost"
              size="xs"
              icon="lucide-x"
              label="Clear default currency"
              @click.stop="clear()"
            />
          </template>
        </Combobox>
      </div>
    </section>

    <section class="mt-10">
      <h3 class="text-lg-semibold text-ink-gray-8">Allocation Notifications</h3>
      <div class="mt-5 flex max-w-sm flex-col gap-5">
        <div class="flex min-w-0 items-center gap-1.5">
          <Checkbox
            v-model="sendReminder"
            label="Send Missing Allocation Reminder"
          />
          <InfoHoverCard :help="SETTINGS_HELP.missingAllocationReminder" />
        </div>
        <template v-if="sendReminder">
          <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- frappe-ui's Select renders a <label> from `label` -->
          <Select
            v-model="form.remind_on"
            label="Remind On"
            :options="WEEK_DAY_OPTIONS"
          />
          <SettingsLinkField
            v-model="form.allocation_email_template"
            label="Email Template"
            doctype="Email Template"
          />
          <SettingsMultiSelectField
            v-model="designations"
            label="Designations"
            doctype="Designation"
          />
        </template>
      </div>
    </section>
  </div>
</template>

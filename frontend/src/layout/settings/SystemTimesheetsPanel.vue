<script setup lang="ts">
import { Checkbox, Select, TextInput } from "frappe-ui";
import { WEEK_DAY_OPTIONS } from "./constants";
import SettingsLinkField from "./SettingsLinkField.vue";
import SettingsMultiSelectField from "./SettingsMultiSelectField.vue";
import { useSystemSettingsForm } from "./settingsForm";

const { form, flag, number, table } = useSystemSettingsForm();

const backdated = flag("allow_backdated_entries");
const futureEntries = flag("allow_future_entries");
const weekendEntries = flag("allow_weekend_entries");
const dailyReminder = flag("send_daily_reminder");
const approvalReminder = flag("send_reminder_on_approval_request");
const weeklyReminder = flag("send_weekly_approval_reminder");
const employeeDays = number("allow_backdated_entries_till_employee");
const managerDays = number("allow_backdated_entries_till_manager");
const expandedWeeks = number("auto_expand_weeks_by_default");
const exemptRoles = table("ignored_role", "role");
const departments = table("allowed_departments", "department");
</script>

<template>
  <div class="pt-10">
    <section>
      <h3 class="text-lg-semibold text-ink-gray-8">Time Entry Rules</h3>
      <div class="mt-5 flex max-w-sm flex-col gap-5">
        <Checkbox v-model="backdated" label="Allow Backdated Entries" />
        <template v-if="backdated">
          <TextInput
            v-model="employeeDays"
            type="number"
            min="0"
            step="1"
            label="Allow backdated time entry for days limit - Employee"
          />
          <TextInput
            v-model="managerDays"
            type="number"
            min="0"
            step="1"
            label="Allow backdated time entry for days limit - Manager"
          />
          <SettingsMultiSelectField
            v-model="exemptRoles"
            label="Backdated Entry Limit - Exempted Roles"
            doctype="Role"
          />
        </template>
        <Checkbox v-model="futureEntries" label="Allow Future Entries" />
        <Checkbox v-model="weekendEntries" label="Allow Weekend Entries" />
        <TextInput
          v-model="expandedWeeks"
          type="number"
          min="0"
          step="1"
          label="Auto Expand Weeks by Default"
        />
      </div>
    </section>

    <section class="mt-10">
      <h3 class="text-lg-semibold text-ink-gray-8">Reminder Settings</h3>
      <div class="mt-5 flex max-w-sm flex-col gap-5">
        <Checkbox v-model="dailyReminder" label="Send Daily Reminder" />
        <SettingsLinkField
          v-if="dailyReminder"
          v-model="form.daily_reminder_template"
          label="Daily Reminder Template"
          doctype="Email Template"
        />
        <Checkbox
          v-model="approvalReminder"
          label="Send Reminder On Approval Request"
        />
        <SettingsLinkField
          v-if="approvalReminder"
          v-model="form.approval_request_reminder_template"
          label="Approval Request Reminder Template"
          doctype="Email Template"
        />
        <SettingsLinkField
          v-model="form.timesheet_approval_template"
          label="Timesheet Approval Template"
          doctype="Email Template"
          clearable
        />
        <SettingsLinkField
          v-model="form.timesheet_rejection_template"
          label="Timesheet Rejection Template"
          doctype="Email Template"
          clearable
        />
        <Checkbox
          v-model="weeklyReminder"
          label="Send Weekly Approval Reminder"
        />
        <template v-if="weeklyReminder">
          <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- frappe-ui's Select renders a <label> from `label` -->
          <Select
            v-model="form.day_to_send_reminder"
            label="Day To Send Weekly Reminder"
            :options="WEEK_DAY_OPTIONS"
          />
          <SettingsLinkField
            v-model="form.weekly_approval_reminder_template"
            label="Weekly Approval Reminder Template"
            doctype="Email Template"
          />
        </template>
        <SettingsMultiSelectField
          v-if="dailyReminder || weeklyReminder"
          v-model="departments"
          label="Allowed Departments"
          doctype="Department"
        />
      </div>
    </section>
  </div>
</template>

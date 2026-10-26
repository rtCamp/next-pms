<script setup lang="ts">
import { Spinner } from "frappe-ui";
import { useSession } from "@/session";
import { formatRelativeTimeShort } from "@/utils/text";
import { activityKey, activityName, tableChangeText } from "./activity";
import { useActivity } from "./useActivity";

const props = defineProps<{
  doctype: string;
  name: string;
  modified: string;
}>();

const session = useSession();
const { items, users, loading, error } = useActivity(
  props.doctype,
  props.name,
  () => props.modified,
);

function who(userId: string) {
  return activityName(userId, session.userId, users.value);
}
</script>

<template>
  <section>
    <h3 class="mb-3 text-lg-medium text-ink-gray-7">Activity</h3>
    <Spinner v-if="loading" class="size-4" />
    <p v-else-if="error" class="text-sm text-ink-red-8">
      Could not load activity.
    </p>
    <p v-else-if="!items.length" class="text-sm text-ink-gray-5">
      No activity yet.
    </p>
    <ul v-else>
      <li
        v-for="(item, index) in items"
        :key="activityKey(item, index)"
        class="relative ml-1 border-l border-outline-gray-1 pb-4 pl-4 last:border-transparent last:pb-0"
      >
        <!-- eslint-disable better-tailwindcss/no-restricted-classes -- centres the 8px dot on the 1px rail; no -4.5px step -->
        <span
          class="absolute -left-[4.5px] top-2 size-2 rounded-full bg-surface-gray-8"
        />
        <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
        <p class="text-base leading-relaxed text-ink-gray-6">
          <template v-if="item.type === 'created'">
            {{ who(item.user) }} created this
          </template>
          <template v-else-if="item.type === 'edited'">
            {{ who(item.user) }} last edited this
          </template>
          <template v-else-if="item.type === 'changed'">
            {{ who(item.user) }}
            <template v-if="item.changes.length">changed the value of</template>
            <template v-for="(change, i) in item.changes" :key="change.label">
              <template v-if="i > 0">, </template>
              {{ change.label }} from
              <span class="font-medium text-ink-gray-8">{{
                change.old || '""'
              }}</span>
              to
              <span class="font-medium text-ink-gray-8">{{
                change.new || '""'
              }}</span>
            </template>
            <template
              v-for="(table, i) in item.table_changes"
              :key="table.label"
            >
              <template v-if="i > 0 || item.changes.length">, </template>
              {{ tableChangeText(table) }}
            </template>
            <template v-if="item.impersonated_by">
              ·
              <span class="font-medium text-ink-gray-8">
                Impersonated by {{ who(item.impersonated_by) }}
              </span>
            </template>
          </template>
          · {{ formatRelativeTimeShort(item.timestamp, new Date(), true) }}
        </p>
      </li>
    </ul>
  </section>
</template>

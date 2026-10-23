<script setup lang="ts">
import { computed } from "vue";
import { Avatar } from "frappe-ui";
import {
  List,
  ListCell,
  ListHeader,
  ListHeaderCell,
  ListRow,
  ListRows,
} from "frappe-ui/list";
import { LINKED_RECORD_ICON } from "@/pages/project-details/to-do/constants";
import { formatProjectDate } from "@/utils/date";
import AvatarStack from "./AvatarStack.vue";
import { isOverdue } from "./calendar";
import type { TableColumn } from "./constants";
import ItemActions from "./ItemActions.vue";
import ItemHoverCard from "./ItemHoverCard.vue";
import TodosCell from "./TodosCell.vue";
import type { TimelineItem } from "./types";

const props = defineProps<{
  items: TimelineItem[];
  columns: TableColumn[];
  emptyMessage: string;
  label: string;
}>();

const widths = computed(() => props.columns.map((column) => column.width));

function hasColumn(key: TableColumn["key"]) {
  return props.columns.some((column) => column.key === key);
}
</script>

<template>
  <p v-if="!items.length" class="py-10 text-center text-sm text-ink-gray-4">
    {{ emptyMessage }}
  </p>
  <div v-else class="overflow-x-auto">
    <List :columns="widths" :aria-label="label" class="min-w-min list-row-px-2">
      <ListHeader>
        <ListHeaderCell v-for="column in columns" :key="column.key">
          {{ column.label }}
        </ListHeaderCell>
      </ListHeader>
      <ListRows v-slot="{ item }" :items="items" row-key="name">
        <ListRow>
          <ListCell class="min-w-0 gap-2 text-ink-gray-8">
            <span
              class="size-3.5 shrink-0"
              :class="LINKED_RECORD_ICON[item.type]"
              aria-hidden="true"
            />
            <ItemHoverCard :item="item">
              <span class="flex min-w-0 items-center gap-2">
                <span class="max-w-56 truncate text-base-medium">
                  {{ item.title }}
                </span>
                <span
                  v-if="item.isInternal"
                  class="lucide-lock size-3.5 shrink-0 text-ink-gray-5"
                  role="img"
                  aria-label="Internal"
                />
              </span>
            </ItemHoverCard>
          </ListCell>
          <ListCell class="min-w-0 text-base text-ink-gray-6">
            <span class="truncate">{{ item.categoryLabel }}</span>
          </ListCell>
          <ListCell v-if="hasColumn('startDate')" class="text-base">
            <span :class="item.startDate && 'text-ink-gray-6'">
              {{ item.startDate ? formatProjectDate(item.startDate) : "—" }}
            </span>
          </ListCell>
          <ListCell class="text-base">
            <span
              :class="
                item.plannedEndDate &&
                (isOverdue(item) ? 'text-ink-red-5' : 'text-ink-gray-6')
              "
            >
              {{
                item.plannedEndDate
                  ? formatProjectDate(item.plannedEndDate)
                  : "—"
              }}
            </span>
          </ListCell>
          <ListCell class="text-base">
            <span :class="item.actualEndDate && 'text-ink-gray-6'">
              {{
                item.actualEndDate ? formatProjectDate(item.actualEndDate) : "—"
              }}
            </span>
          </ListCell>
          <ListCell>
            <TodosCell :item="item" />
          </ListCell>
          <ListCell class="min-w-0 gap-1.5 text-base text-ink-gray-6">
            <Avatar
              size="xs"
              shape="circle"
              :label="item.owner.fullName"
              :image="item.owner.image"
            />
            <span class="truncate">{{ item.owner.fullName }}</span>
          </ListCell>
          <ListCell>
            <AvatarStack :users="item.watchers" />
          </ListCell>
          <ListCell>
            <ItemActions :item="item" />
          </ListCell>
        </ListRow>
      </ListRows>
    </List>
  </div>
</template>

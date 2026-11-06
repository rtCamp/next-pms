<script setup lang="ts">
import { Skeleton } from "frappe-ui";
import { cn } from "@/utils/cn";
import { ROW_COLUMNS } from "./constants";

const ROWS = [
  { columns: 2, height: "h-52" },
  { columns: 2, height: "h-40" },
  { columns: 2, height: "h-40" },
  { columns: 3, height: "h-20" },
  { columns: 1, height: "h-56" },
  { columns: 1, height: "h-56" },
];
</script>

<template>
  <div class="flex flex-col gap-6" aria-busy="true">
    <div class="flex items-center justify-between">
      <Skeleton class="h-7 w-24" />
      <Skeleton class="h-8 w-20" />
    </div>
    <div
      v-for="(row, rowIndex) in ROWS"
      :key="rowIndex"
      :class="cn('grid gap-3', ROW_COLUMNS[row.columns])"
    >
      <Skeleton
        v-for="cell in row.columns"
        :key="cell"
        :class="cn('w-full rounded-7', row.height)"
      />
    </div>
  </div>
</template>

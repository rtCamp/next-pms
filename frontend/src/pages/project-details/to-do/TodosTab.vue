<script setup lang="ts">
import { Button, Spinner } from "frappe-ui";
import { errorMessage } from "@/utils/errors";
import TodoRow from "./TodoRow.vue";
import { useTodos } from "./useTodos";

const {
  todos,
  loading,
  loadError,
  load,
  loadLinkable,
  refresh,
  openCreate,
  canLink,
} = useTodos();
load();
loadLinkable();
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl-semibold leading-tighter text-ink-gray-8">ToDos</h2>
      <Button
        variant="solid"
        icon-left="lucide-plus"
        label="New ToDo"
        @click="openCreate()"
      />
    </div>
    <div
      v-if="loadError"
      role="alert"
      class="flex flex-col items-center justify-center gap-2 py-12 text-center"
    >
      <p class="text-sm font-medium text-ink-gray-7">Couldn't load the ToDos</p>
      <p class="break-words text-sm text-ink-gray-5">
        {{ errorMessage(loadError) }}
      </p>
      <Button
        class="mt-2"
        icon-left="lucide-refresh-cw"
        label="Try again"
        @click="refresh()"
      />
    </div>
    <div v-else-if="loading" class="flex justify-center py-12">
      <Spinner class="size-5" />
    </div>
    <p
      v-else-if="!todos.length"
      class="py-12 text-center text-base text-ink-gray-5"
    >
      No ToDos yet for this project.
    </p>
    <div v-else class="flex flex-col">
      <TodoRow
        v-for="todo in todos"
        :key="todo.name"
        :todo="todo"
        :can-unlink="canLink(todo.linked)"
      />
    </div>
  </div>
</template>

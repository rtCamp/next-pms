<script setup lang="ts">
import { Button } from "frappe-ui";
import { useProjectViews } from "./useProjectViews";

const views = useProjectViews();
</script>

<template>
  <template v-if="views.isDirty">
    <template v-if="views.isSavedView && views.activeView">
      <Button variant="ghost" label="Cancel" @click="views.revertView()" />
      <Button
        variant="subtle"
        label="Save changes"
        @click="views.editView(views.activeView, views.currentLayout)"
      />
    </template>
    <Button
      v-else
      variant="subtle"
      label="Create view"
      @click="views.createView()"
    />
    <div
      aria-hidden="true"
      class="h-7 shrink-0 self-center border-l border-outline-gray-2"
    />
  </template>
</template>

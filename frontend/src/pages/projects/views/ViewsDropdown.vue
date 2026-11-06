<script setup lang="ts">
import { computed, ref } from "vue";
import { Button, Dropdown } from "frappe-ui";
import type { ProjectView } from "./types";
import { useProjectViews } from "./useProjectViews";
import ViewIcon from "./ViewIcon.vue";

const views = useProjectViews();
const menuOpen = ref(false);

/** Runs a saved view's action and closes the views menu it was picked from. */
function closing(action: () => void) {
  return () => {
    menuOpen.value = false;
    action();
  };
}

function viewOption(view: ProjectView) {
  return {
    label: view.label,
    view,
    selected: views.activeView?.name === view.name,
    onClick: () => views.applyView(view),
  };
}

const options = computed(() => [
  {
    group: "Views",
    hideLabel: true,
    options: views.builtInViews.map(viewOption),
  },
  ...(views.savedViews.length > 0
    ? [{ group: "Saved Views", options: views.savedViews.map(viewOption) }]
    : []),
  {
    group: "Actions",
    hideLabel: true,
    options: [
      {
        label: "Create View",
        icon: "lucide-plus",
        onClick: () => views.createView(),
      },
    ],
  },
]);

function savedViewActions(view: ProjectView) {
  const canManage = views.canManageView(view);
  return [
    {
      group: "Actions",
      hideLabel: true,
      options: [
        {
          label: "Duplicate",
          icon: "lucide-copy",
          onClick: closing(() => views.duplicateView(view)),
        },
        ...(canManage
          ? [
              {
                label: "Edit",
                icon: "lucide-pencil",
                onClick: closing(() => views.editView(view)),
              },
              {
                label: view.public ? "Make Private" : "Make Public",
                icon: "lucide-lock",
                onClick: closing(() =>
                  views.updateView({ ...view, public: view.public ? 0 : 1 }),
                ),
              },
            ]
          : []),
      ],
    },
    ...(canManage
      ? [
          {
            group: "Danger",
            hideLabel: true,
            options: [
              {
                label: "Delete",
                icon: "lucide-trash-2",
                theme: "red" as const,
                onClick: closing(() => views.deleteView(view)),
              },
            ],
          },
        ]
      : []),
  ];
}

function isSaved(view?: ProjectView) {
  return Boolean(
    view && views.savedViews.some((saved) => saved.name === view.name),
  );
}
</script>

<template>
  <Dropdown v-model:open="menuOpen" :options="options" align="start">
    <template #default>
      <button
        type="button"
        class="flex min-w-0 items-center gap-1 rounded-4 px-0.5 py-1 text-lg-medium text-ink-gray-9"
        :aria-label="`View: ${views.activeView?.label ?? ''}`"
      >
        <ViewIcon :icon="views.activeView?.icon" />
        <span class="truncate">{{ views.activeView?.label }}</span>
        <span class="lucide-chevron-down size-4 shrink-0" aria-hidden="true" />
      </button>
    </template>
    <template #item-prefix="{ item }">
      <ViewIcon :icon="item.view ? item.view.icon : item.icon" />
    </template>
    <template #item-suffix="{ item }">
      <!-- The action menu's own clicks mustn't also pick the view. -->
      <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -- only stops propagation -->
      <span
        v-if="isSaved(item.view)"
        class="ml-auto"
        @click.stop
        @pointerdown.stop
        @pointerup.stop
        @keydown.stop
      >
        <Dropdown :options="savedViewActions(item.view)" side="right">
          <Button
            variant="ghost"
            size="xs"
            icon="lucide-ellipsis"
            :aria-label="`${item.view.label} actions`"
          />
        </Dropdown>
      </span>
    </template>
  </Dropdown>
</template>

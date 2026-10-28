<script setup lang="ts">
import { computed, ref, type Component } from "vue";
import { Button, dialog } from "frappe-ui";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { useSession } from "@/session";
import { cn } from "@/utils/cn";
import { errorMessage } from "@/utils/errors";
import AddWidgetsDialog from "./AddWidgetsDialog.vue";
import BudgetBurnWidget from "./BudgetBurnWidget.vue";
import {
  CUSTOMIZABLE_WIDGETS,
  CUSTOMIZATION_ROLES,
  ROW_COLUMNS,
} from "./constants";
import CostBurnWidget from "./CostBurnWidget.vue";
import FinancialsWidget from "./FinancialsWidget.vue";
import { TRACKING_HELP } from "./help";
import HoursUsageWidget from "./HoursUsageWidget.vue";
import InvoiceBurnWidget from "./InvoiceBurnWidget.vue";
import ContractsWidget from "./ContractsWidget.vue";
import { applyHiddenWidgets, defaultLayout, hiddenWidgets } from "./layout";
import LifetimeWidget from "./LifetimeWidget.vue";
import RatesWidget from "./RatesWidget.vue";
import TaskCompletionWidget from "./TaskCompletionWidget.vue";
import TrackingSkeleton from "./TrackingSkeleton.vue";
import type { WidgetKey } from "./types";
import { provideTracking } from "./useTracking";
import { useTrackingLayout } from "./useTrackingLayout";
import WidgetShell from "./WidgetShell.vue";

interface WidgetEntry {
  component: Component;
  props?: Record<string, unknown>;
}

const WIDGETS: Record<WidgetKey, WidgetEntry> = {
  financials: { component: FinancialsWidget },
  task_completion: { component: TaskCompletionWidget },
  hours_usage: { component: HoursUsageWidget },
  invoice_burn: { component: InvoiceBurnWidget },
  budget_burn: { component: BudgetBurnWidget },
  cost_burn: { component: CostBurnWidget },
  lifetime_to_date: {
    component: LifetimeWidget,
    props: {
      title: "Lifetime value to date",
      field: "lifetime_value_to_date",
      help: TRACKING_HELP.lifetimeToDate,
    },
  },
  lifetime_expected: {
    component: LifetimeWidget,
    props: {
      title: "Expected lifetime value",
      field: "expected_lifetime_value",
      help: TRACKING_HELP.lifetimeExpected,
    },
  },
  contracts: { component: ContractsWidget },
  rates: { component: RatesWidget },
  lifetime_vs_billed: {
    component: LifetimeWidget,
    props: {
      title: "Lifetime value vs billed amount",
      field: "lifetime_value_vs_billed_amount",
    },
  },
};

const { projectId } = useProjectDetails();
const session = useSession();
const tracking = provideTracking();
const trackingLayout = useTrackingLayout(projectId);

const editing = ref(false);
const addOpen = ref(false);

const canCustomize = computed(() => session.hasAnyRole(CUSTOMIZATION_ROLES));
const baseLayout = computed(() =>
  defaultLayout(tracking.tracking.value?.billing_type ?? ""),
);
const hidden = computed(() =>
  trackingLayout.storedLayout.value
    ? hiddenWidgets(baseLayout.value, trackingLayout.storedLayout.value)
    : [],
);
const layout = computed(() =>
  applyHiddenWidgets(baseLayout.value, hidden.value),
);

function customizable(key: WidgetKey) {
  return CUSTOMIZABLE_WIDGETS.find((widget) => widget.key === key);
}

function remove(key: WidgetKey, label: string) {
  dialog.danger({
    title: "Remove widget",
    message: `Remove "${label}" from this project's tracking page? Everyone on the project sees this change.`,
    confirmLabel: "Remove",
    onConfirm: async () => {
      await trackingLayout.save(
        applyHiddenWidgets(baseLayout.value, [...hidden.value, key]),
      );
    },
  });
}

async function saveHidden(next: WidgetKey[]) {
  const saved = await trackingLayout.save(
    applyHiddenWidgets(baseLayout.value, next),
  );
  if (saved) addOpen.value = false;
}
</script>

<template>
  <TrackingSkeleton
    v-if="tracking.loading.value || trackingLayout.loading.value"
  />
  <div
    v-else-if="tracking.error.value && !tracking.tracking.value"
    role="alert"
    class="flex flex-col items-center justify-center gap-2 py-16 text-center"
  >
    <p class="text-sm font-medium text-ink-gray-7">Something went wrong</p>
    <p class="break-words text-sm text-ink-gray-5">
      {{ errorMessage(tracking.error.value) }}
    </p>
    <Button
      class="mt-2"
      icon-left="lucide-refresh-cw"
      label="Try again"
      @click="tracking.reload()"
    />
  </div>
  <div v-else class="flex flex-col gap-6">
    <div class="flex items-center justify-between gap-2">
      <h2 class="text-2xl-semibold leading-tighter text-ink-gray-8">
        Tracking
      </h2>
      <div v-if="canCustomize" class="flex items-center gap-2">
        <Button
          v-if="editing"
          variant="ghost"
          label="Add widgets"
          :disabled="trackingLayout.saving.value"
          @click="addOpen = true"
        />
        <Button
          :variant="editing ? 'subtle' : 'solid'"
          :icon-left="editing ? undefined : 'lucide-pencil'"
          :label="editing ? 'Done' : 'Edit'"
          :disabled="trackingLayout.saving.value"
          @click="editing = !editing"
        />
      </div>
    </div>

    <div
      v-for="row in layout"
      :key="row.join('|')"
      :class="cn('grid gap-3', ROW_COLUMNS[row.length])"
    >
      <template v-for="key in row" :key="key">
        <WidgetShell
          v-if="editing && customizable(key)"
          :label="customizable(key)!.label"
          @remove="remove(key, customizable(key)!.label)"
        >
          <component
            :is="WIDGETS[key].component"
            v-bind="WIDGETS[key].props"
            :layout="row.length === 1 ? 'row' : 'stacked'"
          />
        </WidgetShell>
        <component
          :is="WIDGETS[key].component"
          v-else
          v-bind="WIDGETS[key].props"
          :layout="row.length === 1 ? 'row' : 'stacked'"
        />
      </template>
    </div>

    <AddWidgetsDialog
      v-model:open="addOpen"
      :hidden="hidden"
      :saving="trackingLayout.saving.value"
      @save="saveHidden"
    />
  </div>
</template>

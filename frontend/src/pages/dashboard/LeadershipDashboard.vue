<script setup lang="ts">
import { computed } from "vue";
import { useSession } from "@/session";
import { useSavedState } from "@/composables/useSavedState";
import { KPI_MONTH_KEY } from "./constants";
import CalendarTimelineCard from "./calendar/CalendarTimelineCard.vue";
import DashboardHeader from "./DashboardHeader.vue";
import ForecastCard from "./forecast/ForecastCard.vue";
import { useDashboardCall } from "./dashboardCall";
import { firstName } from "./greeting";
import HeatmapCard from "./heatmap/HeatmapCard.vue";
import NotificationsCard from "./notifications/NotificationsCard.vue";
import KpiCard from "./kpi-cards/KpiCard.vue";
import {
  defaultKpiMonth,
  kpiParams,
  type KpiKey,
  type LeadershipKpis,
} from "./kpi-cards/kpi";
import LeadershipStatCards from "./stat-cards/LeadershipStatCards.vue";
import UtilisationCard from "./utilisation/UtilisationCard.vue";
import WidgetCard from "./WidgetCard.vue";

defineOptions({ inheritAttrs: false });

const session = useSession();
const greetingName = computed(() =>
  firstName(session.employeeName, session.userName),
);

const KPI_KEYS: KpiKey[] = ["revenue", "cost", "profit_margin"];
const kpiMonth = useSavedState(KPI_MONTH_KEY, defaultKpiMonth);
const kpis = useDashboardCall<LeadershipKpis>("get_leadership_kpis", () =>
  kpiParams(kpiMonth.value),
);
</script>

<template>
  <DashboardHeader title="Leadership" />
  <div class="mx-auto w-full max-w-[1200px] space-y-6 p-5">
    <h2 class="text-2xl-semibold text-ink-gray-8">Hey, {{ greetingName }}</h2>
    <section aria-label="Leadership dashboard" class="grid grid-cols-12 gap-3">
      <WidgetCard v-for="key in KPI_KEYS" :key="key" class="col-span-4">
        <KpiCard
          v-model:month="kpiMonth"
          :kpi-key="key"
          :metric="kpis.data?.[key]"
          :loading="kpis.loading"
        />
      </WidgetCard>
      <WidgetCard class="col-span-8 h-75 p-4">
        <HeatmapCard />
      </WidgetCard>
      <WidgetCard class="col-span-4 h-75 p-4">
        <NotificationsCard />
      </WidgetCard>
      <div class="col-span-12">
        <LeadershipStatCards />
      </div>
      <WidgetCard class="col-span-6 gap-4 p-4">
        <UtilisationCard />
      </WidgetCard>
      <WidgetCard class="col-span-6 h-full gap-4 p-4">
        <ForecastCard />
      </WidgetCard>
      <WidgetCard class="col-span-12 gap-3 p-0">
        <CalendarTimelineCard />
      </WidgetCard>
    </section>
  </div>
</template>

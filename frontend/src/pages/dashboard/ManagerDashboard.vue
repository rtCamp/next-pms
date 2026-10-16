<script setup lang="ts">
import { computed } from "vue";
import { useSession } from "@/session";
import CalendarTimelineCard from "./calendar/CalendarTimelineCard.vue";
import DashboardHeader from "./DashboardHeader.vue";
import { firstName } from "./greeting";
import HeatmapCard from "./heatmap/HeatmapCard.vue";
import NotificationsCard from "./notifications/NotificationsCard.vue";
import ManagerStatCards from "./stat-cards/ManagerStatCards.vue";
import WidgetCard from "./WidgetCard.vue";

defineOptions({ inheritAttrs: false });

const session = useSession();
const greetingName = computed(() =>
  firstName(session.employeeName, session.userName),
);
</script>

<template>
  <!-- React labels this page "Management" in the breadcrumb. -->
  <DashboardHeader title="Management" />
  <div class="mx-auto flex w-full max-w-[1200px] flex-col gap-6 p-5">
    <h2 class="text-xl-semibold text-ink-gray-8">Hey, {{ greetingName }}</h2>
    <section aria-label="Manager dashboard" class="grid grid-cols-12 gap-3">
      <div class="col-span-12">
        <ManagerStatCards />
      </div>
      <WidgetCard class="col-span-8 h-75 overflow-y-auto">
        <HeatmapCard />
      </WidgetCard>
      <WidgetCard class="col-span-4 h-75 overflow-y-auto">
        <NotificationsCard />
      </WidgetCard>
      <WidgetCard class="col-span-12">
        <CalendarTimelineCard />
      </WidgetCard>
    </section>
  </div>
</template>

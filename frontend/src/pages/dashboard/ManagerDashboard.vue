<script setup lang="ts">
import { computed } from "vue";
import { useSession } from "@/session";
import DashboardHeader from "./DashboardHeader.vue";
import { firstName } from "./greeting";

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
    <section
      aria-label="Manager dashboard"
      class="grid grid-cols-12 gap-3"
    ></section>
  </div>
</template>

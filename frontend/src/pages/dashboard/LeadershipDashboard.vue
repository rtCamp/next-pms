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
  <DashboardHeader title="Leadership" />
  <div class="mx-auto w-full max-w-[1200px] space-y-6 p-5">
    <h2 class="text-2xl-semibold text-ink-gray-8">Hey, {{ greetingName }}</h2>
    <section
      aria-label="Leadership dashboard"
      class="grid grid-cols-12 gap-3"
    ></section>
  </div>
</template>

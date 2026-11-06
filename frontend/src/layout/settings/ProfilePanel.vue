<script setup lang="ts">
import { computed } from "vue";
import { Avatar, Button } from "frappe-ui";
import { useSession } from "@/session";

const session = useSession();
const displayName = computed(
  () => session.employeeName || session.userName || session.userId,
);
</script>

<template>
  <div>
    <div class="flex items-center gap-4 pb-8 pt-1.5">
      <Avatar
        :label="displayName"
        :image="session.userImage || undefined"
        size="3xl"
      />
      <div class="min-w-0">
        <p class="truncate text-lg-semibold text-ink-gray-8">
          {{ displayName }}
        </p>
        <p class="truncate text-base text-ink-gray-6">{{ session.userId }}</p>
      </div>
    </div>
    <section>
      <h3 class="text-lg-semibold text-ink-gray-8">
        Account Info and Security
      </h3>
      <div class="mt-5 flex items-center justify-between gap-4">
        <div>
          <p class="text-base-medium text-ink-gray-8">Password</p>
          <p class="mt-1 text-base text-ink-gray-6">
            Change your account password for security.
          </p>
        </div>
        <Button
          variant="subtle"
          label="Change Password"
          href="/update-password"
        />
      </div>
    </section>
  </div>
</template>

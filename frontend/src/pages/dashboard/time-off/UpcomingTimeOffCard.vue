<script setup lang="ts">
import { computed, ref } from "vue";
import {
  Avatar,
  Badge,
  Button,
  Skeleton,
  Tooltip,
  toast,
  useCall,
} from "frappe-ui";
import { useDashboardCall } from "@/pages/dashboard/dashboardCall";
import { LEAVE_APPROVAL_TOOLTIP } from "@/pages/dashboard/help";
import { errorMessage } from "@/utils/errors";
import ApproveLeaveDialog from "./ApproveLeaveDialog.vue";
import {
  awaitsApproval,
  canApprove,
  leaveWindow,
  openLeavesFirst,
  type EmployeeOnLeave,
} from "./leaves";
import RejectLeaveDialog from "./RejectLeaveDialog.vue";

defineOptions({ inheritAttrs: false });

const leavesCall = useDashboardCall<EmployeeOnLeave[]>(
  "get_employees_on_leave",
);
const approveCall = useCall<unknown, { name: string }>({
  url: "/api/v2/method/next_pms.api.dashboard.approve_leave_application",
  method: "POST",
  immediate: false,
});
const rejectCall = useCall<unknown, { name: string; reason: string }>({
  url: "/api/v2/method/next_pms.api.dashboard.reject_leave_application",
  method: "POST",
  immediate: false,
});

const leaves = computed(() => openLeavesFirst(leavesCall.data ?? []));
const pendingCount = computed(() => leaves.value.filter(awaitsApproval).length);

const approving = ref<EmployeeOnLeave | null>(null);
const rejecting = ref<EmployeeOnLeave | null>(null);

async function settle(
  request: () => Promise<unknown>,
  message: string,
): Promise<boolean> {
  try {
    await request();
  } catch (error) {
    toast.error(errorMessage(error));
    return false;
  }
  toast.success(message);
  await leavesCall.reload();
  return true;
}

function approve(leaveId: string) {
  return settle(
    () => approveCall.submit({ name: leaveId }),
    "Leave application approved",
  );
}

function reject(leaveId: string, reason: string) {
  return settle(
    () => rejectCall.submit({ name: leaveId, reason }),
    "Leave application rejected",
  );
}
</script>

<template>
  <div v-if="leavesCall.loading && !leavesCall.data" aria-busy="true">
    <div class="flex items-center gap-2">
      <Skeleton class="h-6 w-40" />
      <Skeleton class="h-6 w-20 rounded-full" />
    </div>
    <div
      v-for="row in 4"
      :key="row"
      class="flex items-center gap-3 border-b border-outline-gray-1 px-3 py-2.5 last:border-b-0"
    >
      <Skeleton class="size-8 shrink-0 rounded-full" />
      <div class="flex flex-1 flex-col gap-1">
        <Skeleton class="h-4 w-32" />
        <Skeleton class="h-3 w-40" />
      </div>
      <Skeleton class="h-6 w-16 rounded-full" />
    </div>
  </div>
  <template v-else>
    <div class="flex items-center gap-2">
      <h3 class="text-lg-semibold text-ink-gray-8">Upcoming time-offs</h3>
      <Badge
        v-if="pendingCount > 0"
        theme="amber"
        size="lg"
        :label="`${pendingCount} pending`"
      />
    </div>
    <p v-if="!leaves.length" class="py-8 text-center text-base text-ink-gray-5">
      No upcoming time-offs.
    </p>
    <ul v-else class="flex flex-col">
      <li
        v-for="leave in leaves"
        :key="leave.name"
        class="flex items-center gap-3 border-b border-l-4 border-b-outline-gray-1 px-3 py-2.5 last:border-b-0"
        :class="
          leave.status === 'Open'
            ? 'border-l-outline-amber-3 bg-surface-amber-1'
            : 'border-l-transparent'
        "
      >
        <Avatar
          size="md"
          shape="circle"
          :image="leave.user_image ?? undefined"
          :label="leave.employee_name"
        />
        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <span class="truncate text-base-medium text-ink-gray-8">
            {{ leave.employee_name }}
          </span>
          <span class="text-sm text-ink-gray-6">{{ leaveWindow(leave) }}</span>
        </div>
        <div class="flex shrink-0 flex-col items-end gap-1.5">
          <Badge
            :theme="leave.status === 'Open' ? 'amber' : 'green'"
            size="lg"
            :label="leave.status"
          />
          <Tooltip
            v-if="leave.status === 'Open'"
            :text="LEAVE_APPROVAL_TOOLTIP"
            :disabled="canApprove(leave)"
          >
            <div class="flex gap-1.5">
              <Button
                variant="solid"
                theme="green"
                icon="lucide-check"
                :label="`Approve leave of ${leave.employee_name}`"
                :disabled="!canApprove(leave)"
                @click="approving = leave"
              />
              <Button
                variant="solid"
                theme="red"
                icon="lucide-x"
                :label="`Reject leave of ${leave.employee_name}`"
                :disabled="!canApprove(leave)"
                @click="rejecting = leave"
              />
            </div>
          </Tooltip>
        </div>
      </li>
    </ul>
  </template>
  <ApproveLeaveDialog
    :leave="approving"
    :approve="approve"
    @close="approving = null"
  />
  <RejectLeaveDialog
    :leave="rejecting"
    :reject="reject"
    @close="rejecting = null"
  />
</template>

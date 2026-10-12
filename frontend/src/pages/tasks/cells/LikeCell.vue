<script setup lang="ts">
import { computed } from "vue";
import { Tooltip } from "frappe-ui";
import { FilledStarIcon } from "@/icons";
import { isLikedBy, useToggleLike } from "@/composables/useToggleLike";
import { useSession } from "@/session";

const props = defineProps<{ name: string; likedBy: string | null }>();
const emit = defineEmits<{ toggled: [] }>();

const session = useSession();
const like = useToggleLike({
  doctype: "Task",
  name: () => props.name,
  liked: () => isLikedBy(props.likedBy, session.userId),
  onToggled: () => emit("toggled"),
});
const label = computed(() => (like.liked ? "Unstar task" : "Star task"));
</script>

<template>
  <Tooltip :text="label">
    <button
      type="button"
      class="inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded disabled:cursor-not-allowed"
      :aria-label="label"
      :aria-pressed="like.liked"
      :disabled="like.isToggling"
      @click="like.toggle()"
    >
      <FilledStarIcon
        v-if="like.liked"
        class="size-4 text-ink-amber-2"
        aria-hidden="true"
      />
      <span
        v-else
        class="lucide-star size-4 text-ink-gray-4"
        aria-hidden="true"
      />
    </button>
  </Tooltip>
</template>

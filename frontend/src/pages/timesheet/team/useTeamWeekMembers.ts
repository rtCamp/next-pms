import {
  computed,
  reactive,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from "vue";
import { toast, useCall } from "frappe-ui";
import { errorMessage } from "@/utils/errors";
import { TEAM_MEMBER_PAGE_LENGTH } from "@/pages/timesheet/constants";
import type { TeamFilterArgs, TeamMember, TeamMembersPayload } from "./types";

type MembersParams = TeamFilterArgs & {
  start_date: string;
  page_length: number;
  start: number;
};

interface UseTeamWeekMembersOptions {
  /** Any day of the week, normally its first. */
  startDate: string;
  filterArgs: TeamFilterArgs;
  /** Members load once this is true, i.e. once the week is opened. */
  enabled: MaybeRefOrGetter<boolean>;
}

/** One team week's members, 20 a page, loaded when the week first opens. */
export function useTeamWeekMembers(options: UseTeamWeekMembersOptions) {
  const call = useCall<TeamMembersPayload, MembersParams>({
    url: "/api/v2/method/next_pms.timesheet.api.team.get_team_timesheet_data",
    immediate: false,
  });

  const pages = ref<TeamMembersPayload[]>([]);
  const loading = ref(false);
  // Set after a failed request so a still-visible sentinel can't retry it in a loop.
  const failed = ref(false);

  const members = computed(() => pages.value.flatMap((page) => page.members));
  const hasMore = computed(
    () => !failed.value && Boolean(pages.value.at(-1)?.has_more),
  );

  async function fetchPage(index: number) {
    loading.value = true;
    try {
      const page = await call.submit({
        ...options.filterArgs,
        start_date: options.startDate,
        page_length: TEAM_MEMBER_PAGE_LENGTH,
        start: index * TEAM_MEMBER_PAGE_LENGTH,
      });
      failed.value = false;
      if (page) pages.value = [...pages.value, page];
    } catch (error) {
      failed.value = true;
      toast.error(errorMessage(error));
    } finally {
      loading.value = false;
    }
  }

  watch(
    () => toValue(options.enabled),
    (enabled) => {
      if (enabled && pages.value.length === 0 && !loading.value) fetchPage(0);
    },
    { immediate: true },
  );

  function loadMore() {
    if (loading.value || !hasMore.value) return;
    fetchPage(pages.value.length);
  }

  function refreshMember(member: TeamMember) {
    pages.value = pages.value.map((page) =>
      page.members.some((current) => current.employee === member.employee)
        ? {
            ...page,
            members: page.members.map((current) =>
              current.employee === member.employee ? member : current,
            ),
          }
        : page,
    );
  }

  return reactive({ members, hasMore, loading, loadMore, refreshMember });
}

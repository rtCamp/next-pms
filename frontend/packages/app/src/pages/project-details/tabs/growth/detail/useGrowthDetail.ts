/**
 * External dependencies.
 */
import { useMemo } from "react";
import { useFrappeGetDoc, useFrappeGetDocList } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { hashString } from "@/lib/utils";
import type { Follower, UserDetails } from "../../risks/types";
import { GROWTH_DOCTYPE } from "../constants";
import type { ApiGrowthDetail, GrowthDetail } from "../types";

export function useGrowthDetail(growthId: string) {
  const { data, isLoading, error } = useFrappeGetDoc<ApiGrowthDetail>(
    GROWTH_DOCTYPE,
    growthId,
  );

  const userEmails = useMemo(
    () =>
      [
        ...new Set(
          [data?.activity_owner, data?.ideation_owner].filter(Boolean),
        ),
      ] as string[],
    [data?.activity_owner, data?.ideation_owner],
  );

  const usersSwrKey = useMemo(() => {
    if (!userEmails.length) return null;
    return `growth-detail-users-${hashString(userEmails.slice().sort().join(","))}`;
  }, [userEmails]);

  const { data: usersData } = useFrappeGetDocList<UserDetails>(
    "User",
    {
      fields: ["name", "full_name", "user_image"],
      filters: [["name", "in", userEmails]],
      limit: userEmails.length || 1,
    },
    usersSwrKey,
  );

  const { data: followersData, mutate: mutateFollowers } =
    useFrappeGetDocList<Follower>("Document Follow", {
      fields: [
        "user",
        "user.full_name as full_name",
        "user.user_image as user_image",
      ] as never,
      filters: [
        ["ref_doctype", "=", GROWTH_DOCTYPE],
        ["ref_docname", "=", growthId],
      ],
      limit: 50,
    });

  const growth = useMemo((): GrowthDetail | undefined => {
    if (!data) return undefined;
    const findUser = (email: string | null) =>
      (email && usersData?.find((u) => u.name === email)) || null;
    return {
      ...data,
      activity_owner_details: findUser(data.activity_owner),
      ideation_owner_details: findUser(data.ideation_owner),
    };
  }, [data, usersData]);

  return {
    growth,
    isLoading,
    error,
    followers: followersData ?? [],
    mutateFollowers,
  };
}

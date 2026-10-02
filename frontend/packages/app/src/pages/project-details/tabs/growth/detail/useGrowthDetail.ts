/**
 * External dependencies.
 */
import { useMemo } from "react";
import { useFrappeGetDoc, useFrappeGetDocList } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useUserDetails } from "@/hooks/useUserDetails";
import type { FileAttachment, Follower } from "@/pages/project-details/types";
import { GROWTH_DOCTYPE } from "../constants";
import type { ApiGrowthDetail, GrowthDetail } from "../types";

export function useGrowthDetail(growthId: string) {
  const { data, isLoading, error } = useFrappeGetDoc<ApiGrowthDetail>(
    GROWTH_DOCTYPE,
    growthId,
  );

  const { data: attachments, mutate: mutateAttachments } =
    useFrappeGetDocList<FileAttachment>("File", {
      fields: ["name", "file_name", "file_url", "file_size"],
      filters: [
        ["attached_to_doctype", "=", GROWTH_DOCTYPE],
        ["attached_to_name", "=", growthId],
      ],
      limit: 50,
    });

  const { data: followersData, mutate: mutateFollowers } = useFrappeGetDocList<
    Pick<Follower, "user">
  >("Document Follow", {
    fields: ["user"],
    filters: [
      ["ref_doctype", "=", GROWTH_DOCTYPE],
      ["ref_docname", "=", growthId],
    ],
    limit: 50,
  });

  const userEmails = useMemo(
    () =>
      [
        data?.activity_owner,
        data?.ideation_owner,
        ...(followersData ?? []).map((f) => f.user),
      ].filter(Boolean) as string[],
    [data?.activity_owner, data?.ideation_owner, followersData],
  );

  const { data: usersData } = useUserDetails(userEmails);

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

  const followers = useMemo<Follower[]>(
    () =>
      (followersData ?? []).map(({ user }) => {
        const details = usersData?.find((u) => u.name === user);
        return {
          user,
          full_name: details?.full_name ?? null,
          user_image: details?.user_image ?? null,
        };
      }),
    [followersData, usersData],
  );

  return {
    growth,
    isLoading,
    error,
    attachments: attachments ?? [],
    followers,
    mutateAttachments,
    mutateFollowers,
  };
}

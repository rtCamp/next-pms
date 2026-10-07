/**
 * External dependencies.
 */
import { useCallback, useMemo } from "react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import {
  FrappeError,
  useFrappeGetDoc,
  useFrappeGetDocList,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useUserDetails } from "@/hooks/useUserDetails";
import { parseFrappeErrorMsg } from "@/lib/utils";
import type { FileAttachment, Follower } from "@/pages/project-details/types";
import { toUpdateLogRows } from "../add-update/payload";
import { GROWTH_DOCTYPE } from "../constants";
import type {
  ApiGrowthDetail,
  GrowthDetail,
  GrowthUpdateEntry,
} from "../types";

export function useGrowthDetail(growthId: string) {
  const { data, isLoading, error, mutate } = useFrappeGetDoc<ApiGrowthDetail>(
    GROWTH_DOCTYPE,
    growthId,
  );
  const { updateDoc } = useFrappeUpdateDoc();
  const toast = useToasts();

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
        ...(data?.update_log ?? []).map((entry) => entry.updated_by),
        ...(followersData ?? []).map((f) => f.user),
      ].filter(Boolean) as string[],
    [
      data?.activity_owner,
      data?.ideation_owner,
      data?.update_log,
      followersData,
    ],
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
      update_log: (data.update_log ?? []).map((entry) => ({
        ...entry,
        updated_by_details: findUser(entry.updated_by),
      })),
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

  const deleteUpdateEntry = useCallback(
    async (entry: GrowthUpdateEntry) => {
      if (!data) return;
      try {
        await updateDoc(GROWTH_DOCTYPE, data.name, {
          modified: data.modified,
          update_log: toUpdateLogRows(
            (data.update_log ?? []).filter((e) => e.name !== entry.name),
          ),
        });
        toast.success("Update deleted");
        await mutate();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
    [data, updateDoc, toast, mutate],
  );

  return {
    growth,
    isLoading,
    error,
    attachments: attachments ?? [],
    followers,
    mutate,
    mutateAttachments,
    mutateFollowers,
    deleteUpdateEntry,
  };
}

/**
 * External dependencies.
 */
import { useMemo } from "react";
import { useFrappeGetDoc, useFrappeGetDocList } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import type {
  ApiRiskDetail,
  EnrichedRiskUpdateEntry,
  FileAttachment,
  Follower,
  RiskDetail,
  UserDetails,
} from "../types";

export function useRiskDetail(riskId: string) {
  const {
    data: risk,
    isLoading,
    error,
    mutate,
  } = useFrappeGetDoc<ApiRiskDetail>("Risk", riskId);

  const userEmails = useMemo(() => {
    if (!risk) return [];
    const emails = [
      risk.owner,
      ...(risk.risk_update_log?.map((e) => e.owner) ?? []),
    ].filter(Boolean) as string[];
    return [...new Set(emails)];
  }, [risk]);

  const { data: usersData } = useFrappeGetDocList<UserDetails>("User", {
    fields: ["name", "full_name", "user_image"],
    filters: userEmails.length
      ? ([["name", "in", userEmails]] as never)
      : ([] as never),
    limit: userEmails.length || 1,
  });

  const { data: attachments } = useFrappeGetDocList<FileAttachment>("File", {
    fields: ["name", "file_name", "file_url", "file_size"],
    filters: [
      ["attached_to_doctype", "=", "Risk"],
      ["attached_to_name", "=", riskId],
    ] as never,
    limit: 50,
  });

  const { data: followersData } = useFrappeGetDocList<{
    user: string;
    full_name: string | null;
    user_image: string | null;
  }>("Document Follow", {
    fields: [
      "user",
      "user.full_name as full_name",
      "user.user_image as user_image",
    ] as never,
    filters: [
      ["ref_doctype", "=", "Risk"],
      ["ref_docname", "=", riskId],
    ] as never,
    limit: 50,
  });

  const enrichedRisk = useMemo((): RiskDetail | undefined => {
    if (!risk) return undefined;
    const usersMap: Record<string, UserDetails> = {};
    usersData?.forEach((u) => {
      usersMap[u.name] = u;
    });
    const enrichedLog: EnrichedRiskUpdateEntry[] = (risk.risk_update_log ?? [])
      .map((entry) => ({
        ...entry,
        owner_details: usersMap[entry.owner] ?? null,
      }))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    return {
      ...risk,
      owner_details: usersMap[risk.owner] ?? null,
      risk_update_log: enrichedLog,
    };
  }, [risk, usersData]);

  const followers: Follower[] = useMemo(
    () => followersData ?? [],
    [followersData],
  );

  return {
    risk: enrichedRisk,
    attachments: attachments ?? [],
    followers,
    isLoading,
    error,
    mutate,
  };
}

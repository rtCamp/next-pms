/**
 * External dependencies.
 */
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useProjectDetail } from "@/pages/project-details/context";
import type { Email } from "./types";

interface ApiCommunication {
  name: string;
  communication_medium: string | null;
  communication_date: string | null;
  creation: string | null;
  subject: string | null;
  content: string | null;
  sender: string | null;
  sender_full_name: string | null;
  recipients: string | null;
  cc: string | null;
  bcc: string | null;
  attachments: string | null;
  read_by_recipient: 0 | 1;
  delivery_status: string | null;
}

interface EmailApiResponse {
  docinfo: {
    communications: ApiCommunication[];
  };
  message: unknown;
}

function parseAddressList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseAttachments(raw: string | null): unknown[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapEmail(raw: ApiCommunication): Email {
  return {
    id: raw.name,
    sender: {
      name: raw.sender_full_name ?? raw.sender ?? "",
      email: raw.sender ?? "",
    },
    subject: raw.subject ?? "",
    to: parseAddressList(raw.recipients),
    cc: parseAddressList(raw.cc),
    bcc: parseAddressList(raw.bcc),
    body: raw.content ?? "",
    sentAt: raw.communication_date ?? raw.creation ?? "",
    status: raw.delivery_status ?? "unknown",
    attachments: parseAttachments(raw.attachments),
  };
}

export function useProjectEmails() {
  const projectId = useProjectDetail((s) => s.projectId);

  const { data, isLoading, error, mutate } = useFrappeGetCall<EmailApiResponse>(
    "next_pms.next_projects.api.email.get_project_emails",
    { project: projectId },
    projectId ? undefined : null,
    { revalidateOnFocus: false },
  );

  const emails = (data?.docinfo?.communications ?? [])
    .filter((c) => c.communication_medium === "Email")
    .map(mapEmail);

  return { emails, isLoading, error, mutate };
}

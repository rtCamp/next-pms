/**
 * External dependencies.
 */
import { useEffect } from "react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { type FrappeError, useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useProjectDetail } from "@/pages/project-details/context";
import type { Attachment, Email } from "./types";

interface ApiCommunication {
  name: string;
  communication_date: string | null;
  creation: string | null;
  subject: string | null;
  content: string | null;
  sender: string | null;
  sender_full_name: string | null;
  recipients: string | null;
  cc: string | null;
  bcc: string | null;
  attachments: Attachment[] | null;
  read_by_recipient: 0 | 1;
  delivery_status: string | null;
}

interface EmailApiResponse {
  message: ApiCommunication[];
}

function parseAddressList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
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
    attachments: raw.attachments ?? [],
  };
}

export function useProjectEmails() {
  const toast = useToasts();
  const projectId = useProjectDetail((s) => s.projectId);

  const { data, isLoading, error, mutate } = useFrappeGetCall<EmailApiResponse>(
    "next_pms.next_projects.api.email.get_project_emails",
    { project: projectId },
    projectId ? undefined : null,
    { revalidateOnFocus: false },
  );

  useEffect(() => {
    if (error) {
      toast.error(parseFrappeErrorMsg(error as FrappeError));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const emails = (data?.message ?? []).map(mapEmail);

  return { emails, isLoading, error, mutate };
}

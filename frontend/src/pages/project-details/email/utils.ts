import { dayjs } from "frappe-ui";
import type { ApiCommunication, Email } from "./types";

function parseAddressList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
}

export function toEmail(raw: ApiCommunication): Email {
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

/** The emails, newest first. */
export function toSortedEmails(rows: ApiCommunication[]): Email[] {
  return rows
    .map(toEmail)
    .sort((a, b) => dayjs(b.sentAt).valueOf() - dayjs(a.sentAt).valueOf());
}

/** The time for today's emails, else the date, with the year when it isn't this year. */
export function formatEmailDate(
  sentAt: string,
  now: Date = new Date(),
): string {
  const date = dayjs(sentAt);
  const today = dayjs(now);
  if (date.isSame(today, "day")) return date.format("h:mm A");
  if (date.isSame(today, "year")) return date.format("MMM D");
  return date.format("MMM D, YYYY");
}

/** The file name at the end of a file URL. */
export function attachmentName(fileUrl: string): string {
  return fileUrl.split("/").pop() || fileUrl;
}

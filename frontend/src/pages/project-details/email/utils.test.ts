import { describe, expect, it } from "vitest";
import type { ApiCommunication } from "./types";
import {
  attachmentName,
  formatEmailDate,
  toEmail,
  toSortedEmails,
} from "./utils";

const row = (overrides: Partial<ApiCommunication>): ApiCommunication => ({
  name: "COMM-1",
  communication_date: "2026-10-10 09:00:00",
  creation: "2026-10-10 08:00:00",
  subject: "Hello",
  content: "<p>Hi</p>",
  sender: "a@example.com",
  sender_full_name: "Ann",
  recipients: "b@example.com, c@example.com,",
  cc: null,
  bcc: "",
  attachments: null,
  read_by_recipient: 0,
  delivery_status: "Sent",
  ...overrides,
});

describe("toEmail", () => {
  it("maps a communication", () => {
    expect(toEmail(row({}))).toEqual({
      id: "COMM-1",
      sender: { name: "Ann", email: "a@example.com" },
      subject: "Hello",
      to: ["b@example.com", "c@example.com"],
      cc: [],
      bcc: [],
      body: "<p>Hi</p>",
      sentAt: "2026-10-10 09:00:00",
      status: "Sent",
      attachments: [],
    });
  });

  it("falls back for missing values", () => {
    const email = toEmail(
      row({
        sender_full_name: null,
        communication_date: null,
        delivery_status: null,
        subject: null,
      }),
    );
    expect(email.sender.name).toBe("a@example.com");
    expect(email.sentAt).toBe("2026-10-10 08:00:00");
    expect(email.status).toBe("unknown");
    expect(email.subject).toBe("");
  });
});

describe("toSortedEmails", () => {
  it("puts the newest first", () => {
    const sorted = toSortedEmails([
      row({ name: "old", communication_date: "2026-01-01 10:00:00" }),
      row({ name: "new", communication_date: "2026-03-01 10:00:00" }),
      row({ name: "mid", communication_date: "2026-02-01 10:00:00" }),
    ]);
    expect(sorted.map((email) => email.id)).toEqual(["new", "mid", "old"]);
  });
});

describe("formatEmailDate", () => {
  const now = new Date(2026, 9, 19, 15, 0);

  it("shows the time for today", () => {
    expect(formatEmailDate("2026-10-19 09:05:00", now)).toBe("9:05 AM");
  });

  it("shows the date this year, and the year before that", () => {
    expect(formatEmailDate("2026-03-02 09:05:00", now)).toBe("Mar 2");
    expect(formatEmailDate("2025-03-02 09:05:00", now)).toBe("Mar 2, 2025");
  });
});

describe("attachmentName", () => {
  it("returns the last path segment", () => {
    expect(attachmentName("/private/files/report.pdf")).toBe("report.pdf");
    expect(attachmentName("report.pdf")).toBe("report.pdf");
  });
});

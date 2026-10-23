import type { CommentMention, CommentNode } from "./types";

export const VIEWER = "jane@example.com";

export const PEOPLE: CommentMention[] = [
  { label: "Jane Doe", value: "jane@example.com" },
  { label: "Arjun Mehta", value: "arjun@example.com" },
  { label: "Priya Shah", value: "priya@example.com" },
];

export const THREAD: CommentNode[] = [
  {
    id: "c1",
    authorId: "arjun@example.com",
    authorName: "Arjun Mehta",
    content:
      "<p>Budget burn is ahead of plan this sprint. Can we review the remaining scope?</p>",
    createdAt: "2026-10-13T09:00:00.000Z",
    replies: [
      {
        id: "c2",
        authorId: VIEWER,
        authorName: "Jane Doe",
        content:
          '<p>Agreed. <span class="mention" data-type="mention" data-id="priya@example.com" data-label="Priya Shah">@Priya Shah</span> can you share the estimate?</p>',
        createdAt: "2026-10-14T06:00:00.000Z",
        edited: true,
        replies: [
          {
            id: "c3",
            authorId: "priya@example.com",
            authorName: "Priya Shah",
            content: "<p>Will do by tomorrow.</p>",
            createdAt: "2026-10-14T10:20:00.000Z",
            replies: [],
          },
        ],
      },
    ],
  },
  {
    id: "c4",
    authorId: VIEWER,
    authorName: "Jane Doe",
    content: "<p>Client confirmed the new <strong>launch date</strong>.</p>",
    createdAt: "2026-10-14T10:57:00.000Z",
    replies: [],
  },
  {
    id: "c5",
    authorId: "priya@example.com",
    authorName: "Priya Shah",
    content: "",
    createdAt: "2026-10-04T11:00:00.000Z",
    deleted: true,
    replies: [],
  },
];

import { describe, expect, it } from "vitest";
import { toCommentNode, type ProjectComment } from "./useProjectComments";

const comment = (overrides: Partial<ProjectComment> = {}): ProjectComment => ({
  name: "C-1",
  user: "a@example.com",
  user_full_name: "Ann",
  user_image: "/a.png",
  comment: "<p>Hi</p>",
  reply_to: null,
  created_at: "2026-10-01 10:00:00",
  modified_at: "2026-10-01 10:00:00",
  reply_count: 0,
  replies: [],
  ...overrides,
});

describe("toCommentNode", () => {
  it("maps the author, body and owner", () => {
    expect(toCommentNode(comment())).toEqual({
      id: "C-1",
      authorId: "a@example.com",
      authorName: "Ann",
      authorImage: "/a.png",
      content: "<p>Hi</p>",
      createdAt: "2026-10-01 10:00:00",
      ownerId: "a@example.com",
      edited: undefined,
      deleted: undefined,
      deletedAt: undefined,
      replies: [],
    });
  });

  it("maps the edited and deleted flags and nests replies", () => {
    const node = toCommentNode(
      comment({
        edited: true,
        replies: [
          comment({
            name: "C-2",
            reply_to: "C-1",
            comment: "",
            deleted: true,
            deleted_at: "2026-10-02 09:00:00",
          }),
        ],
      }),
    );
    expect(node.edited).toBe(true);
    expect(node.replies).toHaveLength(1);
    expect(node.replies[0]).toMatchObject({
      id: "C-2",
      deleted: true,
      deletedAt: "2026-10-02 09:00:00",
    });
  });
});

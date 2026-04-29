#!/usr/bin/env python3
"""Post a message to the next-pms Slack channel via webhook.

Reads SLACK_WEBHOOK_URL from env. Always posts to
#bots-ai-workflow-next-pms (channel C0AUXBY5WMB) as the
Next-PMS-Task-AI-Bot identity with the :robot_face: icon — this is what
makes posts notify the human reviewer (whose own user is what the Slack
MCP is signed into).

Usage:
    scripts/slack_post.py --text "hello"
    scripts/slack_post.py --thread-ts 1777457794.335439 --text "reply"
    echo "long body" | scripts/slack_post.py --thread-ts <parent_ts>

Exit code:
    0  Slack returned "ok"
    1  Slack returned a non-ok body
    2  bad input / missing env

The script never echoes SLACK_WEBHOOK_URL.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

CHANNEL = "#bots-ai-workflow-next-pms"
USERNAME = "Next-PMS-Task-AI-Bot"
ICON_EMOJI = ":robot_face:"


def main() -> int:
    ap = argparse.ArgumentParser(description="Post to next-pms Slack via webhook.")
    ap.add_argument("--thread-ts", help="Parent message ts to reply under (omit for a new top-level post).")
    ap.add_argument("--text", help="Message body. If omitted, body is read from stdin.")
    args = ap.parse_args()

    url = os.environ.get("SLACK_WEBHOOK_URL")
    if not url:
        print(
            "slack_post: SLACK_WEBHOOK_URL is not exported.\n"
            "  Either add `export SLACK_WEBHOOK_URL=...` to ~/.bashrc, or invoke as:\n"
            "    bash -ic 'export SLACK_WEBHOOK_URL && scripts/slack_post.py ...'",
            file=sys.stderr,
        )
        return 2

    text = args.text if args.text is not None else sys.stdin.read()
    if not text.strip():
        print("slack_post: empty message body", file=sys.stderr)
        return 2

    payload: dict[str, object] = {
        "channel": CHANNEL,
        "username": USERNAME,
        "icon_emoji": ICON_EMOJI,
        "text": text,
    }
    if args.thread_ts:
        payload["thread_ts"] = args.thread_ts

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode("utf-8").strip()
    except urllib.error.URLError as exc:
        print(f"slack_post: request failed: {exc}", file=sys.stderr)
        return 1

    if body != "ok":
        print(f"slack_post: slack returned: {body}", file=sys.stderr)
        return 1

    print("ok")
    return 0


if __name__ == "__main__":
    sys.exit(main())

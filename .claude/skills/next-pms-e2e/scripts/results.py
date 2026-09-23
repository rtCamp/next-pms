#!/usr/bin/env python3
"""Summarise tests/e2e/results.json.

The JSON reporter nests specs inside arbitrarily deep suites, and a failing test
carries several results (retries). Reading it by eye is slow and error-prone, so
this flattens it into a table keyed by TC ID.

Usage, from the repo root:

    python3 .claude/skills/next-pms-e2e/scripts/results.py            # summary
    python3 .claude/skills/next-pms-e2e/scripts/results.py --errors   # + detail
    python3 .claude/skills/next-pms-e2e/scripts/results.py --ids      # bare ID lists
    python3 .claude/skills/next-pms-e2e/scripts/results.py --slow 20  # near the 30s ceiling

`--slow N` matters more than it looks: with slowMo:500 against a 30s default
timeout, anything past ~20s passes locally and flakes under parallel load.
"""

import argparse
import json
import os
import re
import sys

ANSI = re.compile(r"\x1b\[[0-9;]*m")


def walk(suites):
    for suite in suites:
        yield from suite.get("specs", [])
        yield from walk(suite.get("suites", []))


def label(spec, tc, seen_ids):
    """Disambiguate IDs used by more than one test (TC112 and TC114 each name
    two different tests - one in project.spec.js, one in team.spec.js - so
    grouping by ID alone lets a passing one mask a failing one)."""
    if seen_ids.get(tc, 0) > 1:
        where = (spec.get("file") or "").split("/")[-1].replace(".spec.js", "")
        return f"{tc}[{where}]"
    return tc


def tc_key(name):
    m = re.search(r"\d+", name)
    return int(m.group()) if m else 0


def first_useful_line(message):
    """Pick the line a human would want: the assertion or the locator waited on."""
    text = ANSI.sub("", message or "")
    for line in text.split("\n"):
        s = line.strip()
        if (
            s.startswith("- waiting for")
            or s.startswith("Error")
            or s.startswith("TimeoutError")
            or "Received" in s
            or "Expected" in s
        ):
            return s
    return text.split("\n")[0].strip() if text else ""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path", nargs="?", default="tests/e2e/results.json")
    ap.add_argument("--errors", action="store_true", help="show failure detail")
    ap.add_argument("--ids", action="store_true", help="print bare pass/fail ID lists")
    ap.add_argument("--slow", type=float, metavar="SEC", help="flag tests slower than SEC")
    args = ap.parse_args()

    if not os.path.exists(args.path):
        sys.exit(f"not found: {args.path} (run from the repo root)")

    with open(args.path) as fh:
        data = json.load(fh)

    # How many distinct tests carry each TC id?
    id_counts = {}
    for spec in walk(data.get("suites", [])):
        m0 = re.search(r"(TC\d+):", spec.get("title", ""))
        if m0:
            id_counts[m0.group(1)] = id_counts.get(m0.group(1), 0) + 1

    rows = []
    unprefixed = []
    for spec in walk(data.get("suites", [])):
        title = spec.get("title", "")
        # globalSetup discovers work via /TC(\d+):/ on the title. A title that
        # misses the prefix is never seeded and cannot be selected with
        # --grep 'TC<n>:', so flag it rather than silently mangling the label.
        m = re.search(r"(TC\d+):", title)
        if m:
            tc = label(spec, m.group(1), id_counts)
        else:
            tc = title[:14]
            unprefixed.append(title)
        for test in spec.get("tests", []):
            results = test.get("results", [])
            last = results[-1] if results else {}
            rows.append(
                {
                    "tc": tc,
                    "title": title,
                    "status": last.get("status", "?"),
                    "duration": last.get("duration", 0) / 1000.0,
                    "attempts": len(results),
                    "errors": last.get("errors", []),
                }
            )

    stats = data.get("stats", {})
    print(
        f"expected={stats.get('expected', '?')}  unexpected={stats.get('unexpected', '?')}  "
        f"flaky={stats.get('flaky', '?')}  skipped={stats.get('skipped', '?')}  "
        f"duration={stats.get('duration', 0) / 1000:.0f}s"
    )

    ran = [r for r in rows if r["status"] != "skipped"]
    # Count per test entry - a duplicated id must not let one result hide another.
    passed = sorted([r["tc"] for r in ran if r["status"] == "passed"], key=tc_key)
    failed = sorted([r["tc"] for r in ran if r["status"] != "passed"], key=tc_key)
    skipped = sorted([r["tc"] for r in rows if r["status"] == "skipped"], key=tc_key)

    def warn_unprefixed():
        if not unprefixed:
            return
        print(
            f"\n{len(unprefixed)} test title(s) missing the 'TC<n>:' prefix — not seeded by "
            f"globalSetup and unreachable via --grep 'TC<n>:':"
        )
        for t in unprefixed:
            print(f"  {t[:88]}")

    if args.ids:
        print(f"\nPASSED ({len(passed)}): {' '.join(passed)}")
        print(f"\nFAILED ({len(failed)}): {' '.join(failed)}")
        if skipped:
            print(f"\nSKIPPED ({len(skipped)}): {' '.join(skipped)}")
        warn_unprefixed()
        return

    print()
    for r in sorted(ran, key=lambda r: (r["status"] == "passed", tc_key(r["tc"]))):
        mark = "PASS" if r["status"] == "passed" else r["status"].upper()
        retry = f" x{r['attempts']}" if r["attempts"] > 1 else ""
        line = f"{mark:9} {r['duration']:6.1f}s{retry:4} {r['title'][:58]}"
        if args.slow and r["duration"] >= args.slow:
            line += "  <-- near timeout ceiling"
        print(line)

    print(f"\npassed={len(passed)}  failed={len(failed)}  skipped={len(skipped)}")
    warn_unprefixed()

    if args.errors and failed:
        for r in sorted(ran, key=lambda r: tc_key(r["tc"])):
            if r["status"] == "passed" or not r["errors"]:
                continue
            err = r["errors"][0]
            loc = err.get("location", {})
            where = f"{loc.get('file', '').split('tests/e2e/')[-1]}:{loc.get('line', '')}" if loc else "(no location)"
            print(f"\n{'=' * 74}\n{r['tc']}  {r['title'][:64]}\n  at {where}")
            print(f"  {first_useful_line(err.get('message'))}")

    # A failure with no location is almost always a hung wait rather than a bad
    # assertion, and the trace is the only thing that distinguishes the causes.
    unlocated = [r for r in ran if r["status"] != "passed" and not (r["errors"] and r["errors"][0].get("location"))]
    if unlocated:
        print(
            f"\n{len(unlocated)} failure(s) have no source location — likely a hung wait "
            f"(disabled field, or waitForResponse gated on status 200).\n"
            f"Read the trace: unzip -o tests/e2e/test-results/<slug>/trace.zip -d /tmp/tr && ls /tmp/tr"
        )


if __name__ == "__main__":
    main()

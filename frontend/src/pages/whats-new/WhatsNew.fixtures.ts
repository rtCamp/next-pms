import type { Release, ReleaseNotes } from "./types";

export const LATEST_RELEASE: Release = {
  version: "2.14.0",
  date: "2026-11-12",
  html: `<h3>New features</h3>
<ul>
  <li><strong>What's new</strong>: read the release notes inside Next PMS.</li>
  <li>Allocations show the <a href="https://github.com/rtCamp/next-pms" target="_blank" rel="noopener noreferrer">weekly capacity</a> of each employee.</li>
</ul>
<h3>Fixes</h3>
<ol>
  <li>The timesheet keeps the expanded weeks after a save.</li>
  <li>Project budgets round to two decimals, e.g. <code>1,250.50</code>.</li>
</ol>`,
};

export const OLDER_RELEASE: Release = {
  version: "2.13.0",
  date: "2026-10-28",
  html: `<h3>Improvements</h3>
<p>The task list loads faster on large projects.</p>
<blockquote><p>Reports now open in a new tab.</p></blockquote>`,
};

export const RELEASE_NOTES: ReleaseNotes = {
  current_version: "2.14.1",
  releases: [LATEST_RELEASE, OLDER_RELEASE],
};

/** The versions the stories' fake server was asked to record as seen, oldest first. */
export const markedSeen: string[] = [];

/**
 * Answers the What's new calls without a server: `notes`, or an error until `failures`
 * requests have failed. Returns the cleanup that restores `fetch`.
 */
export function fakeWhatsNewServer({
  notes = RELEASE_NOTES,
  failures = 0,
}: { notes?: ReleaseNotes; failures?: number } = {}) {
  markedSeen.length = 0;
  let failed = 0;
  const original = window.fetch;
  window.fetch = async (input, init) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.includes("get_release_notes")) {
      if (failed < failures) {
        failed += 1;
        return Response.json(
          { errors: [{ message: "Couldn't load release notes from GitHub." }] },
          { status: 417 },
        );
      }
      return Response.json({ data: notes });
    }
    if (url.includes("mark_release_notes_seen")) {
      markedSeen.push(JSON.parse(String(init?.body)).version);
      return Response.json({ data: null });
    }
    return original(input, init);
  };
  return () => {
    window.fetch = original;
  };
}

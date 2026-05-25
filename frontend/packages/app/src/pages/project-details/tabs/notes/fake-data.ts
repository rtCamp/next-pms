import type { Note, NoteAuthor } from "./types";

const AUTHORS: Record<string, NoteAuthor> = {
  ayush: { name: "Ayush Nirwal", email: "ayush.nirwal@rtcamp.com" },
  akash: { name: "Akash Chandgude", email: "akash.chandgude@rtcamp.com" },
  aditya: { name: "Aditya Dhade", email: "aditya.dhade@rtcamp.com" },
  girish: { name: "Girish Raghav", email: "girish.raghav@rtcamp.com" },
  nitun: { name: "Nitun Lanjewar", email: "nitun.lanjewar@rtcamp.com" },
};

export const NOTE_AUTHORS = Object.values(AUTHORS);

export const INITIAL_NOTES: Note[] = [
  {
    id: "kickoff-recap",
    title: "Atlas UI stabilisation — kickoff recap",
    excerpt:
      "Kickoff went well on Monday. The client is aligned on the Q3 milestones and accepted the proposed cadence of bi-weekly demos.\n\nNext steps:\n• Confirm RBAC sign-off by Friday\n• Land the design tokens migration before the next demo\n• Wire up the analytics dashboards to the new ingestion pipeline\n\nKey risk surfaced: the QA bench is still on the older Atlas build, which makes regression testing slower than it should be. We agreed to prioritise upgrading the QA bench this sprint.",
    createdAt: "2026-05-22",
    author: AUTHORS.ayush,
  },
  {
    id: "design-tokens-migration",
    title: "Design tokens migration — phase 2 notes",
    excerpt:
      "Phase 2 covers the long tail of one-off colour values still in the codebase. We swept the tabs/* tree and replaced ~120 hex literals with design-system tokens.\n\nRemaining work:\n• Replace inline shadow values in 4 dashboard cards\n• Migrate the legacy spacing scale in the Reports surface\n• Audit the print stylesheet for residual hex usage\n\nThe surface-amber-5 stop landed this morning so we can finally drop the bg-[#fff3e0] override on the warning banner.",
    createdAt: "2026-05-18",
    author: AUTHORS.akash,
  },
  {
    id: "qa-bench-upgrade",
    title: "QA bench upgrade plan",
    excerpt:
      "We need to upgrade the QA bench to Atlas 2.1 before the next demo cycle. Estimated downtime: 2 hours.\n\nMitigation:\n• Schedule for Friday 18:00 IST when no demos are planned\n• Spin up a temporary mirror on staging-2 for any urgent regressions\n• Capture a fresh database snapshot before kickoff for rollback\n\nNeed to coordinate with the SRE team for the supervisor restart and the post-upgrade cache rebuild. Loop @nitun in on the calendar invite.",
    createdAt: "2026-05-12",
    author: AUTHORS.aditya,
  },
  {
    id: "rbac-sign-off",
    title: "RBAC sign-off blockers",
    excerpt:
      "Two outstanding blockers for the RBAC sign-off:\n\n1. Permission inheritance for nested project folders is not yet exposed in the UI — the policy lives in the BE but the UI only shows direct grants.\n2. The audit log doesn't yet record permission *changes*, only resource access. Legal flagged this last week.\n\nProposing we fix #1 in this sprint (frontend-only) and schedule #2 for the next milestone since it touches the audit pipeline.",
    createdAt: "2026-04-29",
    author: AUTHORS.girish,
  },
  {
    id: "analytics-ingestion",
    title: "Analytics ingestion pipeline cutover",
    excerpt:
      "The new ingestion pipeline is ready for cutover. It runs ~3x faster on the bench and the schema is backward-compatible with the existing dashboards.\n\nCutover plan:\n• Run both pipelines in parallel for 7 days\n• Diff the daily aggregates between old + new outputs\n• If diff < 0.1%, flip the feature flag and decommission the old pipeline\n\nDoc owner: @akash. Cutover owner: @nitun. ETA for flip: 3 weeks if no diffs surface.",
    createdAt: "2026-04-14",
    author: AUTHORS.nitun,
  },
  {
    id: "client-feedback-q1",
    title: "Client feedback — Q1 retrospective",
    excerpt:
      "Notes from the Q1 retro with the client product team:\n\nWhat went well:\n• Faster turnaround on bug fixes (median 1.8 days vs 4.2 last quarter)\n• Visible improvement in dashboard load times\n• Better cross-team comms on RBAC scope\n\nWhat to improve:\n• PR review SLA still varies by reviewer — push for shared on-call rotation\n• Designs sometimes land mid-sprint, blocking implementation — formalise the 1-sprint design-lead-time rule",
    createdAt: "2026-03-30",
    author: AUTHORS.ayush,
  },
  {
    id: "ssr-experiment",
    title: "SSR experiment results",
    excerpt:
      "We ran the SSR experiment for 4 weeks on 5% of traffic. Headline numbers:\n\n• TTFB improved by 280ms (median) and 410ms (p95)\n• Bundle size unchanged (we serve the same bundle, just pre-render the shell)\n• No regressions in error rate or user-reported issues\n\nRecommendation: ship to 25% this week, then 100% next sprint if metrics hold. Risk: the SSR edge cache invalidation logic is still untested under traffic spikes — need a load test before 100%.",
    createdAt: "2026-03-11",
    author: AUTHORS.akash,
  },
  {
    id: "permissions-audit",
    title: "Permissions audit — outstanding items",
    excerpt:
      "Internal permissions audit surfaced 4 outstanding items, all medium severity:\n\n1. Stale service-account tokens for the legacy ingestion pipeline (rotate before cutover)\n2. Two engineers retain admin grants from a finished engagement — revoke\n3. Permission inheritance gap in the UI (see RBAC sign-off note)\n4. Missing 2FA enforcement on the staging environment\n\nETA: items 1, 2, 4 this sprint. Item 3 tracked separately.",
    createdAt: "2026-02-19",
    author: AUTHORS.aditya,
  },
  {
    id: "onboarding-revamp",
    title: "Onboarding revamp — initial scoping",
    excerpt:
      "Scoping notes for the new-engineer onboarding revamp. Current path takes ~3 weeks to first meaningful PR, which is too slow.\n\nProposed changes:\n• Pre-provisioned bench environments per new hire (no more day-1 setup)\n• Codified \"first PR\" curriculum (10 small tasks of increasing complexity)\n• Dedicated buddy rotation with a shared on-call channel for questions\n\nKickoff with @girish next week to validate the proposal against last cohort's feedback before formalising.",
    createdAt: "2026-01-22",
    author: AUTHORS.girish,
  },
];

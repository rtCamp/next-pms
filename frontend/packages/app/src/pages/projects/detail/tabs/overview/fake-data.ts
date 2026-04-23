/**
 * Internal dependencies.
 */
import type { OverviewData } from "./types";

const DEFAULT_OVERVIEW: OverviewData = {
  summary:
    "Refactor the Atlas UI to address visual regressions introduced during the 2026 design system migration. The work stabilises core primitives (buttons, forms, navigation), re-wires token usage across the legacy screens, and lands a golden-path acceptance suite before the next release train.",
  keyGoalsHtml: `
    <ul>
      <li>Restore visual parity with the Atlas 2025 baseline across the 18 core screens.</li>
      <li>Retire the inline hex literals still leaking into dashboard and reports modules.</li>
      <li>Unify the primary / ghost / subtle button variants behind <code>frappe-ui-react</code>.</li>
      <li>Document the accepted overrides in the design-system storybook as "escape hatches".</li>
      <li>Add Playwright visual baselines for the migrated screens.</li>
      <li>Hit a clean Lighthouse accessibility score on all refactored routes.</li>
      <li>Hand off to the QA team by end of cycle with a one-pager of known caveats.</li>
    </ul>
  `,
  specifics: {
    priority: "Medium",
    complexity: "High",
    keyAccount: "Mark Howard",
  },
  sourcing: {
    source: "Cold calling",
    primaryLocation: "India",
    previousCms: "WCAG Compliance",
  },
  communication: {
    pointOfContact: "Michelle Williams",
    timeReportFrequency: "Bi-weekly",
  },
  marketing: {
    ndaSigned: false,
    caseStudyApproved: true,
    testimonialApproved: true,
    testimonialContact: "Anna Huang",
  },
};

export const OVERVIEW_FAKE_DATA: Record<string, OverviewData> = {};

export function getOverviewData(projectId: string): OverviewData {
  return OVERVIEW_FAKE_DATA[projectId] ?? DEFAULT_OVERVIEW;
}

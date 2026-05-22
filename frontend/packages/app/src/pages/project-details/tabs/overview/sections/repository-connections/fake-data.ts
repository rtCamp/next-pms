/**
 * Internal dependencies.
 */
import type { AvailableRepo, RepoConnection } from "./types";

export const INITIAL_REPOS: RepoConnection[] = [
  {
    id: "atlas-ui-stabilization",
    name: "atlas-ui-stabilization",
    createdOn: "2025-04-12",
    githubUrl: "https://github.com/rtCamp/atlas-ui-stabilization",
  },
  {
    id: "atlas-frontend-stability",
    name: "atlas-frontend-stability",
    createdOn: "2025-06-03",
    githubUrl: "https://github.com/rtCamp/atlas-frontend-stability",
  },
  {
    id: "atlas-ui-fixes",
    name: "atlas-ui-fixes",
    createdOn: "2025-08-21",
    githubUrl: "https://github.com/rtCamp/atlas-ui-fixes",
  },
  {
    id: "atlas-ui-hardening",
    name: "atlas-ui-hardening",
    createdOn: "2025-10-14",
    githubUrl: "https://github.com/rtCamp/atlas-ui-hardening",
  },
  {
    id: "atlas-ui-maintenance",
    name: "atlas-ui-maintenance",
    createdOn: "2025-11-18",
    githubUrl: "https://github.com/rtCamp/atlas-ui-maintenance",
  },
];

export const AVAILABLE_REPOS: AvailableRepo[] = [
  {
    id: "atlas-design-system",
    name: "atlas-design-system",
    fullPath: "frappe/atlas-design-system",
    githubUrl: "https://github.com/frappe/atlas-design-system",
  },
  {
    id: "atlas-cms-migration",
    name: "atlas-cms-migration",
    fullPath: "frappe/atlas-cms-migration",
    githubUrl: "https://github.com/frappe/atlas-cms-migration",
  },
  {
    id: "atlas-search",
    name: "atlas-search",
    fullPath: "frappe/atlas-search",
    githubUrl: "https://github.com/frappe/atlas-search",
  },
  {
    id: "atlas-wcag-checker",
    name: "atlas-wcag-checker",
    fullPath: "frappe/atlas-wcag-checker",
    githubUrl: "https://github.com/frappe/atlas-wcag-checker",
  },
  {
    id: "atlas-program-finder",
    name: "atlas-program-finder",
    fullPath: "frappe/atlas-program-finder",
    githubUrl: "https://github.com/frappe/atlas-program-finder",
  },
];

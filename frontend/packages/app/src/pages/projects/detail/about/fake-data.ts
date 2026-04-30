/**
 * External dependencies.
 */
import {
  Globe,
  People,
  SolidExternalLink,
  SolidFolderAlt,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { GithubIcon } from "./githubIcon";
import type { ProjectAboutData, ProjectLink } from "./types";

const SAMPLE_LINKS: ProjectLink[] = [
  {
    key: "website",
    label: "Website",
    href: "https://example.com",
    icon: Globe,
  },
  {
    key: "files",
    label: "Files",
    href: "https://example.com/files",
    icon: SolidFolderAlt,
  },
  {
    key: "github",
    label: "GitHub",
    href: "https://github.com/example/repo",
    icon: GithubIcon,
  },
  {
    key: "people",
    label: "People",
    href: "https://example.com/team",
    icon: People,
  },
  {
    key: "support",
    label: "Support",
    href: "https://example.com/support",
    icon: SolidExternalLink,
  },
];

const SAMPLE_MEMBERS = [
  {
    name: "Marcus Thompson",
    initials: "MT",
    email: "marcus.thompson@rtcamp.com",
    designation: "Senior Software Engineer",
    phone: "+1 415 555 0142",
    avatarColor: "#facb3c",
  },
  {
    name: "James Taylor",
    initials: "JT",
    email: "james.taylor@rtcamp.com",
    designation: "Software Engineer",
    avatarColor: "#f6315b",
  },
  {
    name: "Evelyn Carter",
    initials: "EC",
    email: "evelyn.carter@rtcamp.com",
    designation: "Software Engineer",
    avatarColor: "#39c6fe",
  },
  {
    name: "Mia Thomas",
    initials: "MT",
    email: "mia.thomas@rtcamp.com",
    designation: "QA Engineer",
    avatarColor: "#51cc1c",
  },
  {
    name: "Julian Andrews",
    initials: "JA",
    email: "julian.andrews@rtcamp.com",
    designation: "Tech Lead",
    avatarColor: "#226fff",
  },
  {
    name: "Ali Smith",
    initials: "AS",
    email: "ali.smith@rtcamp.com",
    designation: "Project Manager",
    avatarColor: "#f624c8",
  },
  {
    name: "Sofia Lee",
    initials: "SL",
    email: "sofia.lee@rtcamp.com",
    designation: "Designer",
    avatarColor: "#facb3c",
  },
  {
    name: "Chris Johnson",
    initials: "CJ",
    email: "chris.johnson@rtcamp.com",
    designation: "DevOps",
    avatarColor: "#39c6fe",
  },
  {
    name: "Olivia Davis",
    initials: "OD",
    email: "olivia.davis@rtcamp.com",
    designation: "Software Engineer",
    avatarColor: "#51cc1c",
  },
];

const SAMPLE_CUSTOMERS = [
  {
    name: "Michelle Williams",
    initials: "MW",
    email: "michelle.williams@atlas.com",
    company: "Atlas Corporation",
    href: "https://atlas.com",
    avatarColor: "#226fff",
  },
  {
    name: "Faris Ansari",
    initials: "FA",
    email: "faris.ansari@atlas.com",
    company: "Atlas Corporation",
    href: "https://atlas.com",
    avatarColor: "#f624c8",
  },
  {
    name: "Evelyn Carter",
    initials: "EC",
    email: "evelyn.carter@atlas.com",
    company: "Atlas Corporation",
    href: "https://atlas.com",
    avatarColor: "#51cc1c",
  },
  {
    name: "Mark Howard",
    initials: "MH",
    email: "mark.howard@atlas.com",
    company: "Atlas Corporation",
    avatarColor: "#facb3c",
  },
  {
    name: "Anna Huang",
    initials: "AH",
    email: "anna.huang@atlas.com",
    company: "Atlas Corporation",
    avatarColor: "#39c6fe",
  },
  {
    name: "Emma Martinez",
    initials: "EM",
    email: "emma.martinez@atlas.com",
    company: "Atlas Corporation",
    avatarColor: "#f6315b",
  },
  {
    name: "Liam Brown",
    initials: "LB",
    email: "liam.brown@atlas.com",
    company: "Atlas Corporation",
    avatarColor: "#226fff",
  },
  {
    name: "Ava White",
    initials: "AW",
    email: "ava.white@atlas.com",
    company: "Atlas Corporation",
    avatarColor: "#f624c8",
  },
  {
    name: "Noah Anderson",
    initials: "NA",
    email: "noah.anderson@atlas.com",
    company: "Atlas Corporation",
    avatarColor: "#51cc1c",
  },
];

const DEFAULT_ABOUT: ProjectAboutData = {
  summary:
    "Modernize the dashboard for better clarity and performance tracking.",
  status: "Active",
  links: SAMPLE_LINKS,
  budget: { current: 41000, total: 100000 },
  progress: { consumed: 140, total: 280 },
  members: SAMPLE_MEMBERS,
  customers: SAMPLE_CUSTOMERS,
};

export const PROJECT_ABOUT_FAKE_DATA: Record<string, ProjectAboutData> = {};

export function getProjectAboutData(projectId: string): ProjectAboutData {
  return PROJECT_ABOUT_FAKE_DATA[projectId] ?? DEFAULT_ABOUT;
}

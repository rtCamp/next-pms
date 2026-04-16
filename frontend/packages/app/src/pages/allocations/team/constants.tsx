import type { Member } from "@next-pms/design-system/components";

export const GANTT_START_DATE = new Date(2026, 3, 6); // April 6, 2026

export const FAKE_MEMBERS: Member[] = [
  {
    name: "Alice Johnson",
    role: "Frontend Developer",
    badge: "FE",
    projects: [
      {
        name: "Next PMS Redesign",
        client: "Internal",
        badge: "NP",
        allocations: [
          {
            hours: 6,
            startDate: new Date(2026, 3, 7),
            endDate: new Date(2026, 3, 18),
            billable: false,
            tentative: true,
          },
        ],
      },
      {
        name: "Client Portal",
        client: "Acme Corp",
        badge: "CP",
        allocations: [
          {
            hours: 2,
            startDate: new Date(2026, 3, 21),
            endDate: new Date(2026, 3, 25),
            billable: false,
            tentative: false,
          },
        ],
      },
    ],
  },
  {
    name: "Bob Martinez",
    role: "Backend Developer",
    badge: "BE",
    projects: [
      {
        name: "API Gateway",
        client: "Globex",
        badge: "AG",
        allocations: [
          {
            hours: 8,
            startDate: new Date(2026, 3, 6),
            endDate: new Date(2026, 3, 17),
            billable: false,
            tentative: false,
          },
        ],
      },
      {
        name: "Backend Stabilization",
        client: "Globex",
        badge: "BS",
        allocations: [
          {
            hours: 4,
            startDate: new Date(2026, 2, 31),
            endDate: new Date(2026, 3, 9),
            billable: true,
            tentative: false,
          },
        ],
      },
    ],
  },
  {
    name: "Carol Singh",
    role: "UI/UX Designer",
    badge: "DS",
    projects: [
      {
        name: "Design System v2",
        client: "Internal",
        badge: "DS",
        allocations: [
          {
            hours: 4,
            startDate: new Date(2026, 3, 8),
            endDate: new Date(2026, 3, 24),
            billable: false,
            tentative: true,
          },
        ],
      },
    ],
  },
  {
    name: "David Lee",
    role: "DevOps Engineer",
    badge: "DO",
    projects: [],
  },
  {
    name: "Eva Chen",
    role: "QA Engineer",
    badge: "QA",
    projects: [
      {
        name: "Automated Testing Suite",
        client: "Internal",
        badge: "AT",
        allocations: [
          {
            hours: 5,
            startDate: new Date(2026, 3, 6),
            endDate: new Date(2026, 3, 17),
            billable: true,
            tentative: true,
          },
        ],
      },
    ],
  },
  {
    name: "Frank Okafor",
    role: "Product Manager",
    badge: "PM",
    projects: [
      {
        name: "Next PMS Redesign",
        client: "Internal",
        badge: "NP",
        allocations: [
          {
            hours: 3,
            startDate: new Date(2026, 3, 7),
            endDate: new Date(2026, 3, 30),
            billable: false,
            tentative: false,
          },
        ],
      },
      {
        name: "Release Planning",
        client: "Internal",
        badge: "RP",
        allocations: [
          {
            hours: 5,
            startDate: new Date(2026, 3, 28),
            endDate: new Date(2026, 4, 12),
            billable: false,
            tentative: true,
          },
        ],
      },
    ],
  },
  {
    name: "Grace Park",
    role: "Mobile Developer",
    badge: "MD",
    projects: [
      {
        name: "iOS App v3",
        client: "Initech",
        badge: "IA",
        allocations: [
          {
            hours: 7,
            startDate: new Date(2026, 3, 6),
            endDate: new Date(2026, 3, 20),
            billable: true,
            tentative: false,
          },
        ],
      },
      {
        name: "Android App",
        client: "Initech",
        badge: "AA",
        allocations: [
          {
            hours: 4,
            startDate: new Date(2026, 3, 21),
            endDate: new Date(2026, 3, 30),
            billable: false,
            tentative: true,
          },
        ],
      },
    ],
  },
  {
    name: "Henry Nguyen",
    role: "Data Engineer",
    badge: "DE",
    projects: [
      {
        name: "Data Pipeline",
        client: "Umbrella Inc",
        badge: "DP",
        allocations: [
          {
            hours: 6,
            startDate: new Date(2026, 3, 13),
            endDate: new Date(2026, 3, 30),
            tentative: true,
          },
        ],
      },
    ],
  },
  {
    name: "Isabel Torres",
    role: "Scrum Master",
    badge: "SM",
    projects: [],
  },
  {
    name: "James Kim",
    role: "Security Engineer",
    badge: "SE",
    projects: [
      {
        name: "Security Audit",
        client: "Globex",
        badge: "SA",
        allocations: [
          {
            hours: 10,
            startDate: new Date(2026, 3, 6),
            endDate: new Date(2026, 3, 10),
            billable: false,
            tentative: true,
          },
        ],
      },
    ],
  },
  {
    name: "Karen Patel",
    role: "Technical Writer",
    badge: "TW",
    projects: [
      {
        name: "API Documentation",
        client: "Internal",
        badge: "AD",
        allocations: [
          {
            hours: 4,
            startDate: new Date(2026, 3, 8),
            endDate: new Date(2026, 3, 22),
            billable: false,
            tentative: false,
          },
        ],
      },
    ],
  },
  {
    name: "Liam Brooks",
    role: "Full Stack Developer",
    badge: "FS",
    projects: [
      {
        name: "Client Portal",
        client: "Acme Corp",
        badge: "CP",
        allocations: [
          {
            hours: 6,
            startDate: new Date(2026, 3, 6),
            endDate: new Date(2026, 3, 17),
            billable: true,
            tentative: true,
          },
        ],
      },
      {
        name: "API Gateway",
        client: "Globex",
        badge: "AG",
        allocations: [
          {
            hours: 3,
            startDate: new Date(2026, 3, 20),
            endDate: new Date(2026, 3, 30),
            billable: false,
            tentative: false,
          },
        ],
      },
    ],
  },
  {
    name: "Mia Rossi",
    role: "Cloud Architect",
    badge: "CA",
    projects: [
      {
        name: "Cloud Migration",
        client: "Umbrella Inc",
        badge: "CM",
        allocations: [
          {
            hours: 7,
            startDate: new Date(2026, 3, 6),
            endDate: new Date(2026, 3, 30),
            billable: true,
            tentative: false,
          },
        ],
      },
      {
        name: "Infrastructure Modernization",
        client: "Umbrella Inc",
        badge: "IM",
        allocations: [
          {
            hours: 6,
            startDate: new Date(2026, 2, 25),
            endDate: new Date(2026, 4, 20),
            billable: true,
            tentative: true,
          },
        ],
      },
    ],
  },
  {
    name: "Noah Adeyemi",
    role: "ML Engineer",
    badge: "ML",
    projects: [
      {
        name: "Recommendation Engine",
        client: "Initech",
        badge: "RE",
        allocations: [
          {
            hours: 5,
            startDate: new Date(2026, 3, 13),
            endDate: new Date(2026, 3, 24),
            billable: true,
            tentative: true,
          },
        ],
      },
    ],
  },
  {
    name: "Olivia Walsh",
    role: "Business Analyst",
    badge: "BA",
    projects: [],
  },
];

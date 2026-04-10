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
        allocation: [
          {
            hours: 6,
            startDate: new Date(2026, 3, 7),
            endDate: new Date(2026, 3, 18),
          },
        ],
      },
      {
        name: "Client Portal",
        client: "Acme Corp",
        badge: "CP",
        allocation: [
          {
            hours: 2,
            startDate: new Date(2026, 3, 21),
            endDate: new Date(2026, 3, 25),
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
        allocation: [
          {
            hours: 8,
            startDate: new Date(2026, 3, 6),
            endDate: new Date(2026, 3, 17),
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
        allocation: [
          {
            hours: 4,
            startDate: new Date(2026, 3, 8),
            endDate: new Date(2026, 3, 24),
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
        allocation: [
          {
            hours: 5,
            startDate: new Date(2026, 3, 6),
            endDate: new Date(2026, 3, 17),
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
        allocation: [
          {
            hours: 3,
            startDate: new Date(2026, 3, 7),
            endDate: new Date(2026, 3, 30),
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
        allocation: [
          {
            hours: 7,
            startDate: new Date(2026, 3, 6),
            endDate: new Date(2026, 3, 20),
          },
        ],
      },
      {
        name: "Android App",
        client: "Initech",
        badge: "AA",
        allocation: [
          {
            hours: 4,
            startDate: new Date(2026, 3, 21),
            endDate: new Date(2026, 3, 30),
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
        allocation: [
          {
            hours: 6,
            startDate: new Date(2026, 3, 13),
            endDate: new Date(2026, 3, 30),
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
        allocation: [
          {
            hours: 8,
            startDate: new Date(2026, 3, 6),
            endDate: new Date(2026, 3, 10),
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
        allocation: [
          {
            hours: 4,
            startDate: new Date(2026, 3, 8),
            endDate: new Date(2026, 3, 22),
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
        allocation: [
          {
            hours: 6,
            startDate: new Date(2026, 3, 6),
            endDate: new Date(2026, 3, 17),
          },
        ],
      },
      {
        name: "API Gateway",
        client: "Globex",
        badge: "AG",
        allocation: [
          {
            hours: 3,
            startDate: new Date(2026, 3, 20),
            endDate: new Date(2026, 3, 30),
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
        allocation: [
          {
            hours: 7,
            startDate: new Date(2026, 3, 6),
            endDate: new Date(2026, 3, 30),
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
        allocation: [
          {
            hours: 5,
            startDate: new Date(2026, 3, 13),
            endDate: new Date(2026, 3, 24),
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

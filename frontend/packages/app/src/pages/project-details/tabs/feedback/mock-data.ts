/**
 * Internal dependencies.
 */
import type {
  BreakdownMetric,
  MonthEntry,
  ResponseItem,
  TeamFeedbackRow,
} from "./types";

export const MOCK_MONTHS: MonthEntry[] = [
  { key: "2026-01", month: "Jan", year: 2026, score: 100 },
  { key: "2026-02", month: "Feb", year: 2026, score: 90 },
  { key: "2026-03", month: "Mar", year: 2026, score: 65 },
  { key: "2026-04", month: "Apr", year: 2026, score: 95 },
  { key: "2026-05", month: "May", year: 2026, score: 80 },
  { key: "2026-06", month: "Jun", year: 2026, score: 100 },
  { key: "2026-07", month: "Jul", year: 2026, score: 100 },
  { key: "2026-08", month: "Aug", year: 2026, score: 40 },
  { key: "2026-09", month: "Sep", year: 2026, score: 89 },
  { key: "2026-10", month: "Oct", year: 2026, score: 100 },
  { key: "2026-11", month: "Nov", year: 2026, score: 90 },
  { key: "2026-12", month: "Dec", year: 2026, score: 90 },
  { key: "2027-01", month: "Jan", year: 2027, score: 60 },
  { key: "2027-02", month: "Feb", year: 2027, score: 70 },
  { key: "2027-03", month: "Mar", year: 2027, score: 70 },
  { key: "2027-04", month: "Apr", year: 2027, score: 81 },
  { key: "2027-05", month: "May", year: 2027, score: 99 },
  { key: "2027-06", month: "Jun", year: 2027, score: 79 },
  { key: "2027-07", month: "Jul", year: 2027, score: 21 },
  { key: "2027-08", month: "Aug", year: 2027, score: 34 },
  { key: "2027-09", month: "Sep", year: 2027, score: 73 },
  { key: "2027-10", month: "Oct", year: 2027, score: 27 },
  { key: "2027-11", month: "Nov", year: 2027, score: 18 },
  { key: "2027-12", month: "Dec", year: 2027, score: 89 },
];

export const MOCK_BREAKDOWNS: Record<string, BreakdownMetric[]> = {
  "2026-01": [
    { label: "Overall satisfaction", rating: 5, percentage: 100 },
    { label: "Communication & Responsiveness", rating: 5, percentage: 100 },
    { label: "Delivery & Quality", rating: 5, percentage: 100 },
    { label: "Confidence in engagement", rating: 5, percentage: 100 },
  ],
  "2026-02": [
    { label: "Overall satisfaction", rating: 5, percentage: 90 },
    { label: "Communication & Responsiveness", rating: 4, percentage: 80 },
    { label: "Delivery & Quality", rating: 5, percentage: 100 },
    { label: "Confidence in engagement", rating: 4, percentage: 80 },
  ],
  "2026-03": [
    { label: "Overall satisfaction", rating: 3, percentage: 65 },
    { label: "Communication & Responsiveness", rating: 4, percentage: 70 },
    { label: "Delivery & Quality", rating: 3, percentage: 60 },
    { label: "Confidence in engagement", rating: 3, percentage: 65 },
  ],
  "2026-04": [
    { label: "Overall satisfaction", rating: 3, percentage: 60 },
    { label: "Communication & Responsiveness", rating: 5, percentage: 100 },
    { label: "Delivery & Quality", rating: 4, percentage: 80 },
    { label: "Confidence in engagement", rating: 4, percentage: 80 },
  ],
  "2026-05": [
    { label: "Overall satisfaction", rating: 4, percentage: 80 },
    { label: "Communication & Responsiveness", rating: 4, percentage: 80 },
    { label: "Delivery & Quality", rating: 4, percentage: 80 },
    { label: "Confidence in engagement", rating: 4, percentage: 80 },
  ],
  "2026-06": [
    { label: "Overall satisfaction", rating: 5, percentage: 100 },
    { label: "Communication & Responsiveness", rating: 5, percentage: 100 },
    { label: "Delivery & Quality", rating: 5, percentage: 100 },
    { label: "Confidence in engagement", rating: 5, percentage: 100 },
  ],
  "2026-07": [
    { label: "Overall satisfaction", rating: 5, percentage: 100 },
    { label: "Communication & Responsiveness", rating: 5, percentage: 100 },
    { label: "Delivery & Quality", rating: 5, percentage: 100 },
    { label: "Confidence in engagement", rating: 5, percentage: 100 },
  ],
  "2026-08": [
    { label: "Overall satisfaction", rating: 2, percentage: 40 },
    { label: "Communication & Responsiveness", rating: 2, percentage: 40 },
    { label: "Delivery & Quality", rating: 2, percentage: 40 },
    { label: "Confidence in engagement", rating: 2, percentage: 40 },
  ],
  "2026-09": [
    { label: "Overall satisfaction", rating: 4, percentage: 89 },
    { label: "Communication & Responsiveness", rating: 5, percentage: 100 },
    { label: "Delivery & Quality", rating: 4, percentage: 80 },
    { label: "Confidence in engagement", rating: 4, percentage: 80 },
  ],
  "2026-10": [
    { label: "Overall satisfaction", rating: 5, percentage: 100 },
    { label: "Communication & Responsiveness", rating: 5, percentage: 100 },
    { label: "Delivery & Quality", rating: 5, percentage: 100 },
    { label: "Confidence in engagement", rating: 5, percentage: 100 },
  ],
  "2026-11": [
    { label: "Overall satisfaction", rating: 5, percentage: 90 },
    { label: "Communication & Responsiveness", rating: 4, percentage: 90 },
    { label: "Delivery & Quality", rating: 5, percentage: 90 },
    { label: "Confidence in engagement", rating: 4, percentage: 90 },
  ],
  "2026-12": [
    { label: "Overall satisfaction", rating: 5, percentage: 90 },
    { label: "Communication & Responsiveness", rating: 4, percentage: 90 },
    { label: "Delivery & Quality", rating: 5, percentage: 90 },
    { label: "Confidence in engagement", rating: 4, percentage: 90 },
  ],
};

export const MOCK_RESPONSES: Record<string, ResponseItem[]> = {
  "2026-04": [
    {
      question: "Do you have any additional thoughts and feedback?",
      answer:
        "Thank you for the opportunity to provide feedback on the project. Overall, I am very pleased with the results. The team demonstrated great attention to detail and effectively addressed our requirements. I particularly appreciated the timely updates and communication throughout the process. One suggestion for improvement would be to enhance the user interface for better accessibility. Looking forward to collaborating on future projects!",
    },
    {
      question: "Would you recommend rtCamp to a peer?",
      answer:
        "Absolutely! I would highly recommend rtCamp to anyone looking for a reliable partner in their projects. Their attention to detail and commitment to meeting client needs are impressive. The team's communication is top-notch, and they keep you updated every step of the way. I believe enhancing the user interface could further improve their already great service, but overall, my experience has been fantastic. I'm excited to work with them again in the future!",
    },
    {
      question:
        "How confident do you feel using or relying on the final outcome delivered?",
      answer:
        "We feel confident using the final deliverables. They are stable, well thought through, and suitable for immediate use without additional rework.",
    },
    {
      question:
        "How well did our team understand your business needs and requirements?",
      answer:
        "The team demonstrated a strong understanding of our requirements early on. They asked relevant questions and were able to translate our inputs into practical solutions.",
    },
  ],
  "2026-01": [
    {
      question: "How satisfied are you with the project outcomes?",
      answer:
        "Extremely satisfied. The team delivered everything on time and exceeded our expectations on quality.",
    },
    {
      question: "Would you recommend rtCamp to a peer?",
      answer:
        "Without hesitation. The team is professional, responsive, and highly skilled.",
    },
  ],
  "2026-08": [
    {
      question: "What areas need improvement?",
      answer:
        "Communication could be more proactive, and we'd appreciate more frequent status updates during critical milestones.",
    },
    {
      question: "How confident are you in the deliverables?",
      answer:
        "We have some concerns about the stability of the latest release and are awaiting a patch before full rollout.",
    },
  ],
};

export const MOCK_TEAM_FEEDBACK: TeamFeedbackRow[] = [
  // Oct 1 – Dec 31
  {
    id: "oct-anita",
    from: "Oct 1",
    to: "Dec 31",
    member: { name: "Anita Kumar" },
    customer: { name: "Amy Charlton" },
    avgRating: 2.8,
  },
  {
    id: "oct-mark",
    from: "Oct 1",
    to: "Dec 31",
    member: { name: "Mark Thompson" },
    customer: { name: "Amy Charlton" },
    avgRating: 5.0,
  },
  {
    id: "oct-priya",
    from: "Oct 1",
    to: "Dec 31",
    member: { name: "Priya Singh" },
    customer: { name: "Amy Charlton" },
    avgRating: 5.0,
  },
  {
    id: "oct-lucas",
    from: "Oct 1",
    to: "Dec 31",
    member: { name: "Lucas Wong" },
    customer: { name: "Amy Charlton" },
    avgRating: 3.8,
  },
  {
    id: "oct-nina",
    from: "Oct 1",
    to: "Dec 31",
    member: { name: "Nina Patel" },
    customer: { name: "Amy Charlton" },
    avgRating: 3.0,
  },
  {
    id: "oct-omar",
    from: "Oct 1",
    to: "Dec 31",
    member: { name: "Omar Khan" },
    customer: { name: "Amy Charlton" },
    avgRating: 2.0,
  },
  // Jul 1 – Sep 30
  {
    id: "jul-anita",
    from: "Jul 1",
    to: "Sep 30",
    member: { name: "Anita Kumar" },
    customer: { name: "Amy Charlton" },
    avgRating: 4.0,
  },
  {
    id: "jul-mark",
    from: "Jul 1",
    to: "Sep 30",
    member: { name: "Mark Thompson" },
    customer: { name: "Amy Charlton" },
    avgRating: 5.0,
  },
  {
    id: "jul-priya",
    from: "Jul 1",
    to: "Sep 30",
    member: { name: "Priya Singh" },
    customer: { name: "Amy Charlton" },
    avgRating: 4.0,
  },
  {
    id: "jul-lucas",
    from: "Jul 1",
    to: "Sep 30",
    member: { name: "Lucas Wong" },
    customer: { name: "Amy Charlton" },
    avgRating: 3.0,
  },
  {
    id: "jul-nina",
    from: "Jul 1",
    to: "Sep 30",
    member: { name: "Nina Patel" },
    customer: { name: "Amy Charlton" },
    avgRating: 5.0,
  },
  {
    id: "jul-omar",
    from: "Jul 1",
    to: "Sep 30",
    member: { name: "Omar Khan" },
    customer: { name: "Amy Charlton" },
    avgRating: 4.0,
  },
  // Apr 1 – Jun 30
  {
    id: "apr-anita",
    from: "Apr 1",
    to: "Jun 30",
    member: { name: "Anita Kumar" },
    customer: { name: "Amy Charlton" },
    avgRating: 4.0,
  },
  {
    id: "apr-mark",
    from: "Apr 1",
    to: "Jun 30",
    member: { name: "Mark Thompson" },
    customer: { name: "Amy Charlton" },
    avgRating: 3.0,
  },
  {
    id: "apr-priya",
    from: "Apr 1",
    to: "Jun 30",
    member: { name: "Priya Singh" },
    customer: { name: "Amy Charlton" },
    avgRating: 4.0,
  },
  {
    id: "apr-lucas",
    from: "Apr 1",
    to: "Jun 30",
    member: { name: "Lucas Wong" },
    customer: { name: "Amy Charlton" },
    avgRating: 3.0,
  },
  {
    id: "apr-nina",
    from: "Apr 1",
    to: "Jun 30",
    member: { name: "Nina Patel" },
    customer: { name: "Amy Charlton" },
    avgRating: 2.5,
  },
  {
    id: "apr-omar",
    from: "Apr 1",
    to: "Jun 30",
    member: { name: "Omar Khan" },
    customer: { name: "Amy Charlton" },
    avgRating: 5.0,
  },
];

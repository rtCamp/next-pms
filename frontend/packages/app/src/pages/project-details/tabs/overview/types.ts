export type OverviewSpecifics = {
  priority: string;
  complexity: string;
  keyAccount: string;
};

export type OverviewSourcing = {
  source: string;
  primaryLocation: string;
  previousCms: string;
};

export type OverviewCommunication = {
  pointOfContact: string;
  timeReportFrequency: string;
};

export type OverviewMarketing = {
  ndaSigned: boolean;
  caseStudyApproved: boolean;
  testimonialApproved: boolean;
  testimonialContact: string;
};

export type OverviewData = {
  summary: string;
  keyGoalsHtml: string;
  specifics: OverviewSpecifics;
  sourcing: OverviewSourcing;
  communication: OverviewCommunication;
  marketing: OverviewMarketing;
};

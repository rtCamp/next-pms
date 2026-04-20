export type ListViewColumn = { key: string; label: string; width?: string };

export type RiskLevel = "at-risk" | "caution" | "on-track";

export type Phase =
  | "delivery-prep"
  | "kick-off"
  | "discovery"
  | "development"
  | "launch"
  | "close-out";

export type ProjectType = "Fixed cost" | "Retainer" | "External";

export type EmployeeRef = {
  name: string;
  initials: string;
  avatar?: string;
};

export type Project = {
  id: string;
  name: string;
  riskLevel: RiskLevel;
  phase: Phase;
  burnRatePerWeek: number;
  costBurnPercent: number;
  totalBudget: number;
  profitMargin: number;
  startDate: string;
  nextMilestone: string;
  endDate: string;
  projectManager: EmployeeRef;
  leadEngineer: EmployeeRef;
  type: ProjectType;
  clientName: string;
  contractEndDate: string;
};

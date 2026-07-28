export interface KPIMetric {
  current: number;
  previous: number;
  change_pct: number | null;
  trend: "up" | "down";
}

export interface LeadershipKPIResponse {
  message: {
    revenue: KPIMetric;
    cost: KPIMetric;
    profit_margin: KPIMetric;
  };
}

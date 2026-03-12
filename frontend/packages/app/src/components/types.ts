/**
 * External Dependencies
 */
import { ReactNode } from "react";

export interface EmployeeComboProps {
  disabled?: boolean;
  value: string;
  onSelect: (name: string) => void;
  className?: string;
  label?: string;
  status?: Array<string>;
  employeeName?: string;
  pageLength?: number;
  ignoreDefaultFilters?: boolean;
}

export interface InfiniteScrollProps {
  children: ReactNode;
  isLoading: boolean;
  hasMore: boolean;
  verticalLodMore: () => void;
  className?: string;
}

export interface TaskIndicatorProps {
  className?: string;
  expectedTime: number;
  actualTime: number;
  status: string;
}

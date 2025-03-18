/**
 * External Dependencies
 */
import { ReactNode } from "react";

/**
 * Internal Dependencies
 */
import { WorkingFrequency } from "@/types";

export interface AddTimeProps {
  initialDate: string;
  employee: string;
  open: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onOpenChange: (data: any) => void;
  workingHours: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess?: (data: any) => void;
  workingFrequency: WorkingFrequency;
  task?: string;
  project?: string;
  employeeName?: string;
}

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

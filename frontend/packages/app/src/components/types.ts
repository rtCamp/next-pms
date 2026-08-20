/**
 * External Dependencies
 */
import { AriaRole, ReactNode } from "react";

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
  role?: AriaRole;
  isLoading: boolean;
  hasMore: boolean;
  verticalLodMore: () => void;
  className?: string;
  skeletonClassName?: string;
  count?: number;
  scrollResetKey?: string | number;
  showScrollbar?: boolean;
  scrollbarVisibility?: "always" | "hover";
  scrollbarVariant?: "classic" | "overlay";
  enableScrollArea?: boolean;
}

export interface TaskIndicatorProps {
  className?: string;
  expectedTime: number;
  actualTime: number;
  status: string;
}

export type TaskBadgeItem = {
  icon: React.ReactNode;
  text: string;
};

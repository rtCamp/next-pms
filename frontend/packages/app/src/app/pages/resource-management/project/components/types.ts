/**
 * Internal dependencies.
 */
import { AllocationDataProps } from "../../store/types";

export interface ResourceExpandViewProps {
  project: string;
  project_name: string;
  start_date: string;
  end_date: string;
  is_billable: string;
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
}

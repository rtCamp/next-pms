/**
 * Internal dependencies.
 */
import { ResourceAllocationObjectProps } from "@/types/resource_management";
import type {
  AllocationDataProps,
  EmployeeAllWeekDataProps,
  EmployeeResourceProps,
  ResourceTeamDataProps,
} from "../../store/types";

export interface PreProcessDataProps extends ResourceTeamDataProps {
  date: string;
  max_week: number;
  start: number;
  page_length: number;
}

export interface RowCellComponentProps {
  key: string;
  date: string;
  rowCount: number;
  midIndex: number;
  dateData: EmployeeResourceProps | undefined;
  weekData: EmployeeAllWeekDataProps | undefined;
  employee: string;
  employee_name: string;
  employeeAllocations: ResourceAllocationObjectProps;
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
}

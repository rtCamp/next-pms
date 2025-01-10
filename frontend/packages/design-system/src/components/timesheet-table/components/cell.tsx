/**
 * Internal dependencies
 */
import { HoverCard } from "@design-system/components/hover-card";
import { TaskDataItemProps } from "../type";

type CellOnClickProps = {
  date: string;
  hours: number;
  description: string;
  name: string;
  task: string;
  project: string;
};
type cellProps = {
  date: string;
  data: TaskDataItemProps[];
  isHoliday: boolean;
  onCellClick?: (val: CellOnClickProps) => void;
  disabled?: boolean;
  cellClassName?: string;
};

const Cell = ({ date, data, isHoliday, onCellClick, disabled, cellClassName }: cellProps) => {
  const hours = data?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
  const description =
    data
      ?.map((item) => item.description)
      .filter(Boolean)
      .join("\n")
      .trim() || "";
  const isTimeBothBillableAndNonBillable =
    data?.some((item) => !item.is_billable) && data?.some((item) => item.is_billable);
  const isTimeBillable = data?.every((item) => item.is_billable);
  const isDisabled = disabled || data?.[0]?.docstatus === 1;

  const handleClick = () => {
    if (isDisabled) return;
    const value = {
      date,
      hours,
      description: "",
      name: "",
      task: data[0].task ?? "",
      project: data[0].project ?? "",
    };
    onCellClick && onCellClick(value);
  };
  return <HoverCard openDelay={1000} closeDelay={0}></HoverCard>;
};
export default Cell;

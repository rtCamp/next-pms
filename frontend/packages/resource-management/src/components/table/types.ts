/**
 * External dependencies.
 */
import { LegacyRef } from "react";

interface EmptyTableCellProps {
  cellClassName?: string;
  title?: string;
  textClassName?: string;
  onCellClick?: () => void;
}

interface ResourceTableProps {
  type: "hovercard" | "empty" | "default";
  CustomHoverCardContent?: React.FC;
  cellTypographyClassName?: string;
  cellClassName?: string;
  CellContent?: React.FC;
  title?: string;
  ref?: React.RefObject<HTMLTableCellElement>;
  value: number | string | boolean | "";
  style?: React.CSSProperties;
  onCellClick?: () => void;
}

type DateProps = {
  startDate: string;
  endDate: string;
  key: string;
  dates: string[];
};

interface ResourceTableHeaderProps {
  dates: DateProps[];
  title: string;
  cellHeaderRef: LegacyRef<HTMLTableCellElement>;
  dateToAddHeaderRef: string;
  isLoading?: boolean;
}

interface ResourceTeamTableRowProps {
  name: string;
  avatar: string;
  avatar_abbr: string;
  avatar_name: string;
  RowComponent: React.FC;
  RowExpandView?: React.FC;
}

export type {
  EmptyTableCellProps,
  ResourceTableProps,
  ResourceTableHeaderProps,
  DateProps,
  ResourceTeamTableRowProps,
};

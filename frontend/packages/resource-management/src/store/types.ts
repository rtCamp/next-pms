import { ReactNode } from "react";

interface TableContextProps {
  cellWidth: number;
  firstCellWidth: number;
}

interface TableContextProviderProps {
  children: ReactNode;
}

export type { TableContextProps, TableContextProviderProps };

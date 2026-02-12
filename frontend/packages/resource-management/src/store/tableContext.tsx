/**
 * External dependencies.
 */
import { useState, useCallback } from "react";
import { createContext } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { TableContextProps, TableContextProviderProps } from "./types";

const TableContext = createContext<{
  state: {
    tableProperties: TableContextProps;
  };
  actions: {
    updateTableCellWidth: (value: number) => void;
    getCellWidthString: (value: number) => string;
  };
}>({
  state: {
    tableProperties: { cellWidth: 4, firstCellWidth: 16 },
  },
  actions: {
    updateTableCellWidth: () => {},
    getCellWidthString: () => "",
  },
});

const TableContextProvider = ({ children }: TableContextProviderProps) => {
  const [tableProperties, setTableProperties] = useState<TableContextProps>({
    cellWidth: 4,
    firstCellWidth: 16,
  });

  const updateTableCellWidth = useCallback(
    (value: number) => {
      setTableProperties({
        ...tableProperties,
        cellWidth: value,
        firstCellWidth: value * 4,
      });
    },
    [tableProperties],
  );

  const getCellWidthString = (value: number) => `${value}rem`;

  return (
    <TableContext.Provider
      value={{
        state: { tableProperties },
        actions: { updateTableCellWidth, getCellWidthString },
      }}
    >
      {children}
    </TableContext.Provider>
  );
};

export { TableContext, TableContextProvider };

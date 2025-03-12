import { useState, createContext, ReactNode, useCallback } from "react";

interface TableContextProps {
  cellWidth: number;
  firstCellWidth: number;
}

interface TableContextProviderProps {
  children: ReactNode;
}

const TableContext = createContext<{
  tableProperties: TableContextProps;
  updateTableCellWidth: (value: number) => void;
  getCellWidthString: (value: number) => string;
}>({
  tableProperties: { cellWidth: 4, firstCellWidth: 16 },
  updateTableCellWidth: () => {},
  getCellWidthString: () => "",
});

const TableContextProvider = ({ children }: TableContextProviderProps) => {
  const [tableProperties, setTableProperties] = useState<TableContextProps>({ cellWidth: 4, firstCellWidth: 16 });

  const updateTableCellWidth = useCallback(
    (value: number) => {
      setTableProperties({ ...tableProperties, cellWidth: value, firstCellWidth: value * 4 });
    },
    [tableProperties]
  );

  const getCellWidthString = (value: number) => `${value}rem`;

  return (
    <TableContext.Provider value={{ tableProperties, updateTableCellWidth, getCellWidthString }}>
      {children}
    </TableContext.Provider>
  );
};

export { TableContext, TableContextProvider };

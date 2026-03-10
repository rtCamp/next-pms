export interface ColumnItemProps {
  id: string;
  onColumnHide: (id: string) => void;
  reOrder: React.Dispatch<React.SetStateAction<string[]>>;
  label: string;
  onDrop: () => void;
}

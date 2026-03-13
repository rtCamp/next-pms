export interface InlineTimeEntry {
  date?: string;
  employee?: string;
  task?: string;
  project?: string;
  employeeName?: string;
  dailyWorkingHours?: number;
  onSubmitSuccess?: () => void;
}

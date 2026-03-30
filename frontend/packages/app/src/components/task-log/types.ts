export type TaskWorker = {
  employeeId: string;
  employeeName: string;
  image: string | null;
  totalHours: number;
};

export type TaskLog = {
  date: string;
  employee: TaskWorker;
  description: string[];
  hours: number;
};

export type ResponseLogItem = {
  description: string[];
  employee: string;
  hours: number;
};

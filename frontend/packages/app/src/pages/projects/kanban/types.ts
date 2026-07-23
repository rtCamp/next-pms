export type Employee = {
  user: string;
  full_name: string;
  image: string | null;
};

export type KanbanColumn = {
  key: string;
  label: string;
  color: string;
  position: number;
};

export type KanbanProjectItem = {
  name: string;
  project_name: string;
  rag_status?: string | null;
  start_date: string | null;
  end_date: string | null;
  project_manager: Employee | null;
  engineering_manager: Employee | null;
  billing_type: string;
};

export type ResponseProjectKanban = {
  message: {
    columns: KanbanColumn[];
    data: Record<string, KanbanProjectItem[]>;
    total_count: number;
  };
};

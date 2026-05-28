export type TableColumn = {
  key: string;
  label: string;
  width?: string | number;
  srOnly?: boolean;
};

export const REPO_COLUMNS: TableColumn[] = [
  { key: "repoName", label: "Repository name", width: 1 },
  { key: "createdOn", label: "Created on", width: "120px" },
  { key: "actions", label: "Actions", width: "40px", srOnly: true },
];

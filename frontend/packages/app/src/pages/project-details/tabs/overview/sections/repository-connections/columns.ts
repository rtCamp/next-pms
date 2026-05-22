export type TableColumn = {
  key: string;
  label: string;
  width?: string;
  srOnly?: boolean;
};

export const REPO_COLUMNS: TableColumn[] = [
  { key: "repoName", label: "Repository name" },
  { key: "createdOn", label: "Created on", width: "w-[120px]" },
  { key: "actions", label: "Actions", srOnly: true },
];

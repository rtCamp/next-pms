export type FieldHelp = {
  title: string;
  summary: string;
  formula?: string;
  details?: string[];
  /** Page and anchor under WIKI_BASE, e.g. "Leadership-Dashboard#heatmap". */
  wiki?: string;
};

export type InfoHoverCardProps = {
  help: FieldHelp;
  className?: string;
};

export type HelpTip = {
  id: string;
  title: string;
  body: string;
  wiki?: string;
  /** Only shown to users who hold one of these roles. */
  roles?: readonly string[];
};

export type HelpPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tips for the current page, listed under "On this page". */
  pageTips: HelpTip[];
  /** Tips for every page, listed under "Everywhere". */
  generalTips: HelpTip[];
  /** The user's roles, matched against each tip's `roles`. */
  roles: string[];
  className?: string;
};

export type OpenTips = { tips: HelpTip[]; index: number };

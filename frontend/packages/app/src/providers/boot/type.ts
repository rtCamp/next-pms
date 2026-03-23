export type BootProviderState = {
  sitename: string;
  user: {
    roles: string[];
    canCreate: string[];
    canExport: string[];
  };
  currencies: string[];
  hasBusinessUnit: boolean;
  hasIndustry: boolean;
  deskTheme?: string;
  isCalendarSetup: boolean;
  globalFilters: { [key: string]: Array<unknown> };
};

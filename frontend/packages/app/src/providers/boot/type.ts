import { ViewState } from "@/store/view";

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
  deskTheme: string;
  views: ViewState["views"];
  isCalendarSetup: boolean;
  globalFilters: { [key: string]: Array<any> };
};

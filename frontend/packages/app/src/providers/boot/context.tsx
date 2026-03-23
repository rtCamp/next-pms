/**
 * External dependencies
 */
import { createContext } from "react";

/**
 * Internal dependencies
 */
import { BootProviderState } from "./type";

const initialState: BootProviderState = {
  user: {
    roles: [],
    canCreate: [],
    canExport: [],
  },
  currencies: [],
  hasBusinessUnit: false,
  hasIndustry: false,
  deskTheme: undefined,
  isCalendarSetup: false,
  globalFilters: {},
};

export const BootProviderContext =
  createContext<BootProviderState>(initialState);

/**
 * External dependencies
 */
import { useContext } from "react";

/**
 * Internal dependencies
 */
import { BootProviderContext } from "./context";

export const useBoot = () => {
  const context = useContext(BootProviderContext);

  if (context === undefined)
    throw new Error("useBoot must be used within a BootProvider");

  return context;
};

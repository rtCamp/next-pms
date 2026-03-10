/**
 * Internal dependencies.
 */
import { RootState } from "@/store";

export type NestedRoute = {
  to: string;
  label: string;
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
};

export type Route = {
  to: string;
  label: string;
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
  children?: NestedRoute[];
  isPmRoute: boolean;
};

export interface UserNavigationProps {
  user: RootState["user"];
}

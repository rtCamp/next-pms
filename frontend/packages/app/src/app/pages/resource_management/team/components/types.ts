/**
 * Internal dependencies.
 */
import { ResourceTeamDataProps } from "../../store/types";

export interface PreProcessDataProps extends ResourceTeamDataProps {
  date: string;
  max_week: number;
  start: number;
  page_length: number;
}

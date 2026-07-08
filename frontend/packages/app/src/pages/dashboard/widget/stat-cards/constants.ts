/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";

export const ACTIVE_PROJECTS_URL = `${ROUTES.project}?status=Open`;

export const AT_RISK_PROJECTS_URL = `${ROUTES.project}?status=Open&rag=${encodeURI(
  JSON.stringify(["red", "amber"]),
)}`;

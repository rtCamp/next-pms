/**
 * External dependencies.
 */
import { useFrappeGetDocList } from "frappe-react-sdk";

const DEFAULT_PHASES = [
  "Delivery Prep",
  "Kick Off",
  "Discovery",
  "Development",
  "Launch",
  "Close Out",
];

export const useProjectPhase = () => {
  const { data, error, isLoading } = useFrappeGetDocList<{ name: string }>(
    "Project Phase",
    { fields: ["name"] },
  );

  return {
    phases: data?.map((phase) => phase.name) ?? DEFAULT_PHASES,
    error,
    isLoading,
  };
};

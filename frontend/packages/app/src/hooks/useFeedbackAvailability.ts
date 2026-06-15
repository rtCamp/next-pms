/**
 * External dependencies.
 */
import { useFrappeGetCall } from "frappe-react-sdk";

export function useFeedbackAvailability() {
  const { data, isLoading, error } = useFrappeGetCall<{
    message: { available: boolean };
  }>("next_pms.next_projects.api.feedback.get_customer_feedback_availability");

  return {
    available: data?.message?.available ?? false,
    isLoading,
    error,
  };
}

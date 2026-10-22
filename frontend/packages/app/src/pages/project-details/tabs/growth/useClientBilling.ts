/**
 * External dependencies.
 */
import { useFrappeGetDocList } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { getDefaultCurrency } from "@/lib/utils";

interface ClientBillingDoc {
  default_currency: string | null;
  custom_hourly_rate: number | null;
}

export function useClientBilling(
  customer?: string | null,
  fallbackCurrency?: string | null,
) {
  const { data } = useFrappeGetDocList<ClientBillingDoc>(
    "Customer",
    {
      fields: ["default_currency", "custom_hourly_rate"],
      filters: [["name", "=", customer ?? ""]],
      limit: 1,
    },
    customer ? undefined : null,
  );
  const client = data?.[0];

  return {
    currency:
      client?.default_currency || fallbackCurrency || getDefaultCurrency(),
    hourlyRate: client?.custom_hourly_rate ?? null,
  };
}

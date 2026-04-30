/**
 * External dependencies.
 */
import { Button } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { AboutSection } from "./aboutSection";
import { CustomerRow } from "./customerRow";
import type { AboutCustomer } from "./types";

const VISIBLE_CUSTOMERS = 3;

export function CustomersSection({
  customers,
}: {
  customers: AboutCustomer[];
}) {
  const visible = customers.slice(0, VISIBLE_CUSTOMERS);
  const remaining = Math.max(0, customers.length - VISIBLE_CUSTOMERS);

  return (
    <AboutSection
      value="customers"
      title="Customers"
      suffix={
        <Button
          icon={AddSm}
          aria-label="Add customer"
          onClick={() => {
            // @todo: open the Add customer flow once that's wired (Issue #1227 AC: TBD).
          }}
        />
      }
    >
      <div className="flex flex-col gap-1 px-5 pb-3">
        {visible.map((customer) => (
          <CustomerRow key={customer.email} customer={customer} />
        ))}
        {remaining > 0 ? (
          <div className="py-1.5 text-base font-light text-ink-gray-5">
            +{remaining} more members
          </div>
        ) : null}
      </div>
    </AboutSection>
  );
}

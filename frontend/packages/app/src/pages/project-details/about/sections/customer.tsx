/**
 * External dependencies.
 */
import { useState } from "react";
import { Button } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { AddCustomerModal } from "../components/addCustomerModal";
import { CustomerRow } from "../components/customerRow";
import { ExpandableList } from "../components/expandableList";
import { Section } from "../section";
import { useSidebar } from "../sidebarContext";

export function CustomerSection() {
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const customers = useSidebar((state) => state.customers);
  const customerName = useSidebar(
    (state) => state.sidebar.details.customer ?? "",
  );
  const currentContactIds = useSidebar((state) => state.currentContactIds);
  const addCustomer = useSidebar((state) => state.addCustomer);
  const removeCustomer = useSidebar((state) => state.removeCustomer);

  return (
    <>
      <Section
        value="customers"
        title="Customers"
        suffix={
          <Button
            icon={AddSm}
            aria-label="Add customer"
            onClick={() => setAddCustomerOpen(true)}
          />
        }
      >
        <ExpandableList
          items={customers}
          itemLabel="customers"
          getKey={(customer) => customer.email ?? customer.name ?? ""}
          renderItem={(customer) => <CustomerRow customer={customer} />}
        />
      </Section>
      <AddCustomerModal
        open={addCustomerOpen}
        onOpenChange={setAddCustomerOpen}
        customer={customerName}
        currentCustomerIds={currentContactIds}
        onAdd={addCustomer}
        onRemove={removeCustomer}
      />
    </>
  );
}

import { useEffect, useState } from "react";
import { Plus, User, X } from "lucide-react";

import SearchDropdown from "../../../shared/components/SearchDropdown";
import SearchItem from "../../../shared/components/SearchDropdown/SearchItem";
import { Button, Card } from "../../../components/ui";

import type { Customer } from "../../../types/customer";
import { subscribeToBillingDataChanges } from "../../../shared/utils/billingEvents";

type CustomerSelectorProps = {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
  onClearCustomer: () => void;
  onNewCustomer: () => void;
};

export default function CustomerSelector({
  selectedCustomer,
  onSelectCustomer,
  onClearCustomer,
  onNewCustomer,
}: CustomerSelectorProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCustomers() {
      if (!search.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);

      try {
        const data = await window.customer.search(search);
        setResults(data);
      } catch (error) {
        console.error(error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    loadCustomers();
  }, [search]);

  useEffect(() => {
    return subscribeToBillingDataChanges(() => {
      if (!search.trim()) return;
      void window.customer.search(search).then(setResults).catch(() => setResults([]));
    });
  }, [search]);

  function selectCustomer(customer: Customer) {
    onSelectCustomer(customer);
    setSearch("");
    setResults([]);
  }

  return (
    <Card className="billing-customer-selector">
      <div className="billing-customer-selector__header">
        <div>
          <p className="section-heading__eyebrow">Billing customer</p>
          <h2>Customer</h2>
        </div>
        <Button size="sm" onClick={onNewCustomer}><Plus size={16} />New Customer</Button>
      </div>

      <div className="billing-customer-selector__search">
        <SearchDropdown
          value={search}
          placeholder="Search name, mobile, or KV code..."
          open={results.length > 0 || (search.trim().length > 0 && !loading)}
          onChange={setSearch}
        >
          {results.length > 0 ? (
            results.map((customer) => (
              <SearchItem
                key={customer.id}
                title={customer.name}
                subtitle={`${customer.customerCode} • ${customer.mobile}`}
                rightText={customer.totalOrders ? `${customer.totalOrders} orders` : ""}
                onClick={() => selectCustomer(customer)}
              />
            ))
          ) : (
            <p className="billing-customer-selector__search-status">
              {loading ? "Searching customers..." : "No customers found."}
            </p>
          )}
        </SearchDropdown>
      </div>

      <div className="billing-customer-selector__selection">
        <div className="billing-customer-selector__avatar"><User size={24} /></div>
        <div className="billing-customer-selector__details">
          {selectedCustomer ? (
            <>
              <h3>{selectedCustomer.name}</h3>
              <p>{selectedCustomer.customerCode} • {selectedCustomer.mobile}</p>
              <small>{selectedCustomer.email ?? "No email address"}</small>
            </>
          ) : (
            <>
              <h3>No customer selected</h3>
              <p>Search an existing customer or create a new profile to continue billing.</p>
            </>
          )}
        </div>
        {selectedCustomer && (
          <Button variant="secondary" size="sm" onClick={onClearCustomer}>
            <X size={16} />Clear
          </Button>
        )}
      </div>
    </Card>
  );
}

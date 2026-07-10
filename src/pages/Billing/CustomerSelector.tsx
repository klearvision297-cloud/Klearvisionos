import { useEffect, useState } from "react";
import { Plus, User, X } from "lucide-react";

import SearchDropdown from "../../features/customers/components/common/SearchDropdown";
import SearchItem from "../../features/customers/components/common/SearchDropdown/SearchItem";

import type { Customer } from "../../types/customer";

type CustomerSelectorProps = {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
  onClearCustomer: () => void;
};

export default function CustomerSelector({
  selectedCustomer,
  onSelectCustomer,
  onClearCustomer,
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

  function selectCustomer(customer: Customer) {
    onSelectCustomer(customer);
    setSearch("");
    setResults([]);
  }

  return (
    <div
      style={{
        background: "white",
        borderRadius: 18,
        padding: 24,
        boxShadow: "0 4px 12px rgba(0,0,0,.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              marginBottom: 8,
              color: "#0F172A",
            }}
          >
            Customer
          </h2>

          <p
            style={{
              margin: 0,
              color: "#64748B",
              maxWidth: 520,
            }}
          >
            Search customer by name, mobile number, or KV code and select the
            customer for this bill.
          </p>
        </div>

        <button
          type="button"
          style={{
            height: 50,
            padding: "0 18px",
            border: "none",
            borderRadius: 12,
            background: "#2563EB",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          <Plus size={18} />
          New Customer
        </button>
      </div>

      <div style={{ position: "relative", marginBottom: 22 }}>
        <SearchDropdown
          value={search}
          placeholder="Search customer by Name, Mobile or KV Code..."
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
            <div
              style={{
                padding: 18,
                color: "#64748B",
              }}
            >
              {loading
                ? "Searching customers..."
                : search.trim()
                ? "No customers found."
                : "Start typing to search customers."
              }
            </div>
          )}
        </SearchDropdown>
      </div>

      <div
        style={{
          padding: 20,
          borderRadius: 18,
          border: "1px solid #E2E8F0",
          background: "#F8FAFC",
        }}
      >
        {selectedCustomer ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 18,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: "#2563EB",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <User size={28} />
              </div>

              <div>
                <h3
                  style={{
                    margin: 0,
                    color: "#0F172A",
                  }}
                >
                  {selectedCustomer.name}
                </h3>
                <p
                  style={{
                    margin: "8px 0 0",
                    color: "#475569",
                  }}
                >
                  {selectedCustomer.customerCode} • {selectedCustomer.mobile}
                </p>
                <p
                  style={{
                    margin: "8px 0 0",
                    color: "#64748B",
                    fontSize: 14,
                  }}
                >
                  {selectedCustomer.email ?? "No email"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClearCustomer}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid #CBD5E1",
                borderRadius: 12,
                padding: "12px 14px",
                background: "white",
                color: "#334155",
                cursor: "pointer",
              }}
            >
              <X size={16} />
              Clear
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "#2563EB",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User size={28} />
            </div>

            <div>
              <h3
                style={{
                  margin: 0,
                  color: "#0F172A",
                }}
              >
                No Customer Selected
              </h3>
              <p
                style={{
                  margin: "8px 0 0",
                  color: "#64748B",
                }}
              >
                Search an existing customer or create a new one to continue billing.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
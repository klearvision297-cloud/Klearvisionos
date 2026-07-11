import { useEffect, useState } from "react";
import { Package } from "lucide-react";

import SearchDropdown from "../../../shared/components/SearchDropdown";
import SearchItem from "../../../shared/components/SearchDropdown/SearchItem";
import type { Inventory } from "../../../types/inventory";
import { subscribeToBillingDataChanges } from "../../../shared/utils/billingEvents";

type ProductSearchProps = {
  onSelect: (item: Inventory) => void;
};

export default function ProductSearch({ onSelect }: ProductSearchProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Inventory[]>([]);

  useEffect(() => {
    let mounted = true;

    if (!search.trim()) {
      setResults([]);
      return () => {
        mounted = false;
      };
    }

    const timeout = window.setTimeout(() => {
      void window.inventory
        .search(search)
        .then((data) => {
          if (mounted) setResults(data);
        })
        .catch(() => {
          if (mounted) setResults([]);
        });
    }, 120);

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
    };
  }, [search]);

  useEffect(() => {
    return subscribeToBillingDataChanges(() => {
      if (!search.trim()) return;
      void window.inventory.search(search).then(setResults).catch(() => setResults([]));
    });
  }, [search]);

  function selectProduct(item: Inventory) {
    onSelect(item);
    setSearch("");
    setResults([]);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      setSearch("");
      setResults([]);
      return;
    }

    const resultButtons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>("button"),
    );
    if (resultButtons.length === 0) {
      if (event.key === "Enter" && results[0]) {
        event.preventDefault();
        selectProduct(results[0]);
      }
      return;
    }

    const currentIndex = resultButtons.findIndex(
      (button) => button === document.activeElement,
    );

    if (event.key === "ArrowDown") {
      event.preventDefault();
      resultButtons[
        Math.min(currentIndex + 1, resultButtons.length - 1)
      ]?.focus();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      resultButtons[Math.max(currentIndex - 1, 0)]?.focus();
    }

    if (event.key === "Enter" && currentIndex === -1 && results[0]) {
      event.preventDefault();
      selectProduct(results[0]);
    }
  }

  return (
    <div className="billing-product-search" onKeyDown={handleKeyDown}>
      <SearchDropdown
        value={search}
        placeholder="Search barcode, item code, brand, or model..."
        open={results.length > 0}
        onChange={setSearch}
      >
        {results.map((item) => {
          const available = Math.max(0, item.currentStock - item.reservedStock);

          return (
            <SearchItem
              key={item.id}
              icon={<Package size={18} />}
              title={
                `${item.brand ?? ""} ${item.model ?? ""}`.trim() ||
                item.itemCode
              }
              subtitle={`${item.itemCode} · ${available} available${item.reservedStock > 0 ? ` · ${item.reservedStock} reserved` : ""}`}
              rightText={`₹${item.sellingPrice}`}
              onClick={() => selectProduct(item)}
            />
          );
        })}
      </SearchDropdown>
    </div>
  );
}

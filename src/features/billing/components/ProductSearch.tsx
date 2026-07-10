import { useEffect, useState } from "react";
import { Package } from "lucide-react";

import SearchDropdown from "../../customers/components/common/SearchDropdown";
import SearchItem from "../../customers/components/common/SearchDropdown/SearchItem";

import type { Inventory } from "../../../types/inventory";

type ProductSearchProps = {
  onSelect: (item: Inventory) => void;
};

export default function ProductSearch({
  onSelect,
}: ProductSearchProps) {
  const [search, setSearch] = useState("");

  const [results, setResults] = useState<
    Inventory[]
  >([]);

  async function searchProducts(
    keyword: string
  ) {
    if (!keyword.trim()) {
      setResults([]);
      return;
    }

    try {
      const data =
        await window.inventory.search(
          keyword
        );

      setResults(data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    searchProducts(search);
  }, [search]);

  function selectProduct(
    item: Inventory
  ) {
    onSelect(item);

    setSearch("");

    setResults([]);
  }

  return (
    <SearchDropdown
      value={search}
      placeholder="Search by Item Code, Barcode, Brand or Model..."
      open={results.length > 0}
      onChange={setSearch}
    >
      {results.map((item) => (
        <SearchItem
          key={item.id}
          icon={<Package size={18} />}
          title={`${item.brand ?? ""} ${item.model ?? ""}`}
          subtitle={`${item.itemCode} • Stock ${item.currentStock}`}
          rightText={`₹${item.sellingPrice}`}
          onClick={() =>
            selectProduct(item)
          }
        />
      ))}
    </SearchDropdown>
  );
}
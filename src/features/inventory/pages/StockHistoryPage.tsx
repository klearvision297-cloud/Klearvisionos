import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  ClipboardList,
  PackageSearch,
  SlidersHorizontal,
} from "lucide-react";

import { Badge, Card, EmptyState, PageHeader, SearchBar, StatCard, Table } from "../../../components/ui";

import type {
  StockHistoryItem,
} from "../../../types/inventory";
import { subscribeToBillingDataChanges } from "../../../shared/utils/billingEvents";

type MovementType =
  | "ALL"
  | "SALE"
  | "PURCHASE"
  | "ADJUSTMENT"
  | "RETURN"
  | "BILLING";

const filters: {
  label: string;
  value: MovementType;
}[] = [
  { label: "All", value: "ALL" },
  { label: "Sales", value: "SALE" },
  { label: "Purchases", value: "PURCHASE" },
  { label: "Adjustments", value: "ADJUSTMENT" },
  { label: "Returns", value: "RETURN" },
  { label: "Billing", value: "BILLING" },
];

function getMovementType(
  row: StockHistoryItem
): Exclude<MovementType, "ALL"> {
  const changeType = row.changeType.toUpperCase();
  const reason = row.reason?.toUpperCase();

  if (
    changeType === "BILLING" ||
    reason === "BILLING"
  ) {
    return "BILLING";
  }

  if (changeType === "SALE") return "SALE";

  if (
    changeType === "PURCHASE" ||
    reason === "PURCHASE"
  ) {
    return "PURCHASE";
  }

  if (
    changeType === "RETURN" ||
    reason === "RETURN"
  ) {
    return "RETURN";
  }

  return "ADJUSTMENT";
}

function getProductName(row: StockHistoryItem) {
  return `${row.brand ?? ""} ${row.model ?? ""}`.trim() ||
    "Unnamed product";
}

function isToday(createdAt: string) {
  const date = new Date(createdAt);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function formatDate(createdAt: string) {
  const date = new Date(createdAt);

  return {
    date: new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date),
  };
}

export default function StockHistory() {
  const [history, setHistory] = useState<
    StockHistoryItem[]
  >([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<MovementType>("ALL");

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => subscribeToBillingDataChanges(() => { void loadHistory(); }), []);

  async function loadHistory() {
    try {
      const data =
        await window.inventory.getStockHistory();

      setHistory(data);
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to load stock history."
      );
    }
  }

  const filteredHistory = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return history.filter((row) => {
      const movementType = getMovementType(row);
      const matchesFilter =
        activeFilter === "ALL" ||
        movementType === activeFilter;
      const searchableText = [
        row.itemCode,
        getProductName(row),
        row.reason ?? "",
        row.remarks ?? "",
        row.referenceNumber ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesFilter &&
        (keyword === "" ||
          searchableText.includes(keyword))
      );
    });
  }, [activeFilter, history, search]);

  const todayMovements = history.filter((row) =>
    isToday(row.createdAt)
  ).length;
  const saleEntries = history.filter(
    (row) => row.changeType.toUpperCase() === "SALE"
  ).length;
  const purchaseAdjustmentEntries = history.filter(
    (row) => {
      const movementType = getMovementType(row);

      return (
        movementType === "PURCHASE" ||
        movementType === "ADJUSTMENT"
      );
    }
  ).length;

  return (
    <section className="stock-history-page">
      <PageHeader eyebrow="Inventory control" title="Stock History" subtitle="Track every inventory movement, adjustment, purchase, and billing entry in one place." action={<span className="stock-history-header-icon"><ClipboardList size={26} /></span>} />

      <div className="stock-history-stats">
        <StatCard label="Total Stock Movements" value={history.length} icon={<Boxes size={21} />} />

        <StatCard label="Today's Movements" value={todayMovements} icon={<ClipboardList size={21} />} />

        <StatCard label="Total Sale Entries" value={saleEntries} icon={<ArrowDownRight size={21} />} />

        <StatCard label="Purchase / Adjustment Entries" value={purchaseAdjustmentEntries} icon={<ArrowUpRight size={21} />} />
      </div>

      <div className="stock-history-toolbar">
        <SearchBar className="stock-history-search" 
            placeholder="Search item code, product, reason or remarks..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch("")}
          />

        <div className="stock-history-filters" aria-label="Stock history filters">
          <SlidersHorizontal size={18} />
          <div className="stock-history-filter-list">
            {filters.map((filter) => (
              <button
                key={filter.value}
                className={
                  activeFilter === filter.value
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveFilter(filter.value)
                }
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card className="stock-history-table-card" padded={false}>
        <div className="stock-history-table-meta">
          <div>
            <h2>Movement Register</h2>
            <p>
              {filteredHistory.length} of {history.length} entries
            </p>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="stock-history-empty-state">
            <EmptyState
              icon={<PackageSearch size={42} />}
              title={
                history.length === 0
                  ? "No stock history yet"
                  : "No matching movements"
              }
              description={
                history.length === 0
                  ? "Stock movements will appear here as inventory is adjusted or billed."
                  : "Try changing the search term or movement filter."
              }
            />
          </div>
        ) : (
          <div className="stock-history-table-scroll">
            <Table className="stock-history-table">
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th className="numeric">Stock Movement</th>
                  <th className="numeric">Difference</th>
                  <th>Reason</th>
                  <th>Reference</th>
                  <th>Remarks</th>
                </tr>
              </thead>

              <tbody>
                {filteredHistory.map((row) => {
                  const formattedDate = formatDate(
                    row.createdAt
                  );
                  const movementType = getMovementType(row);

                  return (
                    <tr key={row.id}>
                      <td>
                        <div className="stock-history-date">
                          <strong>{formattedDate.date}</strong>
                          <span>{formattedDate.time}</span>
                        </div>
                      </td>
                      <td>
                        <div className="stock-history-product">
                          <strong>{getProductName(row)}</strong>
                          <span>{row.itemCode}</span>
                        </div>
                      </td>
                      <td>
                        <Badge className={`stock-history-type-badge ${movementType.toLowerCase()}`} variant={movementType === "SALE" ? "danger" : movementType === "PURCHASE" ? "success" : "info"}>
                          {movementType}
                        </Badge>
                      </td>
                      <td className="numeric">
                        <span className="stock-history-movement">
                          <span>{row.previousStock}</span>
                          <ArrowRight size={15} />
                          <strong>{row.newStock}</strong>
                        </span>
                      </td>
                      <td className="numeric">
                        <span
                          className={
                            row.difference >= 0
                              ? "stock-history-difference positive"
                              : "stock-history-difference negative"
                          }
                        >
                          {row.difference > 0 ? "+" : ""}
                          {row.difference}
                        </span>
                      </td>
                      <td>{row.reason ?? "—"}</td>
                      <td>{row.referenceNumber ?? "—"}</td>
                      <td className="stock-history-remarks">
                        {row.remarks ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Card>
    </section>
  );
}

import { useMemo } from "react";
import { CalendarClock, CircleAlert, ClipboardCheck } from "lucide-react";
import { Badge, Card, Input } from "../../../components/ui";
import type { AvailabilityDecision, AvailabilityEvaluation } from "../../../types/optical";
import type { Customer } from "../../../types/customer";
import type { BillingItem } from "../types/billing";
import { calculateBill } from "../utils/billingCalculator";
import { lensAvailabilityLabel, type LensSeriesOption } from "./LensSelector";

interface BookingSummaryProps {
  customer: Customer | null;
  workflowType: "RETAIL" | "PRESCRIPTION" | "REPAIR";
  items: BillingItem[];
  selectedLens: LensSeriesOption | null;
  availability: AvailabilityEvaluation | null;
  availabilityOverrideDecision?: AvailabilityDecision;
  availabilityOverrideReason: string;
  onAvailabilityOverrideDecision: (value?: AvailabilityDecision) => void;
  onAvailabilityOverrideReason: (value: string) => void;
  received: number;
  expectedDeliveryDate: string;
  expectedDeliveryTime: string;
  deliveryReason: string;
  onExpectedDeliveryDate: (value: string) => void;
  onExpectedDeliveryTime: (value: string) => void;
  onDeliveryReason: (value: string) => void;
}

function workflowLabel(workflowType: BookingSummaryProps["workflowType"]) {
  if (workflowType === "PRESCRIPTION") return "Prescription spectacles";
  if (workflowType === "REPAIR") return "Repair / service";
  return "Retail sale";
}

function money(value: number) {
  return `₹${value.toFixed(2)}`;
}

function SummaryItem({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="billing-booking-summary__item"><span>{label}</span><strong>{value}</strong>{detail ? <small>{detail}</small> : null}</div>;
}

export default function BookingSummary({ customer, workflowType, items, selectedLens, availability, availabilityOverrideDecision, availabilityOverrideReason, onAvailabilityOverrideDecision, onAvailabilityOverrideReason, received, expectedDeliveryDate, expectedDeliveryTime, deliveryReason, onExpectedDeliveryDate, onExpectedDeliveryTime, onDeliveryReason }: BookingSummaryProps) {
  const summary = useMemo(() => calculateBill(items, "amount", 0, "included", selectedLens ? [{ sellingPrice: selectedLens.defaultSellingPrice }] : []), [items, selectedLens]);
  const frame = items.find((row) => row.item.itemType === "Frame");
  const outstanding = Math.max(0, summary.grandTotal - received);
  const needsAttention = workflowType === "PRESCRIPTION" && (!frame || !selectedLens || !availability || !expectedDeliveryDate || (availability.decision === "REVIEW_REQUIRED" && !availabilityOverrideDecision));
  const displayedDecision = availabilityOverrideDecision ?? availability?.decision;

  return <Card className="billing-booking-summary">
    <header className="billing-booking-summary__heading"><div><p>Live booking</p><h2>Booking summary</h2></div><Badge variant={needsAttention ? "warning" : "neutral"}>{needsAttention ? "In progress" : "Draft"}</Badge></header>
    <div className="billing-booking-summary__grid">
      <SummaryItem label="Customer" value={customer?.name ?? "Customer pending"} detail={customer ? customer.customerCode : "Choose or create a customer"} />
      <SummaryItem label="Workflow" value={workflowLabel(workflowType)} />
      <SummaryItem label="Frame" value={frame ? `${frame.item.brand ?? ""} ${frame.item.model ?? ""}`.trim() || frame.item.itemCode : "Frame pending"} detail={frame ? `${Math.max(0, frame.item.currentStock - frame.item.reservedStock)} available` : workflowType === "PRESCRIPTION" ? "Required for optical jobs" : "Optional for this workflow"} />
      <SummaryItem label="Lens" value={selectedLens ? `${selectedLens.brand} ${selectedLens.series}` : "Lens pending"} detail={selectedLens ? selectedLens.lensIndex ? `Index ${selectedLens.lensIndex}` : "Index not configured" : workflowType === "PRESCRIPTION" ? "Required for optical jobs" : "Not required"} />
      <SummaryItem label="Availability" value={displayedDecision ? lensAvailabilityLabel(displayedDecision) : "Not assessed"} detail={availability?.explanation ?? "Select a lens to assess"} />
      <SummaryItem label="Expected delivery" value={expectedDeliveryDate ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${expectedDeliveryDate}T00:00:00`)) : "Not scheduled"} detail={expectedDeliveryTime || (availability ? availability.deliveryState.toLowerCase() : "Select a date")} />
      <SummaryItem label="Advance" value={money(received)} />
      <SummaryItem label="Outstanding" value={money(outstanding)} />
      <SummaryItem label="Payment status" value={received <= 0 ? "Pending" : outstanding > 0 ? "Partial" : "Paid"} />
    </div>
    {workflowType === "PRESCRIPTION" ? <div className="billing-booking-summary__override"><strong>Expected delivery *</strong><div className="billing-booking-summary__delivery-fields"><Input label="Date" type="date" value={expectedDeliveryDate} onChange={(event) => onExpectedDeliveryDate(event.target.value)} /><Input label="Time · optional" type="time" value={expectedDeliveryTime} onChange={(event) => onExpectedDeliveryTime(event.target.value)} /></div><Input label="Reason · optional" value={deliveryReason} onChange={(event) => onDeliveryReason(event.target.value)} placeholder="Customer request or delivery note" /></div> : null}
    {workflowType === "PRESCRIPTION" && availability?.decision === "REVIEW_REQUIRED" ? <div className="billing-booking-summary__override"><strong>Documented availability override</strong><p>Profile review is required. Record the operational decision and reason before saving.</p><label className="kv-field"><span className="kv-field__label">Continue as</span><select value={availabilityOverrideDecision ?? ""} onChange={(event) => onAvailabilityOverrideDecision(event.target.value ? event.target.value as AvailabilityDecision : undefined)}><option value="">Select decision</option><option value="READY_STOCK">Ready stock</option><option value="RX">RX order</option></select></label><Input label="Override reason" value={availabilityOverrideReason} onChange={(event) => onAvailabilityOverrideReason(event.target.value)} placeholder="Why is this safe to proceed?" /></div> : null}
    <footer className={`billing-booking-summary__status ${needsAttention ? "is-pending" : ""}`}>{needsAttention ? <CircleAlert size={14} /> : <ClipboardCheck size={14} />}<span>{needsAttention ? "Complete the required optical selections before saving." : "Availability and delivery are calculated from the selected profile."}</span><CalendarClock size={14} aria-hidden="true" /></footer>
  </Card>;
}

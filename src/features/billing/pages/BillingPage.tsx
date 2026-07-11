import { useEffect, useState } from "react";
import "../styles/billing.css";
import { CustomerModal } from "../../customer";
import { Button } from "../../../components/ui";
import type { Customer } from "../../../types/customer";
import type { AvailabilityDecision, AvailabilityEvaluation } from "../../../types/optical";

import BillHeader from "../components/BillHeader";
import BillingProgressRibbon from "../components/BillingProgressRibbon";
import BookingSummary from "../components/BookingSummary";
import CustomerSelector from "../components/CustomerSelector";
import LensSelector, { type LensSeriesOption } from "../components/LensSelector";
import PaymentPanel from "../components/PaymentPanel";
import PrescriptionWorkspace, {
  emptyPrescriptionDraft,
  validatePrescriptionDraft,
  type PrescriptionDraft,
} from "../components/PrescriptionWorkspace";
import ProductTable from "../components/ProductTable";
import Totals from "../components/Totals";
import type { BillingItem } from "../types/billing";
import { saveBill } from "../utils/saveBill";

type WorkflowType = "RETAIL" | "PRESCRIPTION" | "REPAIR";

export default function Billing() {
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [workflowType, setWorkflowType] = useState<WorkflowType>("RETAIL");
  const [prescription, setPrescription] = useState<PrescriptionDraft>(
    emptyPrescriptionDraft,
  );
  const [selectedLens, setSelectedLens] = useState<LensSeriesOption | null>(
    null,
  );
  const [availability, setAvailability] = useState<AvailabilityEvaluation | null>(null);
  const [availabilityOverrideDecision, setAvailabilityOverrideDecision] = useState<AvailabilityDecision | undefined>();
  const [availabilityOverrideReason, setAvailabilityOverrideReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function handleSelectCustomer(customer: Customer) {
    setSelectedCustomer(customer);
    setPrescription(emptyPrescriptionDraft);
  }

  function handleClearCustomer() {
    setSelectedCustomer(null);
    setPrescription(emptyPrescriptionDraft);
  }

  async function handleSaveBill() {
    if (isSaving) return;
    console.log("[billing] Billing clicked", {
      workflowType,
      customerId: selectedCustomer?.id,
      itemCount: billingItems.length,
      receivedAmount,
      selectedLensId: selectedLens?.id,
      availabilityDecision: availability?.decision,
    });

    setIsSaving(true);
    const success = await saveBill(
      selectedCustomer,
      billingItems,
      paymentMethod,
      receivedAmount,
      workflowType,
      workflowType === "PRESCRIPTION" ? prescription : undefined,
      selectedLens,
      availability,
      availabilityOverrideDecision,
      availabilityOverrideReason,
    );

    setIsSaving(false);
    if (!success) return;

    setBillingItems([]);
    setSelectedCustomer(null);
    setPaymentMethod("Cash");
    setReceivedAmount(0);
    setPrescription(emptyPrescriptionDraft);
    setSelectedLens(null);
    setAvailability(null);
    setAvailabilityOverrideDecision(undefined);
    setAvailabilityOverrideReason("");
  }

  async function handleCreateCustomer(
    customer: Parameters<typeof window.customer.create>[0],
  ) {
    await window.customer.create(customer);
    const matches = await window.customer.search(customer.mobile);
    const created = matches.find((item) => item.mobile === customer.mobile);

    if (!created)
      throw new Error("Customer was created but could not be selected.");

    setSelectedCustomer(created);
  }

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const key = event.key.toLowerCase();

      if (event.ctrlKey && key === "n") {
        event.preventDefault();
        setCustomerModalOpen(true);
      }

      if (event.ctrlKey && key === "s") {
        event.preventDefault();
        void handleSaveBill();
      }

      if (event.ctrlKey && key === "p") {
        event.preventDefault();
        setWorkflowType("PRESCRIPTION");
      }

      if (event.ctrlKey && key === "f") {
        event.preventDefault();
        document
          .querySelector<HTMLInputElement>(
            ".billing-customer-selector__search input",
          )
          ?.focus();
      }

      if (event.key === "Escape") setCustomerModalOpen(false);
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  });

  useEffect(() => {
    if (workflowType !== "PRESCRIPTION" || !selectedLens) {
      setAvailability(null);
      return;
    }
    let active = true;
    void window.optical.evaluateAvailability({ lensSeriesId: selectedLens.id, prescription })
      .then((result) => {
        if (active) setAvailability(result);
      })
      .catch(() => {
        if (active) setAvailability(null);
      });
    return () => { active = false; };
  }, [prescription, selectedLens, workflowType]);

  return (
    <div className="billing-page">
      <div className="billing-page__content">
        <BillHeader />

        <div
          className="billing-workflow-switch"
          role="group"
          aria-label="Billing workflow"
        >
          <span>Workflow</span>
          {(["RETAIL", "PRESCRIPTION", "REPAIR"] as const).map((type) => (
            <Button
              key={type}
              variant={workflowType === type ? "primary" : "secondary"}
              size="sm"
              aria-pressed={workflowType === type}
              onClick={() => setWorkflowType(type)}
            >
              {type === "RETAIL"
                ? "Retail sale"
                : type === "PRESCRIPTION"
                  ? "Prescription spectacles"
                  : "Repair / service"}
            </Button>
          ))}
          <small>
            {workflowType === "RETAIL"
              ? "Invoice only"
              : workflowType === "PRESCRIPTION"
                ? "Invoice, optical job and lens fulfilment"
                : "Invoice and service job"}
          </small>
        </div>

        <BillingProgressRibbon
          workflowType={workflowType}
          state={{
            customer: Boolean(selectedCustomer),
            prescription: validatePrescriptionDraft(prescription) === null,
            frame: billingItems.length > 0,
            lens: Boolean(selectedLens),
            payment: receivedAmount > 0,
          }}
        />

        <CustomerSelector
          selectedCustomer={selectedCustomer}
          onSelectCustomer={handleSelectCustomer}
          onClearCustomer={handleClearCustomer}
          onNewCustomer={() => setCustomerModalOpen(true)}
        />

        <div className="billing-page__workspace">
          <div className="billing-page__entry">
            {workflowType === "PRESCRIPTION" ? (
              <PrescriptionWorkspace
                value={prescription}
                onChange={setPrescription}
              />
            ) : null}
            <div
              className={`billing-page__product-lens ${workflowType !== "PRESCRIPTION" ? "is-product-only" : ""}`}
            >
              <ProductTable
                items={billingItems}
                setItems={setBillingItems}
                workflowType={workflowType}
              />
              {workflowType === "PRESCRIPTION" ? (
                <LensSelector
                  selected={selectedLens}
                  prescription={prescription}
                  evaluation={availability}
                  onSelect={(lens) => {
                    setSelectedLens(lens);
                    setAvailabilityOverrideDecision(undefined);
                    setAvailabilityOverrideReason("");
                  }}
                />
              ) : null}
            </div>
          </div>

          <aside
            className="billing-page__summary"
            aria-label="Booking, totals and payment"
          >
            <BookingSummary
              customer={selectedCustomer}
              workflowType={workflowType}
              items={billingItems}
              selectedLens={selectedLens}
              availability={availability}
              availabilityOverrideDecision={availabilityOverrideDecision}
              availabilityOverrideReason={availabilityOverrideReason}
              onAvailabilityOverrideDecision={setAvailabilityOverrideDecision}
              onAvailabilityOverrideReason={setAvailabilityOverrideReason}
              received={receivedAmount}
            />
            <Totals items={billingItems} />
            <PaymentPanel
              items={billingItems}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              received={receivedAmount}
              setReceived={setReceivedAmount}
              onSave={handleSaveBill}
              isSaving={isSaving}
            />
          </aside>
        </div>
      </div>
      <CustomerModal
        open={customerModalOpen}
        mode="create"
        onClose={() => setCustomerModalOpen(false)}
        onSave={handleCreateCustomer}
      />
    </div>
  );
}

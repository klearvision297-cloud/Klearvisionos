import { useState } from "react";

import BillHeader from "./BillHeader";
import CustomerSelector from "./CustomerSelector";
import ProductTable, {
  BillingItem,
} from "./ProductTable";
import Totals from "./Totals";
import PaymentPanel from "./PaymentPanel";

import { saveBill } from "./saveBill";

import type { Customer } from "../../types/customer";

export default function Billing() {
  const [billingItems, setBillingItems] =
    useState<BillingItem[]>([]);

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [paymentMethod, setPaymentMethod] =
    useState("Cash");

  const [receivedAmount, setReceivedAmount] =
    useState(0);

  function handleSelectCustomer(
    customer: Customer
  ) {
    setSelectedCustomer(customer);
  }

  function handleClearCustomer() {
    setSelectedCustomer(null);
  }

  async function handleSaveBill() {
    const success = await saveBill(
      selectedCustomer,
      billingItems,
      paymentMethod,
      receivedAmount
    );

    if (!success) return;

    // Reset Billing Screen
    setBillingItems([]);
    setSelectedCustomer(null);
    setPaymentMethod("Cash");
    setReceivedAmount(0);
  }

  return (
    <div className="billing-page">
      <div className="billing-page__content">
        <BillHeader />

        <CustomerSelector
          selectedCustomer={selectedCustomer}
          onSelectCustomer={handleSelectCustomer}
          onClearCustomer={handleClearCustomer}
        />

        <div className="billing-page__workspace">
          <ProductTable
            items={billingItems}
            setItems={setBillingItems}
          />

          <aside className="billing-page__summary" aria-label="Bill totals and payment">
            <Totals items={billingItems} />

            <PaymentPanel
              items={billingItems}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              received={receivedAmount}
              setReceived={setReceivedAmount}
              onSave={handleSaveBill}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

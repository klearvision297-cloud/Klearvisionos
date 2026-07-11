import { Check } from "lucide-react";

export interface BillingProgressState {
  customer: boolean;
  prescription: boolean;
  frame: boolean;
  lens: boolean;
  payment: boolean;
}

interface BillingProgressRibbonProps {
  workflowType: "RETAIL" | "PRESCRIPTION" | "REPAIR";
  state: BillingProgressState;
}

export default function BillingProgressRibbon({ workflowType, state }: BillingProgressRibbonProps) {
  const steps = workflowType === "RETAIL"
    ? [{ label: "Customer", complete: state.customer }, { label: "Items", complete: state.frame }, { label: "Payment", complete: state.payment }, { label: "Save", complete: false }]
    : workflowType === "REPAIR"
      ? [{ label: "Customer", complete: state.customer }, { label: "Service", complete: state.frame }, { label: "Payment", complete: state.payment }, { label: "Save", complete: false }]
      : [{ label: "Customer", complete: state.customer }, { label: "Prescription", complete: state.prescription }, { label: "Frame", complete: state.frame }, { label: "Lens", complete: state.lens }, { label: "Payment", complete: state.payment }, { label: "Save", complete: false }];
  const activeIndex = steps.findIndex((step) => !step.complete);

  return <nav className="billing-progress" aria-label="Billing progress">
    {steps.map((step, index) => <div key={step.label} className={`billing-progress__step ${step.complete ? "is-complete" : ""} ${index === activeIndex ? "is-active" : ""}`}><span>{step.complete ? <Check size={13} /> : index + 1}</span><b>{step.label}</b></div>)}
  </nav>;
}

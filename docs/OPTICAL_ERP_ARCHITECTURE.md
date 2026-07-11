# Optical ERP Architecture

## Document roles

- **Invoices** are commercial documents.
- **Optical Jobs** are customer fulfilment documents for prescription spectacles.
- **Service Jobs** are operational documents for repairs and services.
- **Lab Orders** are manufacturing documents sent to optical labs.
- **Purchases** are procurement documents for stocked goods and supplier liabilities.

Retail sales never create an Optical Job. Prescription spectacle invoices create one Optical Job. Repair work creates a Service Job.

## Workflow

```text
Prescription spectacle invoice
  -> Optical Job
  -> Availability Profile evaluation
  -> Ready-stock allocation OR Lab Order
  -> Fitting -> QC -> Ready for delivery -> Delivered -> Closed
```

The Job keeps its own timeline and status. The invoice retains price and payment responsibility. A lab order stores manufacturing instructions only and must never expose invoice values or payment information.

## Core data rules

- Prescriptions are versioned and never overwritten.
- Lens catalogues are master data, never general inventory.
- Stocked frames are reserved by an Optical Job; available stock is current stock less reservations.
- Customer-specific RX lens receipts are assigned to the job rather than saleable stock.
- Availability Profiles are configuration data. They evaluate lens series and prescription parameters and return `READY_STOCK`, `RX`, or `REVIEW_REQUIRED`; application code must not hardcode lens ranges.
- Manual decisions require an override reason and audit timestamp.

## Statuses

Optical Job: `CONFIRMED`, `WAITING_FOR_LENS`, `READY_FOR_FITTING`, `FITTING`, `QUALITY_CHECK`, `READY_FOR_DELIVERY`, `DELIVERED`, `CLOSED`, plus exception statuses `ON_HOLD`, `CANCELLED`, `REMAKE`.

Lab Order: `PENDING`, `DISPATCHED`, `ACCEPTED`, `MANUFACTURING`, `READY`, `RECEIVED`, `CANCELLED`, `REJECTED`.

## Layering

All persistent operations follow:

```text
Repository -> Service -> IPC -> Preload -> React
```

React invokes no database or Electron APIs directly. Repositories own SQL, services own validation and business workflow, IPC exposes services, and preload exposes typed, narrow renderer APIs.

## Future boundaries

Suppliers may have multiple capabilities, jobs and inventory records are branch-ready, lab orders may be grouped by supplier dispatch, and communications are emitted as notifications so WhatsApp, SMS, email, QR, barcode, analytics, appointments, warranty and remake features can attach without changing document ownership.

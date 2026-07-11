import { OpticalRepository } from "../repositories/OpticalRepository";
import type {
  AvailabilityConditionField,
  AvailabilityDecision,
  AvailabilityEvaluation,
  AvailabilityProfileRules,
  BulkUpdateOpticalJobsDTO,
  CreateAvailabilityProfileDTO,
  CreateLensSeriesDTO,
  CreateOpticalJobDTO,
  DeliveryState,
  DispatchLabOrdersDTO,
  EvaluateAvailabilityDTO,
  JobPriority,
  LensSeries,
  LensSeriesQuery,
  OpticalLabJobQuery,
  OpticalJob,
  OpticalJobDetail,
  OpticalJobQuery,
  OpticalJobStatus,
  PrescriptionForAvailability,
  ReceiveLabOrderDTO,
  UpdateOpticalJobDTO,
} from "../types/optical";

const validDecisions: AvailabilityDecision[] = ["READY_STOCK", "RX", "REVIEW_REQUIRED"];
const validConditionFields: AvailabilityConditionField[] = [
  "rightSphere",
  "rightCylinder",
  "rightAxis",
  "rightAdd",
  "rightPD",
  "rightHeight",
  "rightPrism",
  "leftSphere",
  "leftCylinder",
  "leftAxis",
  "leftAdd",
  "leftPD",
  "leftHeight",
  "leftPrism",
];
const validPriorities: JobPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];
const jobTransitions: Record<OpticalJobStatus, OpticalJobStatus[]> = {
  CONFIRMED: ["LAB_PENDING", "READY_FOR_FITTING", "ON_HOLD", "CANCELLED"],
  LAB_PENDING: ["DISPATCHED", "ON_HOLD", "REMAKE", "CANCELLED"],
  DISPATCHED: ["RECEIVED", "ON_HOLD", "REMAKE"],
  RECEIVED: ["READY_FOR_FITTING", "FITTING", "ON_HOLD", "REMAKE"],
  READY_FOR_FITTING: ["FITTING", "ON_HOLD", "CANCELLED", "REMAKE"],
  FITTING: ["QUALITY_CHECK", "ON_HOLD", "REMAKE"],
  QUALITY_CHECK: ["READY_FOR_DELIVERY", "FITTING", "REMAKE", "ON_HOLD"],
  READY_FOR_DELIVERY: ["DELIVERED", "ON_HOLD"],
  DELIVERED: ["CLOSED", "REMAKE"],
  CLOSED: [],
  ON_HOLD: ["LAB_PENDING", "READY_FOR_FITTING", "FITTING", "CANCELLED", "REMAKE"],
  CANCELLED: [],
  REMAKE: ["DISPATCHED", "LAB_PENDING", "READY_FOR_FITTING", "ON_HOLD"],
};

function dateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addBusinessDays(days: number) {
  const target = new Date();
  let remaining = Math.max(0, days);
  while (remaining > 0) {
    target.setDate(target.getDate() + 1);
    const weekday = target.getDay();
    if (weekday !== 0 && weekday !== 6) remaining -= 1;
  }
  return dateOnly(target);
}

function numericValue(value: string | undefined) {
  if (!value?.trim()) return undefined;
  if (value.trim().toLowerCase() === "plano") return 0;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function statusLabel(status: string) {
  return status.toLowerCase().replaceAll("_", " ");
}

export class OpticalService {
  private repository = new OpticalRepository();

  getLensSeries(query?: LensSeriesQuery) {
    return this.repository.getLensSeries(query);
  }

  createLensSeries(data: CreateLensSeriesDTO) {
    this.validateLensSeries(data);
    return this.repository.createLensSeries(data);
  }

  updateLensSeries(id: number, data: CreateLensSeriesDTO) {
    if (!this.repository.findLensSeries(id)) throw new Error("Lens series not found.");
    this.validateLensSeries(data);
    return this.repository.updateLensSeries(id, data);
  }

  duplicateLensSeries(id: number) {
    const source = this.repository.findLensSeries(id);
    if (!source) throw new Error("Lens series not found.");
    let suffix = 1;
    let duplicate: LensSeries | undefined;
    do {
      const series = suffix === 1 ? `${source.series} Copy` : `${source.series} Copy ${suffix}`;
      try {
        duplicate = this.repository.duplicateLensSeries(id, series);
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes("UNIQUE")) throw error;
        suffix += 1;
      }
    } while (!duplicate);
    return duplicate;
  }

  setLensSeriesActive(id: number, isActive: boolean) {
    if (!this.repository.findLensSeries(id)) throw new Error("Lens series not found.");
    this.repository.setLensSeriesActive(id, isActive);
    return { success: true };
  }

  getAvailabilityProfiles(includeInactive?: boolean) {
    return this.repository.getAvailabilityProfiles(includeInactive);
  }

  createAvailabilityProfile(data: CreateAvailabilityProfileDTO) {
    this.validateAvailabilityProfile(data);
    return this.repository.createAvailabilityProfile(data);
  }

  updateAvailabilityProfile(id: number, data: CreateAvailabilityProfileDTO) {
    this.validateAvailabilityProfile(data);
    this.repository.updateAvailabilityProfile(id, data);
    return { success: true };
  }

  deleteAvailabilityProfile(id: number) {
    if (this.repository.countLensSeriesForProfile(id) > 0) {
      throw new Error("Reassign or deactivate lens series before deleting this availability profile.");
    }
    this.repository.deleteAvailabilityProfile(id);
    return { success: true };
  }

  evaluateAvailability(data: EvaluateAvailabilityDTO): AvailabilityEvaluation {
    const lens = this.repository.findLensSeries(data.lensSeriesId);
    if (!lens || !lens.isActive) {
      return {
        decision: "REVIEW_REQUIRED",
        explanation: "The selected lens series is unavailable or inactive.",
        deliveryState: "DELAYED",
      };
    }

    if (!lens.rulesJson || !lens.availabilityProfileName) {
      return {
        decision: "REVIEW_REQUIRED",
        explanation: "Assign an active availability profile before confirming this lens.",
        deliveryState: "DELAYED",
      };
    }

    let rules: AvailabilityProfileRules;
    try {
      rules = JSON.parse(lens.rulesJson) as AvailabilityProfileRules;
    } catch {
      return {
        decision: "REVIEW_REQUIRED",
        explanation: "The availability profile configuration is invalid.",
        availabilityProfileName: lens.availabilityProfileName,
        deliveryState: "DELAYED",
      };
    }

    const matchingRule = rules.rules.find((rule) =>
      rule.conditions.every((condition) => {
        const value = data.prescription?.[condition.field];
        if (condition.operator === "PRESENT") return Boolean(value?.trim());
        if (condition.operator === "ABSENT") return !value?.trim();
        const numeric = numericValue(value);
        if (numeric === undefined) return false;
        return (condition.minimum === undefined || numeric >= condition.minimum)
          && (condition.maximum === undefined || numeric <= condition.maximum);
      }),
    );
    const decision = matchingRule?.decision ?? rules.defaultDecision;
    const explanation = matchingRule
      ? `${lens.availabilityProfileName} matched a configured prescription rule.`
      : `${lens.availabilityProfileName} used its configured default outcome.`;
    const estimate = this.getExpectedDelivery(decision, lens);

    return {
      decision,
      explanation,
      availabilityProfileName: lens.availabilityProfileName,
      expectedDeliveryDate: estimate,
      deliveryState: decision === "READY_STOCK" ? "READY" : decision === "RX" ? "EXPECTED" : "DELAYED",
    };
  }

  createJob(data: CreateOpticalJobDTO) {
    if (data.workflowType === "PRESCRIPTION" && !data.prescriptionId) {
      throw new Error("A saved prescription is required for a prescription spectacle job.");
    }
    if (data.workflowType === "PRESCRIPTION" && !data.lensSeriesId) {
      throw new Error("A lens series is required for a prescription spectacle job.");
    }

    const evaluation: AvailabilityEvaluation = data.lensSeriesId
      ? this.evaluateAvailability({ lensSeriesId: data.lensSeriesId, prescription: data.prescription })
      : {
          decision: "REVIEW_REQUIRED" as const,
          explanation: "Repair jobs do not use an availability profile.",
          expectedDeliveryDate: undefined,
          deliveryState: "EXPECTED" as const,
        };
    const override = data.availabilityOverrideDecision;
    if (override && !data.availabilityOverrideReason?.trim()) {
      throw new Error("A reason is required when overriding an availability decision.");
    }
    if (data.workflowType === "PRESCRIPTION" && evaluation.decision === "REVIEW_REQUIRED" && !override) {
      throw new Error("Lens availability requires a documented override before the job can be confirmed.");
    }
    const decision = override ?? evaluation.decision;
    const expectedDeliveryDate = evaluation.expectedDeliveryDate;
    const lens = data.lensSeriesId ? this.repository.findLensSeries(data.lensSeriesId) : undefined;
    if (data.workflowType === "PRESCRIPTION" && decision === "RX" && !lens?.supplierId) {
      throw new Error("The selected RX lens series does not have a preferred supplier.");
    }
    const job = this.repository.createJob(data, {
      decision,
      expectedDeliveryDate,
      supplierId: lens?.supplierId,
      availabilityProfileId: lens?.availabilityProfileId,
    });
    const performedBy = "Current User";

    this.repository.addTimelineEvent(job.id, "INVOICE_CREATED", "Invoice created and linked to the optical job.", performedBy);
    if (data.prescriptionId) {
      this.repository.addTimelineEvent(job.id, "PRESCRIPTION_SAVED", "Prescription snapshot saved for fulfilment.", performedBy);
    }
    if (data.lensSeriesId) {
      this.repository.addTimelineEvent(
        job.id,
        "LENS_SELECTED",
        `Lens selected: ${lens ? `${lens.brand} ${lens.series}` : "catalogue item"}.`,
        performedBy,
      );
    }
    if (data.frameInventoryId) {
      this.repository.reserveFrame(job.id, data.frameInventoryId);
      this.repository.addTimelineEvent(job.id, "FRAME_RESERVED", "Selected frame reserved for this job.", performedBy);
    }
    if (override && override !== evaluation.decision) {
      this.repository.createDecisionOverride(
        job.id,
        evaluation.decision,
        override,
        data.availabilityOverrideReason!.trim(),
        performedBy,
      );
      this.repository.addTimelineEvent(job.id, "AVAILABILITY_OVERRIDDEN", `Availability changed to ${statusLabel(override)}.`, performedBy, data.availabilityOverrideReason);
    }

    if (data.workflowType === "PRESCRIPTION" && decision === "RX") {
      const labOrder = this.repository.createLabOrder(job.id);
      this.repository.addTimelineEvent(job.id, "LAB_ORDER_CREATED", `Lab order ${labOrder.labOrderNumber} created.`, performedBy);
      this.repository.createNotification(
        job.id,
        "LAB_PENDING",
        "Lab order pending dispatch",
        `${job.jobNumber} is ready for lab dispatch.`,
        `lab-pending:${job.id}`,
      );
    }

    return { success: true, ...job, availabilityDecision: decision, availability: evaluation };
  }

  getJobs(query?: OpticalJobQuery) {
    const result = this.repository.getJobs(query);
    const items = result.items.map((job) => ({ ...job, deliveryState: this.getDeliveryState(job) }));
    for (const job of items.filter((item) => item.deliveryState === "OVERDUE")) {
      this.repository.createNotification(
        job.id,
        "OVERDUE_JOB",
        "Optical job overdue",
        `${job.jobNumber} was expected on ${job.promisedDeliveryDate ?? job.expectedDeliveryDate}.`,
        `overdue:${job.id}:${job.promisedDeliveryDate ?? job.expectedDeliveryDate}`,
      );
    }
    return { ...result, items };
  }

  getJobDetail(jobId: number): OpticalJobDetail {
    const job = this.repository.getJobDetail(jobId);
    if (!job) throw new Error("Optical job not found.");
    return {
      ...job,
      deliveryState: this.getDeliveryState(job),
      timeline: this.repository.getTimeline(jobId),
    };
  }

  updateJob(jobId: number, data: UpdateOpticalJobDTO) {
    const job = this.repository.getJobDetail(jobId);
    if (!job) throw new Error("Optical job not found.");
    const performedBy = data.performedBy?.trim() || "Current User";
    if (data.priority && !validPriorities.includes(data.priority)) throw new Error("Unsupported job priority.");
    if (data.promisedDeliveryDate && !data.deliveryOverrideReason?.trim() && !job.deliveryOverrideReason) {
      throw new Error("A reason is required when promising a delivery date.");
    }
    if (data.status && data.status !== job.status && !jobTransitions[job.status].includes(data.status)) {
      throw new Error(`Cannot move a ${statusLabel(job.status)} job directly to ${statusLabel(data.status)}.`);
    }
    this.repository.updateJob(jobId, data);
    if (data.priority && data.priority !== job.priority) {
      this.repository.addTimelineEvent(jobId, "PRIORITY_UPDATED", `Priority set to ${data.priority.toLowerCase()}.`, performedBy, data.notes);
    }
    if (data.promisedDeliveryDate) {
      this.repository.addTimelineEvent(jobId, "DELIVERY_PROMISED", `Promised delivery set to ${data.promisedDeliveryDate}.`, performedBy, data.deliveryOverrideReason ?? data.notes);
    }
    if (data.status && data.status !== job.status) {
      const event = this.eventForStatus(data.status);
      this.repository.addTimelineEvent(jobId, event, `Job marked ${statusLabel(data.status)}.`, performedBy, data.notes);
      if (data.status === "READY_FOR_DELIVERY") {
        this.repository.createNotification(jobId, "CUSTOMER_PICKUP", "Customer pickup ready", `${job.jobNumber} has passed QC and is ready for delivery.`, `pickup:${jobId}`);
      }
    }
    return { success: true };
  }

  bulkUpdateJobs(data: BulkUpdateOpticalJobsDTO) {
    if (!data.jobIds.length) throw new Error("Select at least one optical job.");
    for (const jobId of [...new Set(data.jobIds)]) {
      this.updateJob(jobId, { status: data.status, priority: data.priority, notes: data.notes, performedBy: data.performedBy });
    }
    return { success: true };
  }

  notifyCustomer(jobId: number, notes?: string) {
    const job = this.repository.getJobDetail(jobId);
    if (!job) throw new Error("Optical job not found.");
    this.repository.setCustomerNotified(jobId);
    this.repository.addTimelineEvent(jobId, "CUSTOMER_NOTIFIED", "Customer notification recorded.", "Current User", notes);
    return { success: true };
  }

  recordWarranty(jobId: number, warrantyUntil: string, notes?: string) {
    if (!warrantyUntil) throw new Error("Warranty end date is required.");
    if (!this.repository.getJobDetail(jobId)) throw new Error("Optical job not found.");
    this.repository.setWarranty(jobId, warrantyUntil, notes);
    this.repository.addTimelineEvent(jobId, "WARRANTY", `Warranty recorded through ${warrantyUntil}.`, "Current User", notes);
    return { success: true };
  }

  getLabJobs(query: OpticalLabJobQuery) {
    return this.repository.getLabJobs(query).map((job) => ({
      ...job,
      deliveryState: this.getDeliveryState(job),
    }));
  }

  dispatchLabJobs(data: DispatchLabOrdersDTO) {
    if (!data.jobIds.length) throw new Error("Select at least one optical job awaiting dispatch.");
    const jobs = data.jobIds.map((jobId) => this.repository.findLabJob(jobId));
    if (jobs.some((job) => !job || !["LAB_PENDING", "REMAKE"].includes(job.status))) {
      throw new Error("Only optical jobs awaiting dispatch can be dispatched.");
    }
    this.repository.dispatchLabJobs({ ...data, jobIds: [...new Set(data.jobIds)] });
    for (const job of jobs) {
      if (!job) continue;
      this.repository.addTimelineEvent(job.id, "DISPATCHED", `Lab order ${job.labOrderNumber} dispatched to ${job.supplierName ?? "the assigned supplier"}.`, data.performedBy ?? "Current User", data.remarks);
    }
    return { success: true };
  }

  receiveLabJob(jobId: number, data: ReceiveLabOrderDTO) {
    const job = this.repository.findLabJob(jobId);
    if (!job) throw new Error("Optical lab job not found.");
    if (job.status !== "DISPATCHED") {
      throw new Error("This optical job is not available for receiving.");
    }
    this.repository.receiveLabJob(jobId, data);
    const performedBy = data.performedBy ?? "Current User";
    if (data.inspection === "ACCEPT") {
      this.repository.addTimelineEvent(job.id, "RECEIVED", `Lab order ${job.labOrderNumber} received and accepted.`, performedBy, data.notes);
      this.repository.createNotification(job.id, "LENS_READY", "Lens ready for frame fitting", `${job.jobNumber} lenses have been accepted and are ready for fitting.`, `lens-ready:${job.id}`);
    }
    if (data.inspection === "REJECT") {
      this.repository.addTimelineEvent(job.id, "REJECTED", `Lab order ${job.labOrderNumber} was rejected during inspection.`, performedBy, data.notes);
      this.repository.createNotification(job.id, "LAB_DELAY", "Lab order needs attention", `${job.jobNumber} was rejected at receiving.`, `lab-rejected:${job.id}`);
    }
    if (data.inspection === "REMAKE") {
      this.repository.addTimelineEvent(job.id, "REMAKE", `Remake requested for ${job.labOrderNumber}; it returned to the dispatch queue.`, performedBy, data.notes);
      this.repository.createNotification(job.id, "LAB_DELAY", "Remake requested", `${job.jobNumber} requires a lab remake.`, `remake:${job.id}:${job.labOrderId}`);
    }
    return { success: true };
  }

  getNotifications() {
    return this.repository.getNotifications();
  }

  markNotificationRead(id: number) {
    this.repository.markNotificationRead(id);
    return { success: true };
  }

  search(query: string) {
    const trimmed = query.trim();
    return trimmed.length >= 2 ? this.repository.search(trimmed) : [];
  }

  private validateLensSeries(data: CreateLensSeriesDTO) {
    if (!data.brand.trim() || !data.series.trim()) throw new Error("Brand and series are required.");
    if (!Number.isFinite(data.defaultCost) || data.defaultCost < 0) throw new Error("Purchase cost must be zero or greater.");
    if (!Number.isFinite(data.defaultSellingPrice) || data.defaultSellingPrice < 0) throw new Error("Recommended selling price must be zero or greater.");
    if (!Number.isInteger(data.defaultTurnaroundDays) || data.defaultTurnaroundDays < 0) throw new Error("Turnaround must be a whole number of days.");
    if (data.warrantyMonths !== undefined && (!Number.isInteger(data.warrantyMonths) || data.warrantyMonths < 0)) {
      throw new Error("Warranty must be a whole number of months.");
    }
  }

  private validateAvailabilityProfile(data: CreateAvailabilityProfileDTO) {
    if (!data.name.trim()) throw new Error("Availability profile name is required.");
    if (!validDecisions.includes(data.rules.defaultDecision)) throw new Error("Select a valid default availability outcome.");
    for (const rule of data.rules.rules) {
      if (!validDecisions.includes(rule.decision)) throw new Error("Each profile rule needs a valid outcome.");
      if (!rule.conditions.length) throw new Error("Each profile rule needs at least one condition.");
      for (const condition of rule.conditions) {
        if (!validConditionFields.includes(condition.field)) throw new Error("Unsupported prescription field in availability profile.");
        if (!["BETWEEN", "PRESENT", "ABSENT"].includes(condition.operator)) throw new Error("Unsupported availability condition.");
        if (condition.operator === "BETWEEN") {
          if (condition.minimum === undefined && condition.maximum === undefined) {
            throw new Error("A range condition needs a minimum or maximum value.");
          }
          if (
            condition.minimum !== undefined
            && condition.maximum !== undefined
            && condition.minimum > condition.maximum
          ) {
            throw new Error("A profile range minimum cannot exceed its maximum.");
          }
        }
      }
    }
  }

  private getExpectedDelivery(decision: AvailabilityDecision, lens: LensSeries) {
    if (decision === "READY_STOCK") return dateOnly(new Date());
    if (decision !== "RX") return undefined;
    const turnaround = lens.defaultTurnaroundDays > 0
      ? lens.defaultTurnaroundDays
      : Number(lens.supplierTurnaroundDays ?? 0);
    return addBusinessDays(turnaround);
  }

  private getDeliveryState(job: Pick<OpticalJob, "status" | "expectedDeliveryDate" | "promisedDeliveryDate">): DeliveryState {
    if (["RECEIVED", "READY_FOR_FITTING", "FITTING", "QUALITY_CHECK", "READY_FOR_DELIVERY", "DELIVERED", "CLOSED"].includes(job.status)) return "READY";
    if (["ON_HOLD", "REMAKE"].includes(job.status)) return "DELAYED";
    const deliveryDate = job.promisedDeliveryDate ?? job.expectedDeliveryDate;
    if (deliveryDate && deliveryDate < dateOnly(new Date())) return "OVERDUE";
    return "EXPECTED";
  }

  private eventForStatus(status: OpticalJobStatus) {
    const events: Partial<Record<OpticalJobStatus, string>> = {
      FITTING: "FRAME_FITTED",
      READY_FOR_DELIVERY: "QC_PASSED",
      DELIVERED: "DELIVERED",
      REMAKE: "REMAKE",
    };
    return events[status] ?? "STATUS_UPDATED";
  }
}

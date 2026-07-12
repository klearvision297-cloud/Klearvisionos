import { OpticalRepository } from "../repositories/OpticalRepository";
import type {
  AvailabilityConditionField,
  AvailabilityDecision,
  AvailabilityEvaluation,
  AvailabilityProfileRules,
  BulkUpdateOpticalJobsDTO,
  CompleteQualityInspectionDTO,
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

  getLensCatalogueSummary() {
    return this.repository.getLensCatalogueSummary();
  }

  createLensSeries(data: CreateLensSeriesDTO) {
    this.validateLensSeries(data);
    try {
      return this.repository.createLensSeries(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE")) {
        throw new Error("A lens series with this brand and name already exists.");
      }
      throw error;
    }
  }

  updateLensSeries(id: number, data: CreateLensSeriesDTO) {
    if (!this.repository.findLensSeries(id)) throw new Error("Lens series not found.");
    this.validateLensSeries(data);
    try {
      return this.repository.updateLensSeries(id, data);
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE")) {
        throw new Error("A lens series with this brand and name already exists.");
      }
      throw error;
    }
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

  getBillableLens(id: number) {
    const lens = this.repository.findLensSeries(id);
    if (!lens || !lens.isActive) throw new Error("The selected lens is inactive or unavailable.");
    return lens;
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
    if (data.workflowType !== "PRESCRIPTION") {
      throw new Error("Repair jobs are created through the repair-job workflow.");
    }
    if (data.workflowType === "PRESCRIPTION" && !data.prescriptionId) {
      throw new Error("A saved prescription is required for a prescription spectacle job.");
    }
    if (data.workflowType === "PRESCRIPTION" && !data.lensSeriesId) {
      throw new Error("A lens series is required for a prescription spectacle job.");
    }
    if (data.workflowType === "PRESCRIPTION" && !data.expectedDeliveryDate) {
      throw new Error("Expected delivery date is required for prescription billing.");
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
    const expectedDeliveryDate = data.expectedDeliveryDate ?? evaluation.expectedDeliveryDate;
    const lens = data.lensSeriesId ? this.repository.findLensSeries(data.lensSeriesId) : undefined;
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
    if (data.expectedDeliveryDate) {
      this.repository.addTimelineEvent(
        job.id,
        "DELIVERY_SCHEDULED",
        `Expected delivery: ${data.expectedDeliveryDate}${data.expectedDeliveryTime ? ` ${data.expectedDeliveryTime}` : ""}.`,
        performedBy,
        data.deliveryReason,
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

  getDashboard() { return this.repository.getDashboard(); }
  getLabReceivingSummary() { return this.repository.getLabReceivingSummary(); }

  createRepairJob(data: import("../types/optical").CreateRepairJobDTO) {
    if (!data.customerId) throw new Error("Customer is required for a repair job.");
    if (!data.itemReceived.trim()) throw new Error("Item received is required.");
    if (!data.complaint.trim()) throw new Error("Complaint is required.");
    if (!Number.isFinite(data.charges) || data.charges < 0) throw new Error("Charges must be zero or greater.");
    return { success: true, ...this.repository.createRepairJob(data) };
  }

  getRepairJobs(search?: string) { return this.repository.getRepairJobs(search); }

  getRepairJob(id: number) {
    const job = this.repository.getRepairJob(id);
    if (!job) throw new Error("Repair job not found.");
    return job;
  }

  updateRepairJob(id: number, data: import("../types/optical").UpdateRepairJobDTO) {
    const job = this.repository.getRepairJob(id) as { status: import("../types/optical").RepairJobStatus } | undefined;
    if (!job) throw new Error("Repair job not found.");
    const next: Record<import("../types/optical").RepairJobStatus, import("../types/optical").RepairJobStatus[]> = { NEW: ["IN_PROGRESS"], IN_PROGRESS: ["READY"], READY: ["DELIVERED"], DELIVERED: [] };
    if (!next[job.status].includes(data.status)) throw new Error("Repair jobs must follow NEW → IN_PROGRESS → READY → DELIVERED.");
    this.repository.updateRepairJob(id, data.status);
    this.repository.addRepairTimelineEvent(id, "STATUS_UPDATED", `Repair job marked ${statusLabel(data.status)}.`, data.performedBy ?? "Current User", data.notes);
    return { success: true };
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
    const prescriptionTransitions: Partial<Record<OpticalJobStatus, OpticalJobStatus[]>> = { NEW: ["WAITING_FOR_LENS"], WAITING_FOR_LENS: ["READY_FOR_DISPATCH"], READY_FOR_DISPATCH: [] };
    if (data.status && data.status !== job.status && !(prescriptionTransitions[job.status] ?? []).includes(data.status)) {
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
    if (jobs.some((job) => !job || job.status !== "READY_FOR_DISPATCH")) {
      throw new Error("Only optical jobs awaiting dispatch can be dispatched.");
    }
    if (!data.assignedLab?.trim() && jobs.some((job) => !job?.assignedLab?.trim())) {
      throw new Error("Assign a lab before dispatching these optical jobs.");
    }
    this.repository.dispatchLabJobs({ ...data, jobIds: [...new Set(data.jobIds)] });
    for (const job of jobs) {
      if (!job) continue;
      const lab = data.assignedLab?.trim() || job.assignedLab?.trim() || "the assigned lab";
      this.repository.addTimelineEvent(job.id, "DISPATCHED", `Optical job dispatched to ${lab}.`, data.performedBy ?? "Current User", data.remarks);
    }
    return { success: true };
  }

  receiveLabJob(jobId: number, data: ReceiveLabOrderDTO) {
    const job = this.repository.findLabJob(jobId);
    if (!job) throw new Error("Optical lab job not found.");
    if (job.status !== "AT_LAB") {
      throw new Error("This optical job is not available for receiving.");
    }
    this.repository.receiveLabJob(jobId, data);
    const performedBy = data.performedBy ?? "Current User";
    this.repository.addTimelineEvent(job.id, "RECEIVED_FROM_LAB", `Optical job received from ${job.assignedLab ?? "the lab"}.`, performedBy, data.remarks);
    this.repository.addTimelineEvent(job.id, "QC_PENDING", "Quality inspection is pending.", performedBy);
    return { success: true };
  }

  completeQualityInspection(jobId: number, data: CompleteQualityInspectionDTO) {
    const job = this.repository.findLabJob(jobId);
    if (!job) throw new Error("Optical lab job not found.");
    if (job.status !== "QC_PENDING") throw new Error("This optical job is not awaiting quality inspection.");
    if (data.result === "FAIL" && !data.failureReason) throw new Error("A failure reason is required when QC fails.");
    if (!data.checklist || (data.result === "PASS" && Object.values(data.checklist).some((checked) => !checked))) {
      throw new Error("All inspection checklist items must pass before recording QC as passed.");
    }
    const performedBy = data.performedBy?.trim() || "Current User";
    this.repository.completeQualityInspection(jobId, data);
    if (data.result === "PASS") {
      this.repository.addTimelineEvent(jobId, "QC_PASSED", "Quality inspection passed; job is ready for delivery.", performedBy, data.remarks);
      this.repository.addTimelineEvent(jobId, "READY_FOR_DELIVERY", "Optical job marked ready for delivery.", performedBy);
      this.repository.createNotification(jobId, "CUSTOMER_PICKUP", "Customer pickup ready", `${job.jobNumber} has passed QC and is ready for delivery.`, `pickup:${jobId}`);
    } else {
      const reason = data.failureReason;
      if (!reason) throw new Error("A failure reason is required when QC fails.");
      this.repository.addTimelineEvent(jobId, "QC_FAILED", `Quality inspection failed: ${reason.replaceAll("_", " ").toLowerCase()}.`, performedBy, data.remarks);
    }
    return { success: true };
  }

  returnForRemake(jobId: number, performedBy?: string) {
    const job = this.repository.findLabJob(jobId);
    if (!job) throw new Error("Optical lab job not found.");
    if (job.status !== "REMAKE_REQUIRED") throw new Error("This optical job is not awaiting a remake return.");
    this.repository.returnForRemake(jobId);
    this.repository.addTimelineEvent(jobId, "RETURNED_FOR_REMAKE", "QC failure returned to the lab dispatch queue for remake.", performedBy?.trim() || "Current User", job.remakeReason ?? undefined);
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
    if (["RECEIVED", "QC_PENDING", "READY_FOR_FITTING", "FITTING", "QUALITY_CHECK", "READY_FOR_DELIVERY", "DELIVERED", "CLOSED"].includes(job.status)) return "READY";
    if (["ON_HOLD", "REMAKE", "REMAKE_REQUIRED"].includes(job.status)) return "DELAYED";
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

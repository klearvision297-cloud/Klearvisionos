export type OpticalWorkflowType = "RETAIL" | "PRESCRIPTION" | "REPAIR";
export type AvailabilityDecision = "READY_STOCK" | "RX" | "REVIEW_REQUIRED";
export type OpticalJobStatus =
  | "CONFIRMED"
  | "LAB_PENDING"
  | "DISPATCHED"
  | "RECEIVED"
  | "READY_FOR_FITTING"
  | "FITTING"
  | "QUALITY_CHECK"
  | "READY_FOR_DELIVERY"
  | "DELIVERED"
  | "CLOSED"
  | "ON_HOLD"
  | "CANCELLED"
  | "REMAKE";
export type JobPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type DeliveryState = "READY" | "EXPECTED" | "DELAYED" | "OVERDUE";

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PrescriptionSnapshotDTO {
  source: "IN_HOUSE" | "EXTERNAL_DOCTOR" | "IMPORTED" | "UPLOADED";
  rightHeight?: string;
  rightPrism?: string;
  leftHeight?: string;
  leftPrism?: string;
  distanceNotes?: string;
  nearNotes?: string;
  doctorNotes?: string;
  attachmentPath?: string;
}

export interface PrescriptionForAvailability {
  rightSphere?: string;
  rightCylinder?: string;
  rightAxis?: string;
  rightAdd?: string;
  rightPD?: string;
  rightHeight?: string;
  rightPrism?: string;
  leftSphere?: string;
  leftCylinder?: string;
  leftAxis?: string;
  leftAdd?: string;
  leftPD?: string;
  leftHeight?: string;
  leftPrism?: string;
}

export type AvailabilityConditionField = keyof PrescriptionForAvailability;
export type AvailabilityConditionOperator = "BETWEEN" | "PRESENT" | "ABSENT";

export interface AvailabilityProfileCondition {
  field: AvailabilityConditionField;
  operator: AvailabilityConditionOperator;
  minimum?: number;
  maximum?: number;
}

export interface AvailabilityProfileRule {
  decision: AvailabilityDecision;
  conditions: AvailabilityProfileCondition[];
}

export interface AvailabilityProfileRules {
  defaultDecision: AvailabilityDecision;
  rules: AvailabilityProfileRule[];
}

export interface CreateAvailabilityProfileDTO {
  name: string;
  description?: string;
  rules: AvailabilityProfileRules;
  isActive?: boolean;
}

export interface AvailabilityProfile extends Omit<CreateAvailabilityProfileDTO, "isActive"> {
  id: number;
  rulesJson: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lensSeriesCount?: number;
}

export interface LensFeatures {
  singleVision: boolean;
  bifocal: boolean;
  progressive: boolean;
  officeLens: boolean;
  blueCut: boolean;
  photochromic: boolean;
  polarized: boolean;
  transitions: boolean;
  aspheric: boolean;
  digital: boolean;
  scratchResistant: boolean;
  antiReflection: boolean;
  hydrophobic: boolean;
  uvProtection: boolean;
  tint: boolean;
  mirror: boolean;
}

export interface LensSeriesInput extends LensFeatures {
  brand: string;
  series: string;
  supplierId?: number;
  material?: string;
  lensIndex?: string;
  design?: string;
  coating?: string;
  availabilityProfileId?: number;
  defaultTurnaroundDays: number;
  defaultCost: number;
  defaultSellingPrice: number;
  warrantyMonths?: number;
  internalNotes?: string;
  isActive?: boolean;
}

export type CreateLensSeriesDTO = LensSeriesInput;

export interface LensSeries extends LensSeriesInput {
  id: number;
  isActive: boolean;
  supplierName?: string | null;
  supplierPhone?: string | null;
  supplierGstin?: string | null;
  supplierOutstanding?: number | null;
  supplierIsActive?: number | null;
  supplierTurnaroundDays?: number | null;
  availabilityProfileName?: string | null;
  rulesJson?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LensSeriesQuery {
  search?: string;
  status?: "ACTIVE" | "INACTIVE" | "ALL";
  supplierId?: number;
  availabilityProfileId?: number;
  sort?: "BRAND" | "SERIES" | "PRICE" | "UPDATED";
  page?: number;
  pageSize?: number;
}

export interface AvailabilityEvaluation {
  decision: AvailabilityDecision;
  explanation: string;
  availabilityProfileName?: string;
  expectedDeliveryDate?: string;
  deliveryState: DeliveryState;
}

export interface EvaluateAvailabilityDTO {
  lensSeriesId: number;
  prescription?: PrescriptionForAvailability;
}

export interface CreateOpticalJobDTO {
  orderId: number;
  customerId: number;
  prescriptionId?: number;
  prescriptionVersionId?: number;
  prescription?: PrescriptionForAvailability;
  frameInventoryId?: number;
  lensSeriesId?: number;
  workflowType: "PRESCRIPTION" | "REPAIR";
  availabilityOverrideDecision?: AvailabilityDecision;
  availabilityOverrideReason?: string;
}

export interface OpticalJob {
  id: number;
  jobNumber: string;
  orderId: number;
  orderNumber?: string;
  customerId: number;
  customerName?: string;
  customerPhone?: string;
  status: OpticalJobStatus;
  priority: JobPriority;
  workflowType: "PRESCRIPTION" | "REPAIR";
  availabilityDecision: AvailabilityDecision;
  availabilityProfileId?: number | null;
  availabilityProfileName?: string | null;
  lensBrand?: string | null;
  lensSeries?: string | null;
  supplierId?: number | null;
  supplierName?: string | null;
  labOrderId?: number | null;
  expectedDeliveryDate?: string | null;
  promisedDeliveryDate?: string | null;
  deliveryOverrideReason?: string | null;
  dispatchedAt?: string | null;
  courier?: string | null;
  trackingNumber?: string | null;
  dispatchRemarks?: string | null;
  receivedAt?: string | null;
  receivedBy?: string | null;
  inspectionStatus?: "ACCEPT" | "REJECT" | "REMAKE" | null;
  inspectionNotes?: string | null;
  rejectedReason?: string | null;
  remakeReason?: string | null;
  remakeCount?: number;
  deliveryState: DeliveryState;
  timelinePreview?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpticalJobQuery {
  search?: string;
  status?: OpticalJobStatus | "ALL";
  supplierId?: number;
  priority?: JobPriority | "ALL";
  deliveryState?: DeliveryState | "ALL";
  page?: number;
  pageSize?: number;
}

export interface JobTimelineEvent {
  id: number;
  jobId: number;
  eventType: string;
  description: string;
  performedBy: string;
  notes?: string | null;
  createdAt: string;
}

export interface OpticalJobDetail extends OpticalJob {
  frameDescription?: string | null;
  invoiceTotal?: number;
  advanceAmount?: number;
  outstandingAmount?: number;
  warrantyUntil?: string | null;
  warrantyNotes?: string | null;
  timeline: JobTimelineEvent[];
}

export interface UpdateOpticalJobDTO {
  status?: OpticalJobStatus;
  priority?: JobPriority;
  promisedDeliveryDate?: string;
  deliveryOverrideReason?: string;
  notes?: string;
  performedBy?: string;
}

export interface BulkUpdateOpticalJobsDTO {
  jobIds: number[];
  status?: OpticalJobStatus;
  priority?: JobPriority;
  notes?: string;
  performedBy?: string;
}

export interface OpticalLabJob extends OpticalJob {
  id: number;
  labOrderNumber: string;
  specialInstructions?: string | null;
}

export interface OpticalLabJobQuery {
  stage: "DISPATCH" | "RECEIVING";
  supplierId?: number;
  search?: string;
}

export interface DispatchLabOrdersDTO {
  jobIds: number[];
  dispatchDate?: string;
  courier?: string;
  trackingNumber?: string;
  remarks?: string;
  performedBy?: string;
}

export interface ReceiveLabOrderDTO {
  inspection: "ACCEPT" | "REJECT" | "REMAKE";
  notes?: string;
  performedBy?: string;
}

export interface NotificationItem {
  id: number;
  jobId: number;
  type: string;
  title: string;
  message: string;
  dueAt?: string;
  readAt?: string;
  createdAt: string;
}

export interface OpticalSearchResult {
  kind: "JOB" | "LENS" | "SUPPLIER" | "FRAME" | "INVOICE";
  id: number;
  title: string;
  subtitle: string;
  route: string;
}

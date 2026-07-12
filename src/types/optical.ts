export type OpticalWorkflowType = "RETAIL" | "PRESCRIPTION" | "REPAIR";
export type AvailabilityDecision = "READY_STOCK" | "RX" | "REVIEW_REQUIRED";
export type OpticalJobStatus =
  | "NEW"
  | "WAITING_FOR_LENS"
  | "READY_FOR_DISPATCH"
  | "AT_LAB"
  | "QC_PENDING"
  | "REMAKE_REQUIRED"
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
  category?: string;
  supplierId?: number;
  material?: string;
  lensIndex?: string;
  design?: string;
  coating?: string;
  tintName?: string;
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
  usageCount?: number;
  lastUsedAt?: string | null;
}

export interface LensSeriesQuery {
  search?: string;
  status?: "ACTIVE" | "INACTIVE" | "ALL";
  supplierId?: number;
  availabilityProfileId?: number;
  category?: string;
  brand?: string;
  recentlyUsed?: boolean;
  sort?: "BRAND" | "SERIES" | "PRICE" | "UPDATED" | "CREATED" | "RECENTLY_USED";
  page?: number;
  pageSize?: number;
}

export interface LensCatalogueSummary {
  activeCount: number;
  inactiveCount: number;
  mostUsedBrand: string | null;
  mostUsedSeries: string | null;
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
  expectedDeliveryDate?: string;
  expectedDeliveryTime?: string;
  deliveryReason?: string;
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
  assignedLab?: string | null;
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
  frameDescription?: string | null;
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

export type RepairJobStatus = "NEW" | "IN_PROGRESS" | "READY" | "DELIVERED";

export interface RepairJob {
  id: number;
  jobNumber: string;
  customerId: number;
  customerName: string;
  customerPhone?: string | null;
  itemReceived: string;
  complaint: string;
  charges: number;
  status: RepairJobStatus;
  createdAt: string;
  updatedAt: string;
  timelinePreview?: string | null;
}

export interface CreateRepairJobDTO {
  customerId: number;
  itemReceived: string;
  complaint: string;
  charges: number;
}

export interface UpdateRepairJobDTO {
  status: RepairJobStatus;
  notes?: string;
  performedBy?: string;
}

export interface OpticalJobDashboard {
  incompletePrescriptionJobs: number;
  incompleteRepairJobs: number;
  waitingForLens: number;
  waitingAtLab: number;
  readyForDelivery: number;
}

export interface LabReceivingSummary {
  waitingAtLab: number;
  receivedToday: number;
  qcPending: number;
  remakeRequired: number;
  readyForDelivery: number;
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
  prescriptionSummary?: string | null;
}

export interface OpticalLabJobQuery {
  stage: "DISPATCH" | "RECEIVING";
  supplierId?: number;
  search?: string;
  status?: "AT_LAB" | "RECEIVED_TODAY" | "QC_PENDING" | "REMAKE_REQUIRED" | "READY_FOR_DELIVERY";
}

export interface DispatchLabOrdersDTO {
  jobIds: number[];
  assignedLab?: string;
  dispatchDate?: string;
  courier?: string;
  trackingNumber?: string;
  remarks?: string;
  performedBy?: string;
}

export interface ReceiveLabOrderDTO {
  remarks?: string;
  performedBy?: string;
}

export type QcFailureReason = "WRONG_POWER" | "WRONG_LENS" | "WRONG_FRAME" | "SCRATCHED_LENS" | "DAMAGED_FRAME" | "COATING_DEFECT" | "OTHER";

export interface CompleteQualityInspectionDTO {
  checklist: Record<string, boolean>;
  remarks?: string;
  result: "PASS" | "FAIL";
  failureReason?: QcFailureReason;
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

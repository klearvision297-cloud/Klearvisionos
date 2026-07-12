import { getDatabase } from "../database/db";
import type {
  AvailabilityProfile,
  AvailabilityProfileRules,
  BulkUpdateOpticalJobsDTO,
  CompleteQualityInspectionDTO,
  CreateAvailabilityProfileDTO,
  CreateLensSeriesDTO,
  CreateOpticalJobDTO,
  DispatchLabOrdersDTO,
  JobTimelineEvent,
  LensFeatures,
  LensSeries,
  LensSeriesQuery,
  NotificationItem,
  OpticalJob,
  OpticalJobDetail,
  OpticalLabJob,
  OpticalLabJobQuery,
  OpticalJobQuery,
  OpticalJobStatus,
  OpticalSearchResult,
  PaginatedResult,
  ReceiveLabOrderDTO,
  UpdateOpticalJobDTO,
} from "../types/optical";

type DbLensSeries = Omit<LensSeries, keyof LensFeatures | "isActive"> &
  Record<keyof LensFeatures, number> & { isActive: number };
type DbAvailabilityProfile = Omit<AvailabilityProfile, "isActive" | "rules"> & {
  isActive: number;
};
type JobRow = OpticalJob & { deliveryState?: OpticalJob["deliveryState"] };

const lensFeatureColumns: (keyof LensFeatures)[] = [
  "singleVision",
  "bifocal",
  "progressive",
  "officeLens",
  "blueCut",
  "photochromic",
  "polarized",
  "transitions",
  "aspheric",
  "digital",
  "scratchResistant",
  "antiReflection",
  "hydrophobic",
  "uvProtection",
  "tint",
  "mirror",
];

function toLensSeries(row: DbLensSeries): LensSeries {
  const features = lensFeatureColumns.reduce(
    (value, feature) => ({ ...value, [feature]: Boolean(row[feature]) }),
    {} as LensFeatures,
  );

  return { ...row, ...features, isActive: Boolean(row.isActive) };
}

function parseRules(rulesJson: string): AvailabilityProfileRules {
  try {
    return JSON.parse(rulesJson) as AvailabilityProfileRules;
  } catch {
    return { defaultDecision: "REVIEW_REQUIRED", rules: [] };
  }
}

export class OpticalRepository {
  private db = getDatabase();

  generateJobNumber() {
    const year = new Date().getFullYear();
    const prefix = `JOB-${year}-`;
    const last = this.db
      .prepare(
        "SELECT jobNumber FROM optical_jobs WHERE jobNumber LIKE ? ORDER BY jobNumber DESC LIMIT 1",
      )
      .get(`${prefix}%`) as { jobNumber: string } | undefined;
    const sequence = last ? Number(last.jobNumber.slice(-6)) + 1 : 1;
    return `${prefix}${sequence.toString().padStart(6, "0")}`;
  }

  getLensSeries(query: LensSeriesQuery = {}): PaginatedResult<LensSeries> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 50));
    const clauses: string[] = [];
    const values: unknown[] = [];

    if (query.status === "ACTIVE") clauses.push("ls.isActive = 1");
    if (query.status === "INACTIVE") clauses.push("ls.isActive = 0");
    if (query.supplierId) {
      clauses.push("ls.supplierId = ?");
      values.push(query.supplierId);
    }
    if (query.availabilityProfileId) {
      clauses.push("ls.availabilityProfileId = ?");
      values.push(query.availabilityProfileId);
    }
    if (query.category?.trim()) {
      clauses.push("ls.category = ?");
      values.push(query.category.trim());
    }
    if (query.brand?.trim()) {
      clauses.push("ls.brand = ?");
      values.push(query.brand.trim());
    }
    if (query.search?.trim()) {
      const value = `%${query.search.trim()}%`;
      clauses.push("(ls.brand LIKE ? OR ls.series LIKE ? OR ls.category LIKE ? OR ls.material LIKE ? OR ls.coating LIKE ? OR ls.lensIndex LIKE ? OR s.supplierName LIKE ?)");
      values.push(value, value, value, value, value, value, value);
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const orderBy = {
      BRAND: "ls.brand COLLATE NOCASE, ls.series COLLATE NOCASE",
      SERIES: "ls.series COLLATE NOCASE, ls.brand COLLATE NOCASE",
      PRICE: "ls.defaultSellingPrice DESC, ls.brand COLLATE NOCASE",
      UPDATED: "ls.updatedAt DESC",
      CREATED: "ls.createdAt DESC",
      RECENTLY_USED: "usageCount = 0, lastUsedAt DESC, ls.updatedAt DESC",
    }[query.recentlyUsed ? "RECENTLY_USED" : query.sort ?? "BRAND"];

    const count = this.db
      .prepare(`SELECT COUNT(*) AS total FROM lens_series ls LEFT JOIN suppliers s ON s.id = ls.supplierId ${where}`)
      .get(...values) as { total: number };
    const rows = this.db
      .prepare(`
        SELECT ls.*, s.supplierName, s.phone AS supplierPhone, s.gstin AS supplierGstin,
          s.outstandingBalance AS supplierOutstanding, s.isActive AS supplierIsActive,
          s.turnaroundDays AS supplierTurnaroundDays, sap.name AS availabilityProfileName,
          sap.rulesJson,
          (SELECT COUNT(*) FROM order_items oi WHERE oi.lensSeriesId = ls.id) AS usageCount,
          (SELECT MAX(o.orderDate) FROM order_items oi JOIN orders o ON o.id = oi.orderId WHERE oi.lensSeriesId = ls.id) AS lastUsedAt
        FROM lens_series ls
        LEFT JOIN suppliers s ON s.id = ls.supplierId
        LEFT JOIN stock_availability_profiles sap ON sap.id = ls.availabilityProfileId
        ${where}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `)
      .all(...values, pageSize, (page - 1) * pageSize) as DbLensSeries[];

    return { items: rows.map(toLensSeries), total: count.total, page, pageSize };
  }

  findLensSeries(id: number): LensSeries | undefined {
    const row = this.db
      .prepare(`
        SELECT ls.*, s.supplierName, s.phone AS supplierPhone, s.gstin AS supplierGstin,
          s.outstandingBalance AS supplierOutstanding, s.isActive AS supplierIsActive,
          s.turnaroundDays AS supplierTurnaroundDays, sap.name AS availabilityProfileName,
          sap.rulesJson
        FROM lens_series ls
        LEFT JOIN suppliers s ON s.id = ls.supplierId
        LEFT JOIN stock_availability_profiles sap ON sap.id = ls.availabilityProfileId
        WHERE ls.id = ?
      `)
      .get(id) as DbLensSeries | undefined;
    return row ? toLensSeries(row) : undefined;
  }

  createLensSeries(data: CreateLensSeriesDTO) {
    const now = new Date().toISOString();
    const result = this.db
      .prepare(`
        INSERT INTO lens_series (
          brand, series, category, supplierId, material, lensIndex, design, coating, tintName, availabilityProfileId,
          defaultCost, defaultSellingPrice, warrantyMonths, defaultTurnaroundDays, internalNotes,
          singleVision, bifocal, progressive, officeLens, blueCut, photochromic, polarized,
          transitions, aspheric, digital, scratchResistant, antiReflection, hydrophobic,
          uvProtection, tint, mirror, isActive, createdAt, updatedAt
        ) VALUES (
          @brand, @series, @category, @supplierId, @material, @lensIndex, @design, @coating, @tintName, @availabilityProfileId,
          @defaultCost, @defaultSellingPrice, @warrantyMonths, @defaultTurnaroundDays, @internalNotes,
          @singleVision, @bifocal, @progressive, @officeLens, @blueCut, @photochromic, @polarized,
          @transitions, @aspheric, @digital, @scratchResistant, @antiReflection, @hydrophobic,
          @uvProtection, @tint, @mirror, @isActive, @createdAt, @updatedAt
        )
      `)
      .run(this.toLensRow(data, now)) as { lastInsertRowid: number | bigint };
    const id = Number(result.lastInsertRowid);
    this.syncPreferredSupplier(id, data.supplierId, now);
    return this.findLensSeries(id)!;
  }

  updateLensSeries(id: number, data: CreateLensSeriesDTO) {
    const now = new Date().toISOString();
    this.db
      .prepare(`
        UPDATE lens_series SET
          brand=@brand, series=@series, category=@category, supplierId=@supplierId, material=@material, lensIndex=@lensIndex,
          design=@design, coating=@coating, tintName=@tintName, availabilityProfileId=@availabilityProfileId,
          defaultCost=@defaultCost, defaultSellingPrice=@defaultSellingPrice,
          warrantyMonths=@warrantyMonths, defaultTurnaroundDays=@defaultTurnaroundDays,
          internalNotes=@internalNotes, singleVision=@singleVision, bifocal=@bifocal,
          progressive=@progressive, officeLens=@officeLens, blueCut=@blueCut,
          photochromic=@photochromic, polarized=@polarized, transitions=@transitions,
          aspheric=@aspheric, digital=@digital, scratchResistant=@scratchResistant,
          antiReflection=@antiReflection, hydrophobic=@hydrophobic, uvProtection=@uvProtection,
          tint=@tint, mirror=@mirror, isActive=@isActive, updatedAt=@updatedAt
        WHERE id=@id
      `)
      .run({ id, ...this.toLensRow(data, now) });
    this.syncPreferredSupplier(id, data.supplierId, now);
    return this.findLensSeries(id)!;
  }

  duplicateLensSeries(id: number, series: string) {
    const source = this.findLensSeries(id);
    if (!source) throw new Error("Lens series not found.");
    return this.createLensSeries({ ...source, series, isActive: true });
  }

  setLensSeriesActive(id: number, isActive: boolean) {
    this.db
      .prepare("UPDATE lens_series SET isActive = ?, updatedAt = ? WHERE id = ?")
      .run(isActive ? 1 : 0, new Date().toISOString(), id);
  }

  generateRepairJobNumber() {
    const year = new Date().getFullYear();
    const prefix = `REP-${year}-`;
    const last = this.db.prepare("SELECT jobNumber FROM repair_jobs WHERE jobNumber LIKE ? ORDER BY jobNumber DESC LIMIT 1").get(`${prefix}%`) as { jobNumber: string } | undefined;
    const sequence = last ? Number(last.jobNumber.slice(-6)) + 1 : 1;
    return `${prefix}${sequence.toString().padStart(6, "0")}`;
  }

  getLensCatalogueSummary() {
    const counts = this.db.prepare(`
      SELECT
        SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) AS activeCount,
        SUM(CASE WHEN isActive = 0 THEN 1 ELSE 0 END) AS inactiveCount
      FROM lens_series
    `).get() as { activeCount: number | null; inactiveCount: number | null };
    const mostUsed = this.db.prepare(`
      SELECT ls.brand, ls.series
      FROM lens_series ls
      LEFT JOIN order_items oi ON oi.lensSeriesId = ls.id
      GROUP BY ls.id
      ORDER BY COUNT(oi.id) DESC, MAX(oi.createdAt) DESC, ls.brand COLLATE NOCASE, ls.series COLLATE NOCASE
      LIMIT 1
    `).get() as { brand: string; series: string } | undefined;
    return {
      activeCount: counts.activeCount ?? 0,
      inactiveCount: counts.inactiveCount ?? 0,
      mostUsedBrand: mostUsed?.brand ?? null,
      mostUsedSeries: mostUsed ? `${mostUsed.brand} ${mostUsed.series}` : null,
    };
  }

  getAvailabilityProfiles(includeInactive = true): AvailabilityProfile[] {
    const rows = this.db
      .prepare(`
        SELECT sap.*, COUNT(ls.id) AS lensSeriesCount
        FROM stock_availability_profiles sap
        LEFT JOIN lens_series ls ON ls.availabilityProfileId = sap.id
        ${includeInactive ? "" : "WHERE sap.isActive = 1"}
        GROUP BY sap.id
        ORDER BY sap.name COLLATE NOCASE
      `)
      .all() as DbAvailabilityProfile[];
    return rows.map((profile) => ({
      ...profile,
      isActive: Boolean(profile.isActive),
      rules: parseRules(profile.rulesJson),
    }));
  }

  createAvailabilityProfile(data: CreateAvailabilityProfileDTO) {
    const now = new Date().toISOString();
    const result = this.db
      .prepare(`
        INSERT INTO stock_availability_profiles (name, description, rulesJson, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        data.name.trim(),
        data.description?.trim() || null,
        JSON.stringify(data.rules),
        data.isActive === false ? 0 : 1,
        now,
        now,
      ) as { lastInsertRowid: number | bigint };
    return Number(result.lastInsertRowid);
  }

  updateAvailabilityProfile(id: number, data: CreateAvailabilityProfileDTO) {
    this.db
      .prepare(`
        UPDATE stock_availability_profiles
        SET name = ?, description = ?, rulesJson = ?, isActive = ?, updatedAt = ?
        WHERE id = ?
      `)
      .run(
        data.name.trim(),
        data.description?.trim() || null,
        JSON.stringify(data.rules),
        data.isActive === false ? 0 : 1,
        new Date().toISOString(),
        id,
      );
  }

  deleteAvailabilityProfile(id: number) {
    return this.db.prepare("DELETE FROM stock_availability_profiles WHERE id = ?").run(id);
  }

  countLensSeriesForProfile(id: number) {
    return (this.db
      .prepare("SELECT COUNT(*) AS total FROM lens_series WHERE availabilityProfileId = ?")
      .get(id) as { total: number }).total;
  }

  createJob(data: CreateOpticalJobDTO, workflow: {
    decision: OpticalJob["availabilityDecision"];
    expectedDeliveryDate?: string;
    supplierId?: number;
    availabilityProfileId?: number;
  }) {
    const now = new Date().toISOString();
    const jobNumber = this.generateJobNumber();
    // Billing only creates a placeholder. Lab and delivery lifecycle remains future work.
    const status: OpticalJobStatus = "NEW";
    const result = this.db
      .prepare(`
        INSERT INTO optical_jobs (
          jobNumber, orderId, customerId, prescriptionId, prescriptionVersionId, frameInventoryId,
          lensSeriesId, supplierId, availabilityProfileId, workflowType, availabilityDecision,
          availabilityOverrideReason, status,
          expectedDeliveryDate, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        jobNumber,
        data.orderId,
        data.customerId,
        data.prescriptionId ?? null,
        data.prescriptionVersionId ?? null,
        data.frameInventoryId ?? null,
        data.lensSeriesId ?? null,
        workflow.supplierId ?? null,
        workflow.availabilityProfileId ?? null,
        data.workflowType,
        workflow.decision,
        data.availabilityOverrideReason ?? null,
        status,
        workflow.expectedDeliveryDate ?? null,
        now,
        now,
      ) as { lastInsertRowid: number | bigint };
    return { id: Number(result.lastInsertRowid), jobNumber, status };
  }

  addTimelineEvent(jobId: number, eventType: string, description: string, performedBy = "System", notes?: string) {
    this.db
      .prepare(`
        INSERT INTO job_timeline_events (jobId, eventType, description, performedBy, notes, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(jobId, eventType, description, performedBy, notes?.trim() || null, new Date().toISOString());
  }

  reserveFrame(jobId: number, inventoryId: number) {
    const item = this.db
      .prepare("SELECT currentStock, reservedStock FROM inventory WHERE id = ?")
      .get(inventoryId) as { currentStock: number; reservedStock: number } | undefined;
    if (!item || item.currentStock - item.reservedStock < 1) {
      throw new Error("The selected frame is no longer available.");
    }
    this.db
      .prepare("INSERT INTO stock_reservations (inventoryId, jobId, quantity, status, createdAt) VALUES (?, ?, 1, 'ACTIVE', ?)")
      .run(inventoryId, jobId, new Date().toISOString());
    this.db
      .prepare("UPDATE inventory SET reservedStock = reservedStock + 1, updatedAt = ? WHERE id = ?")
      .run(new Date().toISOString(), inventoryId);
  }

  getJobs(query: OpticalJobQuery = {}): PaginatedResult<OpticalJob> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 50));
    const clauses: string[] = [];
    const values: unknown[] = [];

    // This query is intentionally prescription-only. Repair jobs live in the
    // separate repair_jobs table and must not leak into this workflow.
    clauses.push("oj.workflowType = 'PRESCRIPTION'");

    if (query.status && query.status !== "ALL") {
      clauses.push("oj.status = ?");
      values.push(query.status);
    }
    if (query.supplierId) {
      clauses.push("ls.supplierId = ?");
      values.push(query.supplierId);
    }
    if (query.priority && query.priority !== "ALL") {
      clauses.push("oj.priority = ?");
      values.push(query.priority);
    }
    if (query.deliveryState === "OVERDUE") clauses.push("COALESCE(oj.promisedDeliveryDate, oj.expectedDeliveryDate) < date('now') AND oj.status NOT IN ('DELIVERED', 'CLOSED', 'CANCELLED')");
    if (query.deliveryState === "READY") clauses.push("oj.status IN ('RECEIVED', 'QC_PENDING', 'READY_FOR_FITTING', 'FITTING', 'QUALITY_CHECK', 'READY_FOR_DELIVERY', 'DELIVERED', 'CLOSED')");
    if (query.deliveryState === "DELAYED") clauses.push("oj.status IN ('ON_HOLD', 'REMAKE', 'REMAKE_REQUIRED')");
    if (query.deliveryState === "EXPECTED") clauses.push("COALESCE(oj.promisedDeliveryDate, oj.expectedDeliveryDate) >= date('now') AND oj.status NOT IN ('RECEIVED', 'QC_PENDING', 'READY_FOR_FITTING', 'FITTING', 'QUALITY_CHECK', 'READY_FOR_DELIVERY', 'DELIVERED', 'CLOSED', 'ON_HOLD', 'REMAKE', 'REMAKE_REQUIRED', 'CANCELLED')");
    if (query.search?.trim()) {
      const value = `%${query.search.trim()}%`;
      clauses.push(`(
        oj.jobNumber LIKE ? OR o.orderNumber LIKE ? OR c.name LIKE ? OR c.mobile LIKE ?
        OR s.supplierName LIKE ? OR ls.brand LIKE ? OR ls.series LIKE ?
        OR frame.itemCode LIKE ? OR frame.barcode LIKE ? OR frame.brand LIKE ? OR frame.model LIKE ?
      )`);
      values.push(value, value, value, value, value, value, value, value, value, value, value);
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const base = `
      FROM optical_jobs oj
      JOIN customers c ON c.id = oj.customerId
      JOIN orders o ON o.id = oj.orderId
      LEFT JOIN lens_series ls ON ls.id = oj.lensSeriesId
      LEFT JOIN suppliers s ON s.id = oj.supplierId
      LEFT JOIN inventory frame ON frame.id = oj.frameInventoryId
    `;
    const total = (this.db.prepare(`SELECT COUNT(*) AS total ${base} ${where}`).get(...values) as { total: number }).total;
    const rows = this.db
      .prepare(`
        SELECT oj.*, o.orderNumber, c.name AS customerName, c.mobile AS customerPhone,
          ls.brand AS lensBrand, ls.series AS lensSeries,
          sap.name AS availabilityProfileName, s.supplierName,
          frame.itemCode || ' · ' || COALESCE(frame.brand, '') || ' ' || COALESCE(frame.model, '') AS frameDescription,
          (SELECT description FROM job_timeline_events WHERE jobId = oj.id ORDER BY createdAt DESC LIMIT 1) AS timelinePreview
        ${base}
        LEFT JOIN stock_availability_profiles sap ON sap.id = oj.availabilityProfileId
        ${where}
        ORDER BY CASE oj.priority WHEN 'URGENT' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'NORMAL' THEN 3 ELSE 4 END, COALESCE(oj.promisedDeliveryDate, oj.expectedDeliveryDate) IS NULL, COALESCE(oj.promisedDeliveryDate, oj.expectedDeliveryDate), oj.updatedAt DESC
        LIMIT ? OFFSET ?
      `)
      .all(...values, pageSize, (page - 1) * pageSize) as JobRow[];

    return { items: rows, total, page, pageSize };
  }

  getDashboard() {
    const count = (sql: string) => (this.db.prepare(sql).get() as { total: number }).total;
    return {
      incompletePrescriptionJobs: count("SELECT COUNT(*) AS total FROM optical_jobs WHERE workflowType='PRESCRIPTION' AND status NOT IN ('READY_FOR_DELIVERY', 'DELIVERED', 'CLOSED')"),
      incompleteRepairJobs: count("SELECT COUNT(*) AS total FROM repair_jobs WHERE status <> 'DELIVERED'"),
      waitingForLens: count("SELECT COUNT(*) AS total FROM optical_jobs WHERE workflowType='PRESCRIPTION' AND status='WAITING_FOR_LENS'"),
      waitingAtLab: count("SELECT COUNT(*) AS total FROM optical_jobs WHERE workflowType='PRESCRIPTION' AND status='AT_LAB'"),
      readyForDelivery: count("SELECT COUNT(*) AS total FROM optical_jobs WHERE workflowType='PRESCRIPTION' AND status='READY_FOR_DELIVERY'"),
    };
  }

  getLabReceivingSummary() {
    const count = (where: string, ...values: unknown[]) => (this.db.prepare(`SELECT COUNT(*) AS total FROM optical_jobs WHERE workflowType = 'PRESCRIPTION' AND ${where}`).get(...values) as { total: number }).total;
    const today = new Date().toISOString().slice(0, 10);
    return {
      waitingAtLab: count("status = 'AT_LAB'"),
      receivedToday: count("receivedAt LIKE ?", `${today}%`),
      qcPending: count("status = 'QC_PENDING'"),
      remakeRequired: count("status = 'REMAKE_REQUIRED'"),
      readyForDelivery: count("status = 'READY_FOR_DELIVERY'"),
    };
  }

  createRepairJob(data: import("../types/optical").CreateRepairJobDTO) {
    const now = new Date().toISOString();
    const jobNumber = this.generateRepairJobNumber();
    const result = this.db.prepare("INSERT INTO repair_jobs (jobNumber, customerId, itemReceived, complaint, charges, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 'NEW', ?, ?)").run(jobNumber, data.customerId, data.itemReceived.trim(), data.complaint.trim(), data.charges, now, now) as { lastInsertRowid: number | bigint };
    const id = Number(result.lastInsertRowid);
    this.addRepairTimelineEvent(id, "REPAIR_CREATED", "Repair job created.");
    return { id, jobNumber };
  }

  getRepairJobs(search = "") {
    const value = `%${search.trim()}%`;
    return this.db.prepare(`SELECT rj.*, c.name AS customerName, c.mobile AS customerPhone,
      (SELECT description FROM repair_job_timeline_events WHERE repairJobId=rj.id ORDER BY createdAt DESC LIMIT 1) AS timelinePreview
      FROM repair_jobs rj JOIN customers c ON c.id=rj.customerId
      WHERE rj.jobNumber LIKE ? OR c.name LIKE ? OR c.mobile LIKE ? OR rj.itemReceived LIKE ? OR rj.complaint LIKE ?
      ORDER BY rj.createdAt DESC, rj.id DESC`).all(value, value, value, value, value);
  }

  getRepairJob(id: number) {
    const job = this.db.prepare("SELECT rj.*, c.name AS customerName, c.mobile AS customerPhone FROM repair_jobs rj JOIN customers c ON c.id=rj.customerId WHERE rj.id=?").get(id);
    if (!job) return undefined;
    const timeline = this.db.prepare("SELECT id, repairJobId AS jobId, eventType, description, performedBy, notes, createdAt FROM repair_job_timeline_events WHERE repairJobId=? ORDER BY createdAt, id").all(id);
    return { ...job as object, timeline };
  }

  updateRepairJob(id: number, status: import("../types/optical").RepairJobStatus) {
    this.db.prepare("UPDATE repair_jobs SET status=?, updatedAt=? WHERE id=?").run(status, new Date().toISOString(), id);
  }

  addRepairTimelineEvent(repairJobId: number, eventType: string, description: string, performedBy = "Current User", notes?: string) {
    this.db.prepare("INSERT INTO repair_job_timeline_events (repairJobId,eventType,description,performedBy,notes,createdAt) VALUES (?, ?, ?, ?, ?, ?)").run(repairJobId, eventType, description, performedBy, notes?.trim() || null, new Date().toISOString());
  }

  getJobDetail(jobId: number): Omit<OpticalJobDetail, "deliveryState" | "timeline"> | undefined {
    const row = this.db
      .prepare(`
        SELECT oj.*, o.orderNumber, o.totalAmount AS invoiceTotal, o.paidAmount AS advanceAmount,
          o.balanceAmount AS outstandingAmount, c.name AS customerName, c.mobile AS customerPhone,
          ls.brand AS lensBrand, ls.series AS lensSeries, sap.name AS availabilityProfileName,
          s.supplierName,
          frame.itemCode || ' · ' || COALESCE(frame.brand, '') || ' ' || COALESCE(frame.model, '') AS frameDescription
        FROM optical_jobs oj
        JOIN customers c ON c.id = oj.customerId
        JOIN orders o ON o.id = oj.orderId
        LEFT JOIN lens_series ls ON ls.id = oj.lensSeriesId
        LEFT JOIN stock_availability_profiles sap ON sap.id = oj.availabilityProfileId
        LEFT JOIN suppliers s ON s.id = oj.supplierId
        LEFT JOIN inventory frame ON frame.id = oj.frameInventoryId
        WHERE oj.id = ?
      `)
      .get(jobId) as Omit<OpticalJobDetail, "deliveryState" | "timeline"> | undefined;
    return row;
  }

  getTimeline(jobId: number): JobTimelineEvent[] {
    return this.db
      .prepare("SELECT * FROM job_timeline_events WHERE jobId = ? ORDER BY createdAt DESC")
      .all(jobId) as JobTimelineEvent[];
  }

  updateJob(id: number, data: UpdateOpticalJobDTO) {
    const current = this.getJobDetail(id);
    if (!current) throw new Error("Optical job not found.");
    const now = new Date().toISOString();
    const status = data.status ?? current.status;
    const priority = data.priority ?? current.priority;
    const promisedDeliveryDate = data.promisedDeliveryDate ?? current.promisedDeliveryDate ?? null;
    const deliveryOverrideReason = data.deliveryOverrideReason ?? current.deliveryOverrideReason ?? null;
    this.db
      .prepare(`
        UPDATE optical_jobs SET status = ?, priority = ?, promisedDeliveryDate = ?, deliveryOverrideReason = ?,
          expectedDeliveryOverride = CASE WHEN ? IS NULL THEN expectedDeliveryOverride ELSE 1 END,
          frameFittedAt = CASE WHEN ? = 'FITTING' THEN ? ELSE frameFittedAt END,
          qualityCheckedAt = CASE WHEN ? = 'READY_FOR_DELIVERY' THEN ? ELSE qualityCheckedAt END,
          deliveredAt = CASE WHEN ? = 'DELIVERED' THEN ? ELSE deliveredAt END,
          updatedAt = ?
        WHERE id = ?
      `)
      .run(status, priority, promisedDeliveryDate, deliveryOverrideReason, data.promisedDeliveryDate ?? null, status, now, status, now, status, now, now, id);
  }

  bulkUpdateJobs(data: BulkUpdateOpticalJobsDTO) {
    for (const id of data.jobIds) {
      this.updateJob(id, data);
    }
  }

  setCustomerNotified(jobId: number) {
    this.db
      .prepare("UPDATE optical_jobs SET customerNotifiedAt = ?, updatedAt = ? WHERE id = ?")
      .run(new Date().toISOString(), new Date().toISOString(), jobId);
  }

  setWarranty(jobId: number, warrantyUntil: string, notes?: string) {
    this.db
      .prepare("UPDATE optical_jobs SET warrantyUntil = ?, warrantyNotes = ?, updatedAt = ? WHERE id = ?")
      .run(warrantyUntil, notes?.trim() || null, new Date().toISOString(), jobId);
  }

  getLabJobs(query: OpticalLabJobQuery): OpticalLabJob[] {
    const clauses: string[] = [];
    const values: unknown[] = [];
    const receivingStatus = query.status ?? "AT_LAB";
    clauses.push(query.stage === "DISPATCH"
      ? "oj.workflowType = 'PRESCRIPTION' AND oj.status = 'READY_FOR_DISPATCH'"
      : receivingStatus === "RECEIVED_TODAY"
        ? "oj.workflowType = 'PRESCRIPTION' AND date(oj.receivedAt) = date('now')"
        : "oj.workflowType = 'PRESCRIPTION' AND oj.status = ?");
    if (query.stage === "RECEIVING" && receivingStatus !== "RECEIVED_TODAY") values.push(receivingStatus);
    if (query.supplierId) {
      clauses.push("oj.supplierId = ?");
      values.push(query.supplierId);
    }
    if (query.search?.trim()) {
      const value = `%${query.search.trim()}%`;
      clauses.push("(oj.jobNumber LIKE ? OR o.orderNumber LIKE ? OR c.name LIKE ? OR oj.assignedLab LIKE ? OR ls.brand LIKE ? OR ls.series LIKE ? OR frame.itemCode LIKE ? OR frame.brand LIKE ? OR frame.model LIKE ?)");
      values.push(value, value, value, value, value, value, value, value, value);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    return this.db
      .prepare(`
        SELECT oj.*,
          o.orderNumber, c.name AS customerName, c.mobile AS customerPhone, ls.brand AS lensBrand,
          ls.series AS lensSeries, sap.name AS availabilityProfileName, s.supplierName,
          frame.itemCode || ' · ' || COALESCE(frame.brand, '') || ' ' || COALESCE(frame.model, '') AS frameDescription,
          TRIM(COALESCE(p.rightSphere, '') || ' / ' || COALESCE(p.rightCylinder, '') || ' × ' || COALESCE(p.rightAxis, '') || ' | ' || COALESCE(p.leftSphere, '') || ' / ' || COALESCE(p.leftCylinder, '') || ' × ' || COALESCE(p.leftAxis, '')) AS prescriptionSummary
        FROM optical_jobs oj
        JOIN orders o ON o.id = oj.orderId
        JOIN customers c ON c.id = oj.customerId
        LEFT JOIN prescriptions p ON p.id = oj.prescriptionId
        LEFT JOIN suppliers s ON s.id = oj.supplierId
        LEFT JOIN lens_series ls ON ls.id = oj.lensSeriesId
        LEFT JOIN stock_availability_profiles sap ON sap.id = oj.availabilityProfileId
        LEFT JOIN inventory frame ON frame.id = oj.frameInventoryId
        ${where}
        ORDER BY COALESCE(oj.promisedDeliveryDate, oj.expectedDeliveryDate) IS NULL,
          COALESCE(oj.promisedDeliveryDate, oj.expectedDeliveryDate), oj.updatedAt DESC
      `)
      .all(...values) as OpticalLabJob[];
  }

  findLabJob(jobId: number): OpticalLabJob | undefined {
    return this.db
      .prepare(`
        SELECT oj.*, 
          o.orderNumber, c.name AS customerName, c.mobile AS customerPhone, ls.brand AS lensBrand,
          ls.series AS lensSeries, sap.name AS availabilityProfileName, s.supplierName,
          frame.itemCode || ' · ' || COALESCE(frame.brand, '') || ' ' || COALESCE(frame.model, '') AS frameDescription,
          TRIM(COALESCE(p.rightSphere, '') || ' / ' || COALESCE(p.rightCylinder, '') || ' × ' || COALESCE(p.rightAxis, '') || ' | ' || COALESCE(p.leftSphere, '') || ' / ' || COALESCE(p.leftCylinder, '') || ' × ' || COALESCE(p.leftAxis, '')) AS prescriptionSummary
        FROM optical_jobs oj
        JOIN orders o ON o.id = oj.orderId
        JOIN customers c ON c.id = oj.customerId
        LEFT JOIN prescriptions p ON p.id = oj.prescriptionId
        LEFT JOIN suppliers s ON s.id = oj.supplierId
        LEFT JOIN lens_series ls ON ls.id = oj.lensSeriesId
        LEFT JOIN stock_availability_profiles sap ON sap.id = oj.availabilityProfileId
        LEFT JOIN inventory frame ON frame.id = oj.frameInventoryId
        WHERE oj.id = ?
      `)
      .get(jobId) as OpticalLabJob | undefined;
  }

  dispatchLabJobs(data: DispatchLabOrdersDTO) {
    const now = new Date().toISOString();
    for (const jobId of data.jobIds) {
      const result = this.db
        .prepare(`
          UPDATE optical_jobs SET status = 'AT_LAB', assignedLab = COALESCE(?, assignedLab), dispatchedAt = ?, courier = ?, trackingNumber = ?,
            dispatchRemarks = ?, updatedAt = ?
          WHERE id = ? AND workflowType = 'PRESCRIPTION' AND status = 'READY_FOR_DISPATCH'
        `)
        .run(
          data.assignedLab?.trim() || null,
          data.dispatchDate ?? now.slice(0, 10),
          data.courier?.trim() || null,
          data.trackingNumber?.trim() || null,
          data.remarks?.trim() || null,
          now,
          jobId,
        ) as { changes?: number };
      if (result.changes === 0) throw new Error("Only prescription optical jobs awaiting dispatch can be dispatched.");
    }
  }

  receiveLabJob(jobId: number, data: ReceiveLabOrderDTO) {
    const now = new Date().toISOString();
    const result = this.db
      .prepare(`
        UPDATE optical_jobs SET status = 'QC_PENDING', receivedAt = ?, receivedBy = ?, inspectionStatus = NULL,
          inspectionNotes = ?, rejectedReason = NULL, remakeReason = NULL,
          updatedAt = ?
        WHERE id = ? AND status = 'AT_LAB'
      `)
      .run(
        now,
        data.performedBy ?? "Current User",
        data.remarks?.trim() || null,
        now,
        jobId,
      ) as { changes?: number };
    if (!result.changes) throw new Error("This optical job is not available for receiving.");
  }

  completeQualityInspection(jobId: number, data: CompleteQualityInspectionDTO) {
    const now = new Date().toISOString();
    const status: OpticalJobStatus = data.result === "PASS" ? "READY_FOR_DELIVERY" : "REMAKE_REQUIRED";
    const result = this.db.prepare(`
      UPDATE optical_jobs SET status = ?, inspectionStatus = ?, inspectionNotes = ?,
        rejectedReason = ?, remakeReason = ?, qualityCheckedAt = ?, qcCompletedAt = ?, updatedAt = ?
      WHERE id = ? AND status = 'QC_PENDING'
    `).run(status, data.result, JSON.stringify({ checklist: data.checklist, remarks: data.remarks?.trim() || null }),
      data.result === "FAIL" ? data.failureReason ?? null : null,
      data.result === "FAIL" ? data.failureReason ?? null : null, now, now, now, jobId) as { changes?: number };
    if (!result.changes) throw new Error("This optical job is not awaiting quality inspection.");
  }

  returnForRemake(jobId: number) {
    const now = new Date().toISOString();
    const result = this.db.prepare(`
      UPDATE optical_jobs SET status = 'READY_FOR_DISPATCH', remakeCount = remakeCount + 1, updatedAt = ?
      WHERE id = ? AND status = 'REMAKE_REQUIRED'
    `).run(now, jobId) as { changes?: number };
    if (!result.changes) throw new Error("This optical job is not awaiting a remake return.");
  }

  createNotification(
    jobId: number,
    type: string,
    title: string,
    message: string,
    dedupeKey?: string,
  ) {
    this.db
      .prepare(`
        INSERT OR IGNORE INTO notifications (jobId, type, title, message, dedupeKey, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(jobId, type, title, message, dedupeKey ?? null, new Date().toISOString());
  }

  getNotifications() {
    return this.db
      .prepare("SELECT * FROM notifications ORDER BY readAt IS NULL DESC, createdAt DESC LIMIT 50")
      .all() as NotificationItem[];
  }

  markNotificationRead(id: number) {
    this.db
      .prepare("UPDATE notifications SET readAt = ? WHERE id = ?")
      .run(new Date().toISOString(), id);
  }

  createDecisionOverride(jobId: number, previousDecision: string, newDecision: string, reason: string, performedBy: string) {
    this.db
      .prepare(`
        INSERT INTO rx_decision_overrides (jobId, previousDecision, newDecision, reason, performedBy, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(jobId, previousDecision, newDecision, reason, performedBy, new Date().toISOString());
  }

  search(query: string): OpticalSearchResult[] {
    const value = `%${query.trim()}%`;
    const jobs = this.db
      .prepare(`
        SELECT oj.id, oj.jobNumber, c.name AS customerName
        FROM optical_jobs oj JOIN customers c ON c.id = oj.customerId
        WHERE oj.jobNumber LIKE ? OR c.name LIKE ? OR c.mobile LIKE ?
        LIMIT 8
      `)
      .all(value, value, value) as { id: number; jobNumber: string; customerName: string }[];
    const lenses = this.db
      .prepare("SELECT id, brand, series FROM lens_series WHERE brand LIKE ? OR series LIKE ? LIMIT 8")
      .all(value, value) as { id: number; brand: string; series: string }[];
    const suppliers = this.db
      .prepare("SELECT id, supplierName, phone FROM suppliers WHERE supplierName LIKE ? OR phone LIKE ? LIMIT 8")
      .all(value, value) as { id: number; supplierName: string; phone: string }[];
    const frames = this.db
      .prepare(`
        SELECT id, itemCode, brand, model, barcode FROM inventory
        WHERE itemType = 'Frame' AND (itemCode LIKE ? OR barcode LIKE ? OR brand LIKE ? OR model LIKE ?)
        LIMIT 8
      `)
      .all(value, value, value, value) as { id: number; itemCode: string; brand?: string; model?: string; barcode?: string }[];
    const invoices = this.db
      .prepare("SELECT id, orderNumber FROM orders WHERE orderNumber LIKE ? LIMIT 8")
      .all(value) as { id: number; orderNumber: string }[];

    return [
      ...jobs.map((job) => ({ kind: "JOB" as const, id: job.id, title: job.jobNumber, subtitle: job.customerName, route: "/optical-jobs" })),
      ...lenses.map((lens) => ({ kind: "LENS" as const, id: lens.id, title: `${lens.brand} ${lens.series}`, subtitle: "Lens Series", route: "/lens-master" })),
      ...suppliers.map((supplier) => ({ kind: "SUPPLIER" as const, id: supplier.id, title: supplier.supplierName, subtitle: supplier.phone, route: "/lens-master" })),
      ...frames.map((frame) => ({ kind: "FRAME" as const, id: frame.id, title: frame.itemCode, subtitle: `${frame.brand ?? ""} ${frame.model ?? ""}`.trim() || frame.barcode || "Frame", route: "/optical-jobs" })),
      ...invoices.map((invoice) => ({ kind: "INVOICE" as const, id: invoice.id, title: invoice.orderNumber, subtitle: "Invoice", route: "/optical-jobs" })),
    ];
  }

  private syncPreferredSupplier(lensSeriesId: number, supplierId: number | undefined, now: string) {
    this.db
      .prepare("DELETE FROM lens_supplier_mappings WHERE lensSeriesId = ?")
      .run(lensSeriesId);
    if (!supplierId) return;
    this.db
      .prepare("INSERT INTO lens_supplier_mappings (lensSeriesId, supplierId, isPreferred, createdAt) VALUES (?, ?, 1, ?)")
      .run(lensSeriesId, supplierId, now);
  }

  private toLensRow(data: CreateLensSeriesDTO, now: string) {
    return {
      brand: data.brand.trim(),
      series: data.series.trim(),
      category: data.category?.trim() || null,
      supplierId: data.supplierId ?? null,
      material: data.material?.trim() || null,
      lensIndex: data.lensIndex?.trim() || null,
      design: data.design?.trim() || null,
      coating: data.coating?.trim() || null,
      tintName: data.tintName?.trim() || null,
      availabilityProfileId: data.availabilityProfileId ?? null,
      defaultCost: data.defaultCost,
      defaultSellingPrice: data.defaultSellingPrice,
      warrantyMonths: data.warrantyMonths ?? null,
      defaultTurnaroundDays: data.defaultTurnaroundDays,
      internalNotes: data.internalNotes?.trim() || null,
      ...lensFeatureColumns.reduce(
        (value, feature) => ({ ...value, [feature]: data[feature] ? 1 : 0 }),
        {} as Record<keyof LensFeatures, number>,
      ),
      isActive: data.isActive === false ? 0 : 1,
      createdAt: now,
      updatedAt: now,
    };
  }
}

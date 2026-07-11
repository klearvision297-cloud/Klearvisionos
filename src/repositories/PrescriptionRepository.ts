import { getDatabase } from "../database/db";

export interface PrescriptionData {
  customerId: number;
  source: "IN_HOUSE" | "EXTERNAL_DOCTOR" | "UPLOADED";
  doctorName?: string;
  rightSphere?: string; rightCylinder?: string; rightAxis?: string; rightAdd?: string; rightPD?: string; rightHeight?: string; rightPrism?: string;
  leftSphere?: string; leftCylinder?: string; leftAxis?: string; leftAdd?: string; leftPD?: string; leftHeight?: string; leftPrism?: string;
  distanceNotes?: string; nearNotes?: string; doctorNotes?: string;
}

export class PrescriptionRepository {
  private db = getDatabase();
  create(data: PrescriptionData) {
    const transaction = this.db.transaction(() => this.createInTransaction(data));
    return transaction();
  }
  createInTransaction(data: PrescriptionData) {
      const now = new Date().toISOString();
      const number = `RX-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      const result = this.db.prepare(`INSERT INTO prescriptions (customerId,prescriptionNumber,examinationDate,doctorName,rightSphere,rightCylinder,rightAxis,rightAdd,rightPD,leftSphere,leftCylinder,leftAxis,leftAdd,leftPD,diagnosis,remarks,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(data.customerId, number, now, data.doctorName ?? null, data.rightSphere ?? null, data.rightCylinder ?? null, data.rightAxis ?? null, data.rightAdd ?? null, data.rightPD ?? null, data.leftSphere ?? null, data.leftCylinder ?? null, data.leftAxis ?? null, data.leftAdd ?? null, data.leftPD ?? null, data.distanceNotes ?? null, data.doctorNotes ?? null, now, now) as { lastInsertRowid: number | bigint };
      const id = Number(result.lastInsertRowid);
      this.db.prepare(`INSERT INTO prescription_versions (prescriptionId,versionNumber,source,rightHeight,rightPrism,leftHeight,leftPrism,distanceNotes,nearNotes,doctorNotes,createdAt) VALUES (?,1,?,?,?,?,?,?,?,?,?)`).run(id, data.source, data.rightHeight ?? null, data.rightPrism ?? null, data.leftHeight ?? null, data.leftPrism ?? null, data.distanceNotes ?? null, data.nearNotes ?? null, data.doctorNotes ?? null, now);
      return { id, prescriptionNumber: number };
  }
  getByCustomer(customerId: number) { return this.db.prepare("SELECT p.*, pv.id AS versionId, pv.versionNumber, pv.source, pv.rightHeight, pv.rightPrism, pv.leftHeight, pv.leftPrism, pv.nearNotes, pv.doctorNotes FROM prescriptions p JOIN prescription_versions pv ON pv.prescriptionId = p.id WHERE p.customerId = ? ORDER BY p.createdAt DESC").all(customerId); }
}

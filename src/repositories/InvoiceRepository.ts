import { getDatabase } from "../database/db";
import type { InvoiceDetail, InvoiceListRow } from "../types/invoice";

export class InvoiceRepository {
  private db = getDatabase();
  private workflow(invoiceType: string, jobWorkflow?: string): InvoiceListRow["workflow"] {
    if (jobWorkflow === "REPAIR" || invoiceType.toLowerCase().includes("repair")) return "REPAIR";
    return jobWorkflow ? "PRESCRIPTION" : "RETAIL";
  }
  list(search = ""): InvoiceListRow[] {
    const q = `%${search.trim()}%`;
    const rows = this.db.prepare(`SELECT o.*, c.name customerName, c.mobile customerMobile, c.customerCode, (SELECT workflowType FROM optical_jobs oj WHERE oj.orderId=o.id LIMIT 1) jobWorkflow FROM orders o JOIN customers c ON c.id=o.customerId WHERE o.orderNumber LIKE ? OR c.name LIKE ? OR c.mobile LIKE ? OR c.customerCode LIKE ? ORDER BY o.createdAt DESC, o.id DESC`).all(q,q,q,q) as Array<Record<string, unknown>>;
    return rows.map((r) => ({ id:r.id as number, orderNumber:r.orderNumber as string, orderDate:r.orderDate as string, customerId:r.customerId as number, customerCode:r.customerCode as string, customerName:r.customerName as string, customerMobile:r.customerMobile as string, workflow:this.workflow(r.invoiceType as string, r.jobWorkflow as string | undefined), orderStatus:r.orderStatus as string, totalAmount:r.totalAmount as number, paidAmount:r.paidAmount as number, balanceAmount:r.balanceAmount as number, paymentStatus:r.paymentStatus as string, staff:null }));
  }
  detail(id: number): InvoiceDetail | null {
    const row = this.db.prepare(`SELECT o.*, c.name customerName, c.mobile customerMobile, c.customerCode, (SELECT workflowType FROM optical_jobs oj WHERE oj.orderId=o.id LIMIT 1) jobWorkflow FROM orders o JOIN customers c ON c.id=o.customerId WHERE o.id=?`).get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    const base = this.listByRow(row);
    const items = this.db.prepare("SELECT id, inventoryId, lensSeriesId, itemCode, itemType, brand, category, model, color, size, quantity, sellingPrice, discount, total, remarks FROM order_items WHERE orderId=? ORDER BY id").all(id) as InvoiceDetail["items"];
    const payments = this.db.prepare("SELECT id, paymentNumber, paymentDate, paymentMethod, amount, remarks, referenceNumber, recordedBy FROM payments WHERE orderId=? ORDER BY paymentDate, id").all(id) as InvoiceDetail["payments"];
    const events = this.db.prepare("SELECT id,eventType,notes,createdAt FROM invoice_events WHERE orderId=? ORDER BY createdAt,id").all(id) as InvoiceDetail["timeline"];
    const created = { id: -id, eventType:"INVOICE_CREATED", notes:"Invoice created", createdAt: row.createdAt as string };
    const prescription = row.prescriptionId ? this.db.prepare("SELECT * FROM prescriptions WHERE id=?").get(row.prescriptionId as number) as Record<string, unknown> : null;
    return { ...base, invoiceType:row.invoiceType as string, gstMode:row.gstMode as string, subtotal:row.subtotal as number, discount:row.discount as number, gstAmount:row.gstAmount as number, roundOff:row.roundOff as number, remarks:row.remarks as string | null, prescription, items, payments, timeline:[created, ...events] };
  }
  private listByRow(r: Record<string, unknown>): InvoiceListRow { return { id:r.id as number, orderNumber:r.orderNumber as string, orderDate:r.orderDate as string, customerId:r.customerId as number, customerCode:r.customerCode as string, customerName:r.customerName as string, customerMobile:r.customerMobile as string, workflow:this.workflow(r.invoiceType as string,r.jobWorkflow as string | undefined), orderStatus:r.orderStatus as string,totalAmount:r.totalAmount as number,paidAmount:r.paidAmount as number,balanceAmount:r.balanceAmount as number,paymentStatus:r.paymentStatus as string,staff:null }; }
  transaction<T>(work: () => T) { return this.db.transaction(work)(); }
  addPayment(id: number, amount: number, method: string, remarks?: string, reference?: string) {
    const order = this.db.prepare("SELECT customerId,totalAmount,paidAmount,balanceAmount,orderStatus FROM orders WHERE id=?").get(id) as {customerId:number;totalAmount:number;paidAmount:number;balanceAmount:number;orderStatus:string}|undefined;
    if (!order) throw new Error("Invoice not found."); if (order.orderStatus === "Cancelled") throw new Error("Cancelled invoices cannot receive payments."); if (!Number.isFinite(amount) || amount <= 0 || amount > order.balanceAmount) throw new Error("Payment must be greater than zero and no more than the balance.");
    const now=new Date().toISOString(); const totalPaid=Math.round((order.paidAmount+amount)*100)/100; const balance=Math.max(0, Math.round((order.totalAmount-totalPaid)*100)/100);
    this.db.prepare("INSERT INTO payments (paymentNumber,orderId,customerId,paymentDate,paymentMethod,amount,referenceNumber,remarks,recordedBy,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(`PAY-${Date.now()}-${id}`,id,order.customerId,now,method,amount,reference?.trim() || null,remarks ?? null,"Store",now,now);
    this.db.prepare("UPDATE orders SET paidAmount=?,balanceAmount=?,paymentStatus=?,updatedAt=? WHERE id=?").run(totalPaid,balance,balance === 0 ? "Paid" : "Partial",now,id);
    this.event(id,"PAYMENT_RECEIVED",`${method}: ${amount} — Staff: Store${reference?.trim() ? ` — Ref: ${reference.trim()}` : ""}${remarks ? ` — ${remarks}` : ""}`,now); return { customerId:order.customerId };
  }
  cancel(id:number, reason:string) { return this.transaction(() => { const order=this.db.prepare("SELECT * FROM orders WHERE id=?").get(id) as Record<string, unknown>|undefined; if(!order) throw new Error("Invoice not found."); if(order.orderStatus === "Cancelled") throw new Error("Invoice is already cancelled."); const now=new Date().toISOString(); const items=this.db.prepare("SELECT inventoryId,quantity FROM order_items WHERE orderId=?").all(id) as Array<{inventoryId:number;quantity:number}>; const reserved=this.db.prepare("SELECT frameInventoryId FROM optical_jobs WHERE orderId=?").get(id) as {frameInventoryId:number|null}|undefined; for(const item of items) { if (item.inventoryId === reserved?.frameInventoryId) continue; const stock=this.db.prepare("SELECT currentStock FROM inventory WHERE id=?").get(item.inventoryId) as {currentStock:number}|undefined; if(!stock) continue; const next=stock.currentStock+item.quantity; this.db.prepare("UPDATE inventory SET currentStock=?,updatedAt=? WHERE id=?").run(next,now,item.inventoryId); this.db.prepare("INSERT INTO stock_history (inventoryId,changeType,previousStock,newStock,difference,reason,remarks,referenceType,referenceNumber,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)").run(item.inventoryId,"CANCELLATION",stock.currentStock,next,item.quantity,"Invoice cancellation",reason,"ORDER",order.orderNumber,now); }
    if(reserved?.frameInventoryId) this.db.prepare("UPDATE inventory SET reservedStock=MAX(0,reservedStock-1),updatedAt=? WHERE id=?").run(now,reserved.frameInventoryId);
    const paidAmount = Number(order.paidAmount) || 0;
    if (paidAmount > 0) {
      this.db.prepare("INSERT INTO payments (paymentNumber,orderId,customerId,paymentDate,paymentMethod,amount,remarks,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?)").run(`REF-${Date.now()}-${id}`, id, order.customerId, now, "Refund", -paidAmount, `Invoice cancelled: ${reason}`, now, now);
      this.event(id,"PAYMENT_REVERSED",`Refund reversal: ${paidAmount}`,now);
    }
    this.db.prepare("UPDATE orders SET orderStatus='Cancelled',paidAmount=0,balanceAmount=0,paymentStatus=CASE WHEN paidAmount > 0 THEN 'Refunded' ELSE 'Cancelled' END,updatedAt=? WHERE id=?").run(now,id);
    this.event(id,"INVOICE_CANCELLED",reason,now); return {customerId:order.customerId as number}; }); }
  event(orderId:number,eventType:string,notes:string|null,now=new Date().toISOString()) { this.db.prepare("INSERT INTO invoice_events(orderId,eventType,notes,createdAt) VALUES(?,?,?,?)").run(orderId,eventType,notes,now); }
}

import { BrowserWindow, ipcMain } from "electron";
import { InvoiceService } from "../services/InvoiceService";
import type { InvoiceDetail } from "../types/invoice";

const service = new InvoiceService();

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

function money(value: number) { return `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`; }

function printDocument(invoice: InvoiceDetail) {
  const items = invoice.items.map((item) => `<tr><td>${escapeHtml([item.brand, item.model].filter(Boolean).join(" ") || item.itemCode)}<small>${escapeHtml(item.itemCode)} · ${escapeHtml(item.itemType)}</small></td><td>${item.quantity}</td><td>${money(item.sellingPrice)}</td><td>${money(item.total)}</td></tr>`).join("");
  const payments = invoice.payments.map((payment) => `<li>${escapeHtml(payment.paymentMethod)} — ${money(payment.amount)} <small>${escapeHtml(payment.paymentDate)}</small></li>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(invoice.orderNumber)}</title><style>body{font:12px Arial,sans-serif;color:#111;margin:20px}header{display:flex;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:12px}h1,h2,p{margin:0}h1{font-size:20px}h2{font-size:14px;margin:20px 0 8px}small{display:block;color:#555;margin-top:3px}table{width:100%;border-collapse:collapse}th,td{padding:7px 4px;border-bottom:1px solid #ddd;text-align:left}th:nth-child(n+2),td:nth-child(n+2){text-align:right}.totals{margin-left:auto;width:260px;margin-top:16px}.totals div{display:flex;justify-content:space-between;padding:4px 0}.totals strong{border-top:1px solid #111;padding-top:8px}ul{padding-left:18px}</style></head><body><header><div><h1>Klear Vision</h1><p>Invoice ${escapeHtml(invoice.orderNumber)}</p></div><div><strong>${escapeHtml(invoice.customerName)}</strong><small>${escapeHtml(invoice.customerCode)} · ${escapeHtml(invoice.customerMobile)}</small><small>${escapeHtml(invoice.orderDate)}</small></div></header><h2>Items</h2><table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead><tbody>${items}</tbody></table><div class="totals"><div><span>Subtotal</span><span>${money(invoice.subtotal)}</span></div><div><span>Discount</span><span>${money(invoice.discount)}</span></div><div><span>GST</span><span>${money(invoice.gstAmount)}</span></div><div><strong>Total</strong><strong>${money(invoice.totalAmount)}</strong></div><div><span>Paid</span><span>${money(invoice.paidAmount)}</span></div><div><strong>Outstanding</strong><strong>${money(invoice.balanceAmount)}</strong></div></div>${payments ? `<h2>Payment history</h2><ul>${payments}</ul>` : ""}${invoice.remarks ? `<h2>Remarks</h2><p>${escapeHtml(invoice.remarks)}</p>` : ""}</body></html>`;
}

async function printInvoice(invoice: InvoiceDetail, format: "thermal" | "a4" | "a5") {
  const printWindow = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  const pageSize = format === "a4" ? "A4" : format === "a5" ? "A5" : { width: 80000, height: 297000 };
  try {
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(printDocument(invoice))}`);
    await new Promise<void>((resolve, reject) => printWindow.webContents.print({ silent: false, printBackground: true, pageSize } as Electron.WebContentsPrintOptions, (success, error) => success ? resolve() : reject(new Error(error || "Printing failed."))));
    return { success: true };
  } finally {
    if (!printWindow.isDestroyed()) printWindow.close();
  }
}

export function registerInvoiceIpc() {
  ipcMain.handle("invoice:list", (_, search?: string) => service.list(search));
  ipcMain.handle("invoice:detail", (_, id: number) => service.detail(id));
  ipcMain.handle("invoice:receive-payment", (_, id: number, amount: number, method: string, remarks?: string, reference?: string) => service.receivePayment(id, amount, method, remarks, reference));
  ipcMain.handle("invoice:cancel", (_, id: number, reason: string) => service.cancel(id, reason));
  ipcMain.handle("invoice:print", async (_, id: number, format: "thermal" | "a4" | "a5") => {
    const invoice = service.detail(id);
    if (!invoice) throw new Error("Invoice not found.");
    return printInvoice(invoice, format);
  });
}

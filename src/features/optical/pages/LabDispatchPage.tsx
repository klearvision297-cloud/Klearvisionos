import { useEffect, useMemo, useState } from "react";
import { CheckSquare, FileDown, Printer, Send, Square } from "lucide-react";
import toast from "react-hot-toast";
import { Badge, Button, Card, DataUnavailable, Input, PageHeader, Table } from "../../../components/ui";
import type { OpticalLabJob } from "../../../types/optical";

const today = () => new Date().toISOString().slice(0, 10);
const date = (value?: string | null) => value ? new Date(value).toLocaleDateString() : "-";
const deliveryDate = (job: OpticalLabJob) => job.promisedDeliveryDate ?? job.expectedDeliveryDate ?? "Not scheduled";
const escapeHtml = (value?: string | null) => (value ?? "-").replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character] ?? character);

function groupFor(createdAt: string) {
  const created = new Date(createdAt).toISOString().slice(0, 10);
  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (created === now.toISOString().slice(0, 10)) return "Today";
  if (created === yesterday.toISOString().slice(0, 10)) return "Yesterday";
  return "Older";
}

export default function LabDispatchPage() {
  const [jobs, setJobs] = useState<OpticalLabJob[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [labFilter, setLabFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("READY_FOR_DISPATCH");
  const [assignedLab, setAssignedLab] = useState("");
  const [dispatchDate, setDispatchDate] = useState(today());
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadJobs() {
    try { setLoading(true); setJobs(await window.optical.getLabJobs({ stage: "DISPATCH" })); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load optical jobs awaiting dispatch."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadJobs(); }, []);

  const labs = useMemo(() => [...new Set(jobs.map((job) => job.assignedLab).filter((lab): lab is string => Boolean(lab)))], [jobs]);
  const visibleJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) => statusFilter === "ALL" || job.status === statusFilter)
      .filter((job) => labFilter === "ALL" || job.assignedLab === labFilter)
      .filter((job) => !dateFilter || job.createdAt.slice(0, 10) === dateFilter)
      .filter((job) => !query || [job.customerName, job.orderNumber, job.jobNumber, job.lensBrand, job.lensSeries, job.frameDescription].some((value) => value?.toLowerCase().includes(query)));
  }, [dateFilter, jobs, labFilter, search, statusFilter]);
  const selectedJobs = useMemo(() => visibleJobs.filter((job) => selected.includes(job.id)), [selected, visibleJobs]);
  const groups = useMemo(() => ["Today", "Yesterday", "Older"].map((name) => [name, visibleJobs.filter((job) => groupFor(job.createdAt) === name)] as const).filter(([, items]) => items.length), [visibleJobs]);
  const toggle = (id: number) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);

  const dispatchSelected = async () => {
    if (!selectedJobs.length) return;
    if (!assignedLab.trim() && selectedJobs.some((job) => !job.assignedLab?.trim())) { toast.error("Select the lab before dispatching."); return; }
    try {
      await window.optical.dispatchLabJobs({ jobIds: selectedJobs.map((job) => job.id), assignedLab, dispatchDate, remarks });
      toast.success(`${selectedJobs.length} optical job${selectedJobs.length === 1 ? "" : "s"} dispatched to lab.`);
      setSelected([]); setRemarks(""); await loadJobs();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to dispatch optical jobs."); }
  };

  const printSheet = (items: OpticalLabJob[], title: string) => {
    if (!items.length) { toast.error("No dispatch jobs match this print option."); return; }
    const body = items.map((job) => `<section><h1>Klear Vision OS · Lab Dispatch</h1><p><strong>${escapeHtml(title)}</strong></p><table><tbody><tr><th>Job number</th><td>${escapeHtml(job.jobNumber)}</td><th>Invoice</th><td>${escapeHtml(job.orderNumber)}</td></tr><tr><th>Customer</th><td>${escapeHtml(job.customerName)}</td><th>Lab name</th><td>${escapeHtml(job.assignedLab || assignedLab)}</td></tr><tr><th>Frame</th><td>${escapeHtml(job.frameDescription)}</td><th>Selected lens</th><td>${escapeHtml([job.lensBrand, job.lensSeries].filter(Boolean).join(" "))}</td></tr><tr><th>Prescription</th><td colspan="3">${escapeHtml(job.prescriptionSummary)}</td></tr><tr><th>Expected delivery</th><td>${escapeHtml(deliveryDate(job))}</td><th>Dispatch date</th><td>${escapeHtml(job.dispatchedAt ?? dispatchDate)}</td></tr><tr><th>Remarks</th><td colspan="3">${escapeHtml(job.dispatchRemarks ?? remarks)}</td></tr></tbody></table></section>`).join("<div class=break></div>");
    const popup = window.open("", "lab-dispatch", "width=900,height=700");
    if (!popup) { toast.error("Allow pop-ups to print or save the dispatch PDF."); return; }
    popup.document.write(`<html><head><title>Lab Dispatch</title><style>body{font-family:Arial;padding:24px;color:#18202a}h1{font-size:20px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #aab4c0;padding:8px;text-align:left;vertical-align:top}th{width:18%;background:#f2f5f8}.break{page-break-after:always}</style></head><body>${body}</body></html>`);
    popup.document.close(); popup.focus(); popup.print();
  };
  const printToday = async () => {
    try {
      const dispatched = await window.optical.getJobs({ status: "AT_LAB", pageSize: 100 });
      printSheet(dispatched.items.filter((job) => job.dispatchedAt === today()) as OpticalLabJob[], "Today’s dispatch");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to prepare today’s dispatch sheet."); }
  };
  const printLab = assignedLab.trim() || (labFilter === "ALL" ? "" : labFilter);

  return <section className="optical-page">
    <PageHeader eyebrow="Manufacturing dispatch" title="Lab Dispatch" subtitle="Prescription Optical Jobs are the dispatch queue; no separate dispatch record is created." action={<Badge variant="warning">{visibleJobs.length} waiting</Badge>} />
    <Card className="lab-dispatch__toolbar"><div className="lab-dispatch__metadata">
      <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Customer, invoice, job, lens or frame" />
      <label className="kv-field"><span className="kv-field__label">Lab filter</span><select value={labFilter} onChange={(event) => setLabFilter(event.target.value)}><option value="ALL">All labs</option>{labs.map((lab) => <option key={lab} value={lab}>{lab}</option>)}</select></label>
      <Input label="Created date" type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
      <label className="kv-field"><span className="kv-field__label">Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="READY_FOR_DISPATCH">Ready for dispatch</option><option value="ALL">All</option></select></label>
    </div><div className="lab-dispatch__metadata">
      <Input label="Assigned lab" value={assignedLab} onChange={(event) => setAssignedLab(event.target.value)} placeholder="ABC Optical Lab" />
      <Input label="Dispatch date" type="date" value={dispatchDate} onChange={(event) => setDispatchDate(event.target.value)} />
      <Input label="Remarks" value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Lab instructions" />
    </div><div className="lab-dispatch__actions"><span>{selectedJobs.length} selected</span><Button variant="secondary" disabled={!selectedJobs.length} onClick={() => printSheet(selectedJobs, "Selected dispatch") }><Printer size={16} /> Print selected</Button><Button variant="secondary" disabled={!selectedJobs.length} onClick={() => printSheet(selectedJobs, "Selected dispatch PDF") }><FileDown size={16} /> Save PDF</Button><Button variant="secondary" onClick={() => void printToday()}><Printer size={16} /> Print today</Button><Button variant="secondary" disabled={!selectedJobs.length || !printLab} onClick={() => printSheet(selectedJobs.filter((job) => (job.assignedLab || assignedLab) === printLab), `Dispatch for ${printLab}`)}><Printer size={16} /> Print by lab</Button><Button disabled={!selectedJobs.length || !dispatchDate} onClick={() => void dispatchSelected()}><Send size={16} /> Dispatch to lab</Button></div></Card>
    {loading ? <p className="optical-page__loading">Loading lab dispatch queue...</p> : groups.length ? groups.map(([name, items]) => <section key={name}><h3>{name}</h3><Card className="optical-page__queue"><Table><thead><tr><th><button className="lab-dispatch__select" type="button" aria-label="Select all visible jobs" onClick={() => setSelected(selected.length === visibleJobs.length ? [] : visibleJobs.map((job) => job.id))}>{selected.length === visibleJobs.length ? <CheckSquare size={17} /> : <Square size={17} />}</button></th><th>Job number</th><th>Invoice</th><th>Customer</th><th>Frame</th><th>Lens</th><th>Prescription summary</th><th>Expected delivery</th><th>Created date</th><th>Assigned lab</th><th>Status</th></tr></thead><tbody>{items.map((job) => <tr key={job.id}><td><input type="checkbox" checked={selected.includes(job.id)} onChange={() => toggle(job.id)} aria-label={`Select ${job.jobNumber}`} /></td><td>{job.jobNumber}</td><td>{job.orderNumber}</td><td>{job.customerName}</td><td>{job.frameDescription ?? "-"}</td><td>{[job.lensBrand, job.lensSeries].filter(Boolean).join(" ") || "-"}</td><td>{job.prescriptionSummary || "-"}</td><td>{job.promisedDeliveryDate || job.expectedDeliveryDate ? date(job.promisedDeliveryDate ?? job.expectedDeliveryDate) : "Not scheduled"}</td><td>{date(job.createdAt)}</td><td>{job.assignedLab ?? "Unassigned"}</td><td><Badge variant="warning">Ready for dispatch</Badge></td></tr>)}</tbody></Table></Card></section>) : <DataUnavailable title="No optical jobs awaiting dispatch" description="Prescription jobs automatically appear here when marked Ready for dispatch." />}
  </section>;
}

import { useEffect, useMemo, useState } from "react";
import { CheckSquare, ClipboardList, Eye, MessageCircle, RefreshCw, ShieldCheck, Square, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Badge, Button, Card, DataUnavailable, Input, Modal, PageHeader, Table } from "../../../components/ui";
import type { JobPriority, OpticalJob, OpticalJobDetail, OpticalJobStatus, OpticalSearchResult } from "../../../types/optical";

const statuses: OpticalJobStatus[] = ["CONFIRMED", "LAB_PENDING", "DISPATCHED", "RECEIVED", "READY_FOR_FITTING", "FITTING", "QUALITY_CHECK", "READY_FOR_DELIVERY", "DELIVERED", "CLOSED", "ON_HOLD", "CANCELLED", "REMAKE"];
const priorities: JobPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];
const statusVariant = (status: string) => status === "READY_FOR_DELIVERY" || status === "DELIVERED" ? "success" as const : status === "ON_HOLD" || status === "REMAKE" ? "danger" as const : ["LAB_PENDING", "DISPATCHED", "QUALITY_CHECK"].includes(status) ? "warning" as const : "neutral" as const;
const deliveryVariant = (state: OpticalJob["deliveryState"]) => state === "READY" ? "success" as const : state === "OVERDUE" ? "danger" as const : state === "DELAYED" ? "warning" as const : "info" as const;

function label(value: string) { return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function formatDate(value?: string | null) { return value ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(`${value.slice(0, 10)}T00:00:00`)) : "-"; }
function nextAction(status: OpticalJobStatus): { status: OpticalJobStatus; label: string } | null {
  if (status === "RECEIVED" || status === "READY_FOR_FITTING") return { status: "FITTING", label: "Start fitting" };
  if (status === "FITTING") return { status: "QUALITY_CHECK", label: "Send to QC" };
  if (status === "QUALITY_CHECK") return { status: "READY_FOR_DELIVERY", label: "Pass QC" };
  if (status === "READY_FOR_DELIVERY") return { status: "DELIVERED", label: "Mark delivered" };
  if (status === "DELIVERED") return { status: "CLOSED", label: "Close job" };
  return null;
}

function JobDetailModal({ job, onClose, onUpdated }: { job: OpticalJobDetail | null; onClose: () => void; onUpdated: () => void }) {
  const [notes, setNotes] = useState("");
  const [warrantyUntil, setWarrantyUntil] = useState("");
  const [warrantyNotes, setWarrantyNotes] = useState("");
  useEffect(() => {
    if (job) {
      setNotes("");
      setWarrantyUntil(job.warrantyUntil ?? "");
      setWarrantyNotes(job.warrantyNotes ?? "");
    }
  }, [job]);
  const update = async (data: Parameters<typeof window.optical.updateJob>[1]) => {
    if (!job) return;
    try {
      await window.optical.updateJob(job.id, { ...data, notes });
      toast.success("Job updated.");
      onUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update job.");
    }
  };
  const notify = async () => {
    if (!job) return;
    try {
      await window.optical.notifyCustomer(job.id, notes);
      toast.success("Customer notification recorded.");
      onUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to record notification.");
    }
  };
  const saveWarranty = async () => {
    if (!job) return;
    try {
      await window.optical.recordWarranty(job.id, warrantyUntil, warrantyNotes);
      toast.success("Warranty recorded.");
      onUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to record warranty.");
    }
  };
  const next = job ? nextAction(job.status) : null;
  const deliveryDate = job?.promisedDeliveryDate ?? job?.expectedDeliveryDate;
  return <Modal open={Boolean(job)} onClose={onClose} title={job ? `${job.jobNumber} - ${job.customerName}` : "Optical job"} description={job ? `${job.orderNumber} - ${job.lensBrand ?? "No lens"} ${job.lensSeries ?? ""}` : ""} width={900} footer={<Button variant="secondary" onClick={onClose}>Close</Button>}>
    <div className="optical-job-detail">{job ? <>
      <div className="optical-job-detail__summary"><div><span>Status</span><Badge variant={statusVariant(job.status)}>{label(job.status)}</Badge></div><div><span>Expected delivery</span><strong>{formatDate(job.expectedDeliveryDate)}</strong><Badge variant={deliveryVariant(job.deliveryState)}>{label(job.deliveryState)}</Badge></div><div><span>Promised delivery</span><strong>{formatDate(job.promisedDeliveryDate)}</strong></div><div><span>Supplier</span><strong>{job.supplierName ?? "-"}</strong></div><div><span>Frame</span><strong>{job.frameDescription ?? "-"}</strong></div></div>
      <Card className="optical-job-detail__actions"><div className="optical-job-detail__controls"><label className="kv-field"><span className="kv-field__label">Priority</span><select value={job.priority} onChange={(event) => void update({ priority: event.target.value as JobPriority })}>{priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}</select></label><Input label="Promised delivery" type="date" value={deliveryDate?.slice(0, 10) ?? ""} onChange={(event) => void update({ promisedDeliveryDate: event.target.value, deliveryOverrideReason: notes })} /><label className="kv-field optical-job-detail__notes"><span className="kv-field__label">Action or override reason</span><input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Required for a delivery promise" /></label></div><div className="optical-job-detail__buttons">{next ? <Button onClick={() => void update({ status: next.status })}><Wrench size={15} /> {next.label}</Button> : null}{job.status === "READY_FOR_DELIVERY" ? <Button variant="secondary" onClick={() => void notify()}><MessageCircle size={15} /> Record customer notified</Button> : null}</div></Card>
      <Card className="optical-job-detail__warranty"><div><h3>Warranty</h3><p>Record post-delivery warranty coverage on the job timeline.</p></div><Input label="Covered through" type="date" value={warrantyUntil} onChange={(event) => setWarrantyUntil(event.target.value)} /><Input label="Warranty notes" value={warrantyNotes} onChange={(event) => setWarrantyNotes(event.target.value)} /><Button variant="secondary" disabled={!warrantyUntil} onClick={() => void saveWarranty()}><ShieldCheck size={15} /> Record</Button></Card>
      <section className="optical-job-detail__timeline"><h3>Timeline</h3>{job.timeline.length ? <ol>{job.timeline.map((event) => <li key={event.id}><div><strong>{label(event.eventType)}</strong><p>{event.description}</p>{event.notes ? <small>{event.notes}</small> : null}</div><time>{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(event.createdAt))}<small>{event.performedBy}</small></time></li>)}</ol> : <p>No timeline entries.</p>}</section>
    </> : null}</div>
  </Modal>;
}

export default function OpticalJobsPage() {
  const [jobs, setJobs] = useState<OpticalJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OpticalJobStatus | "ALL">("ALL");
  const [priority, setPriority] = useState<JobPriority | "ALL">("ALL");
  const [deliveryState, setDeliveryState] = useState<OpticalJob["deliveryState"] | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OpticalJobStatus | "">("");
  const [bulkPriority, setBulkPriority] = useState<JobPriority | "">("");
  const [detail, setDetail] = useState<OpticalJobDetail | null>(null);
  const [searchResults, setSearchResults] = useState<OpticalSearchResult[]>([]);
  const navigate = useNavigate();
  const pageCount = Math.max(1, Math.ceil(total / 40));
  const selectedJobs = useMemo(() => jobs.filter((job) => selectedIds.includes(job.id)), [jobs, selectedIds]);
  async function loadJobs() {
    try {
      setLoading(true);
      const result = await window.optical.getJobs({ search, status, priority, deliveryState, page, pageSize: 40 });
      setJobs(result.items);
      setTotal(result.total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load optical jobs.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { const timeout = window.setTimeout(() => { void loadJobs(); }, 150); return () => window.clearTimeout(timeout); }, [deliveryState, page, priority, search, status]);
  useEffect(() => { if (search.trim().length < 2) { setSearchResults([]); return; } let active = true; const timeout = window.setTimeout(() => { void window.optical.search(search).then((result) => { if (active) setSearchResults(result); }); }, 200); return () => { active = false; window.clearTimeout(timeout); }; }, [search]);
  const openDetail = async (jobId: number) => { try { setDetail(await window.optical.getJobDetail(jobId)); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load job detail."); } };
  const reloadDetail = () => { if (detail) void openDetail(detail.id); void loadJobs(); };
  const toggle = (id: number) => setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const applyBulk = async () => { if (!selectedIds.length || (!bulkStatus && !bulkPriority)) return; try { await window.optical.bulkUpdateJobs({ jobIds: selectedIds, status: bulkStatus || undefined, priority: bulkPriority || undefined }); toast.success(`${selectedIds.length} job${selectedIds.length === 1 ? "" : "s"} updated.`); setSelectedIds([]); setBulkStatus(""); setBulkPriority(""); await loadJobs(); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to bulk update jobs."); } };
  return <section className="optical-page"><PageHeader eyebrow="Operational workspace" title="Optical Jobs" subtitle="Prescription fulfilment, service work, ETA, and customer handoff." action={<Button variant="secondary" onClick={() => void loadJobs()}><RefreshCw size={16} /> Refresh</Button>} /><Card className="optical-jobs__toolbar"><div className="optical-jobs__search"><Input label="Search optical operations" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Customer, phone, job, invoice, supplier, lens, frame, barcode..." />{searchResults.length ? <div className="optical-jobs__search-results">{searchResults.map((result) => <button key={`${result.kind}-${result.id}`} type="button" onClick={() => { setSearchResults([]); navigate(result.route); }}><Badge variant="neutral">{result.kind}</Badge><span><strong>{result.title}</strong><small>{result.subtitle}</small></span></button>)}</div> : null}</div><select value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1); }}><option value="ALL">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select><select value={priority} onChange={(event) => { setPriority(event.target.value as typeof priority); setPage(1); }}><option value="ALL">All priorities</option>{priorities.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select><select value={deliveryState} onChange={(event) => { setDeliveryState(event.target.value as typeof deliveryState); setPage(1); }}><option value="ALL">All delivery states</option><option value="EXPECTED">Expected</option><option value="READY">Ready</option><option value="DELAYED">Delayed</option><option value="OVERDUE">Overdue</option></select></Card>{selectedJobs.length ? <Card className="optical-jobs__bulk"><strong>{selectedJobs.length} selected</strong><select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value as OpticalJobStatus | "")}><option value="">No status change</option>{statuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select><select value={bulkPriority} onChange={(event) => setBulkPriority(event.target.value as JobPriority | "")}><option value="">No priority change</option>{priorities.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select><Button size="sm" disabled={!bulkStatus && !bulkPriority} onClick={() => void applyBulk()}>Apply bulk action</Button></Card> : null}<Card className="optical-page__queue">{loading ? <p className="optical-page__loading">Loading jobs...</p> : jobs.length ? <Table><thead><tr><th><button className="lab-dispatch__select" type="button" onClick={() => setSelectedIds(selectedIds.length === jobs.length ? [] : jobs.map((job) => job.id))} aria-label="Select visible jobs">{selectedIds.length === jobs.length ? <CheckSquare size={17} /> : <Square size={17} />}</button></th><th>Job / customer</th><th>Lens / supplier</th><th>Status</th><th>Priority</th><th>ETA</th><th>Timeline preview</th><th /></tr></thead><tbody>{jobs.map((job) => <tr key={job.id}><td><input type="checkbox" checked={selectedIds.includes(job.id)} onChange={() => toggle(job.id)} aria-label={`Select ${job.jobNumber}`} /></td><td><strong>{job.jobNumber}</strong><small>{job.customerName} - {job.orderNumber}</small></td><td><strong>{[job.lensBrand, job.lensSeries].filter(Boolean).join(" ") || "Service job"}</strong><small>{job.supplierName ?? "No supplier"}</small></td><td><Badge variant={statusVariant(job.status)}>{label(job.status)}</Badge></td><td><Badge variant={job.priority === "URGENT" ? "danger" : job.priority === "HIGH" ? "warning" : "neutral"}>{label(job.priority)}</Badge></td><td><strong>{formatDate(job.promisedDeliveryDate ?? job.expectedDeliveryDate)}</strong><small><Badge variant={deliveryVariant(job.deliveryState)}>{label(job.deliveryState)}</Badge></small></td><td>{job.timelinePreview ?? "No events"}</td><td><Button size="sm" variant="ghost" onClick={() => void openDetail(job.id)} aria-label={`View ${job.jobNumber}`}><Eye size={16} /></Button></td></tr>)}</tbody></Table> : <DataUnavailable title="No optical jobs yet" description="Prescription spectacle invoices and repair jobs will appear here." icon={<ClipboardList size={22} />} />}</Card><div className="lens-master__pager"><span>{total} jobs</span><Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button><span>Page {page} of {pageCount}</span><Button size="sm" variant="secondary" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>Next</Button></div><JobDetailModal job={detail} onClose={() => setDetail(null)} onUpdated={reloadDetail} /></section>;
}

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, ClipboardCheck, Clock3, RotateCcw, ShieldAlert, Truck } from "lucide-react";
import toast from "react-hot-toast";
import { Badge, Button, Card, DataUnavailable, Modal, PageHeader, SearchBar, StatCard, Table } from "../../../components/ui";
import type { CompleteQualityInspectionDTO, JobTimelineEvent, LabReceivingSummary, OpticalLabJob } from "../../../types/optical";

const checklist = ["Correct Frame", "Correct Lens Power", "Correct Lens Type", "Correct Coating", "Frame Condition", "Lens Condition", "No Scratches", "No Cracks", "Cleaned", "Accessories Included"];
const reasons = ["WRONG_POWER", "WRONG_LENS", "WRONG_FRAME", "SCRATCHED_LENS", "DAMAGED_FRAME", "COATING_DEFECT", "OTHER"] as const;
type QueueStatus = "AT_LAB" | "RECEIVED_TODAY" | "QC_PENDING" | "REMAKE_REQUIRED" | "READY_FOR_DELIVERY";
const labels: Record<QueueStatus, string> = { AT_LAB: "Waiting at lab", RECEIVED_TODAY: "Received today", QC_PENDING: "QC pending", REMAKE_REQUIRED: "Remake required", READY_FOR_DELIVERY: "Ready for delivery" };

const dateOnly = (value?: string | null) => value?.slice(0, 10) ?? "";
const dateText = (value?: string | null) => value ? new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—";
function daysAtLab(job: OpticalLabJob) { return job.dispatchedAt ? Math.max(0, Math.floor((Date.now() - new Date(job.dispatchedAt).getTime()) / 86400000)) : 0; }
function groupFor(job: OpticalLabJob) { const today = new Date().toISOString().slice(0, 10); const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10); return dateOnly(job.dispatchedAt) === today ? "Today" : dateOnly(job.dispatchedAt) === yesterday ? "Yesterday" : "Older"; }

export default function LabReceivingPage() {
  const [jobs, setJobs] = useState<OpticalLabJob[]>([]);
  const [summary, setSummary] = useState<LabReceivingSummary>({ waitingAtLab: 0, receivedToday: 0, qcPending: 0, remakeRequired: 0, readyForDelivery: 0 });
  const [status, setStatus] = useState<QueueStatus>("AT_LAB");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [receiving, setReceiving] = useState<OpticalLabJob | null>(null);
  const [qcJob, setQcJob] = useState<OpticalLabJob | null>(null);
  const [remarks, setRemarks] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<"PASS" | "FAIL">("PASS");
  const [failureReason, setFailureReason] = useState<typeof reasons[number] | "">("");
  const [timeline, setTimeline] = useState<JobTimelineEvent[]>([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const [queue, counts] = await Promise.all([
        window.optical.getLabJobs({ stage: "RECEIVING", status, search }),
        window.optical.getLabReceivingSummary(),
      ]);
      setJobs(queue); setSummary(counts);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load Lab Receiving."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [status, search]);

  const grouped = useMemo(() => ["Today", "Yesterday", "Older"].map((title) => ({ title, items: jobs.filter((job) => groupFor(job) === title) })).filter((group) => group.items.length), [jobs]);
  const openQc = async (job: OpticalLabJob) => {
    setQcJob(job); setRemarks(""); setChecks(Object.fromEntries(checklist.map((item) => [item, false]))); setResult("PASS"); setFailureReason("");
    try { setTimeline(await window.optical.getTimeline(job.id)); } catch { setTimeline([]); }
  };
  const receive = async () => {
    if (!receiving) return;
    try {
      setSaving(true); await window.optical.receiveLabJob(receiving.id, { remarks });
      const job = { ...receiving, status: "QC_PENDING" as const };
      setReceiving(null); toast.success("Job received and moved to quality inspection."); await load(); await openQc(job);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to receive job."); }
    finally { setSaving(false); }
  };
  const saveQc = async () => {
    if (!qcJob) return;
    if (result === "PASS" && Object.values(checks).some((checked) => !checked)) return toast.error("All inspection checks must pass before recording QC as passed.");
    if (result === "FAIL" && !failureReason) return toast.error("Select a failure reason.");
    const data: CompleteQualityInspectionDTO = { checklist: checks, result, failureReason: failureReason || undefined, remarks };
    try {
      setSaving(true); await window.optical.completeQualityInspection(qcJob.id, data); setQcJob(null);
      toast.success(result === "PASS" ? "QC passed — ready for delivery." : "QC failed — remake is required."); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save quality inspection."); }
    finally { setSaving(false); }
  };
  const returnForRemake = async (job: OpticalLabJob) => {
    try { setSaving(true); await window.optical.returnForRemake(job.id); toast.success("Job returned to Lab Dispatch for remake."); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to return job for remake."); }
    finally { setSaving(false); }
  };
  const cards: { key: QueueStatus; label: string; value: number; icon: ReactNode }[] = [
    { key: "AT_LAB", label: "Waiting At Lab", value: summary.waitingAtLab, icon: <Truck size={19} /> },
    { key: "RECEIVED_TODAY", label: "Received Today", value: summary.receivedToday, icon: <Clock3 size={19} /> },
    { key: "QC_PENDING", label: "QC Pending", value: summary.qcPending, icon: <ClipboardCheck size={19} /> },
    { key: "REMAKE_REQUIRED", label: "Remake Required", value: summary.remakeRequired, icon: <ShieldAlert size={19} /> },
    { key: "READY_FOR_DELIVERY", label: "Ready For Delivery", value: summary.readyForDelivery, icon: <CheckCircle2 size={19} /> },
  ];

  return <section className="lab-receiving">
    <PageHeader eyebrow="Workflow #8 · inbound quality" title="Lab Receiving" subtitle="Receive completed spectacles, inspect quality, and return failures for remake." />
    <div className="lab-receiving__stats">{cards.map((card) => <button key={card.key} className={status === card.key ? "lab-receiving__stat is-active" : "lab-receiving__stat"} onClick={() => setStatus(card.key)}><StatCard label={card.label} value={card.value} icon={card.icon} /></button>)}</div>
    <Card className="lab-receiving__toolbar"><SearchBar value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch("")} placeholder="Search customer, invoice, job, frame, lens or lab" /><span><Clock3 size={15} /> {labels[status]}</span></Card>
    <Card className="lab-receiving__queue">
      <div className="lab-receiving__queue-head"><div><h2>{labels[status]}</h2><p>Jobs are grouped by dispatch date. Receiving always updates the existing optical job.</p></div><Badge variant="neutral">{jobs.length} jobs</Badge></div>
      {loading ? <p className="optical-page__loading">Loading lab receiving queue...</p> : grouped.length ? <Table><thead><tr><th>Job / invoice / customer</th><th>Frame / lens</th><th>Assigned lab</th><th>Dispatched</th><th>Days at lab</th><th>Expected delivery</th><th>Action</th></tr></thead><tbody>{grouped.map((group) => <><tr key={group.title} className="lab-receiving__group"><td colSpan={7}>{group.title}</td></tr>{group.items.map((job) => <tr key={job.id}><td><strong>{job.jobNumber}</strong><small>{job.orderNumber} · {job.customerName}</small></td><td><strong>{job.frameDescription || "Frame not recorded"}</strong><small>{[job.lensBrand, job.lensSeries].filter(Boolean).join(" ") || "Lens not recorded"}</small></td><td>{job.assignedLab || "—"}</td><td>{dateText(job.dispatchedAt)}</td><td>{daysAtLab(job)} days</td><td>{dateText(job.promisedDeliveryDate ?? job.expectedDeliveryDate)}</td><td>{job.status === "AT_LAB" ? <Button size="sm" onClick={() => { setReceiving(job); setRemarks(""); }}>Receive from lab</Button> : job.status === "QC_PENDING" ? <Button size="sm" onClick={() => void openQc(job)}>Inspect QC</Button> : job.status === "REMAKE_REQUIRED" ? <Button size="sm" variant="secondary" disabled={saving} onClick={() => void returnForRemake(job)}><RotateCcw size={14} /> Return for remake</Button> : <Badge variant="success">Ready</Badge>}</td></tr>)}</>)}</tbody></Table> : <DataUnavailable title={`No jobs ${labels[status].toLowerCase()}`} description="Jobs will appear here automatically as their workflow status changes." icon={<ClipboardCheck size={22} />} />}
    </Card>
    <Modal open={Boolean(receiving)} onClose={() => setReceiving(null)} title="Receive from lab" description={receiving ? `${receiving.jobNumber} · ${receiving.customerName}` : ""} footer={<><Button variant="secondary" onClick={() => setReceiving(null)}>Cancel</Button><Button disabled={saving} onClick={() => void receive()}>{saving ? "Receiving..." : "Receive & inspect"}</Button></>}>
      <div className="lab-receiving__form"><p>Record the return once. The job moves to QC Pending; no invoice or optical job is created.</p><label className="kv-field"><span className="kv-field__label">Receiving remarks</span><textarea rows={4} value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Optional condition or handover notes" /></label></div>
    </Modal>
    <Modal open={Boolean(qcJob)} onClose={() => setQcJob(null)} title="Quality inspection" description={qcJob ? `${qcJob.jobNumber} · ${qcJob.customerName}` : ""} width={920} closeOnBackdrop={false} footer={<><Button variant="secondary" onClick={() => setQcJob(null)}>Cancel</Button><Button disabled={saving} onClick={() => void saveQc()}>{saving ? "Saving..." : result === "PASS" ? "Pass QC" : "Record QC failure"}</Button></>}>
      <div className="lab-receiving__inspection"><section><h3>Inspection checklist</h3><div className="lab-receiving__checks">{checklist.map((item) => <label key={item}><input type="checkbox" checked={Boolean(checks[item])} onChange={(event) => setChecks((current) => ({ ...current, [item]: event.target.checked }))} />{item}</label>)}</div><div className="lab-receiving__outcome"><button type="button" className={result === "PASS" ? "is-pass" : ""} onClick={() => setResult("PASS")}>Pass — Ready for delivery</button><button type="button" className={result === "FAIL" ? "is-fail" : ""} onClick={() => setResult("FAIL")}>Fail — Remake required</button></div>{result === "FAIL" && <label className="kv-field"><span className="kv-field__label">Failure reason *</span><select value={failureReason} onChange={(event) => setFailureReason(event.target.value as typeof reasons[number] | "")}><option value="">Select a reason</option>{reasons.map((reason) => <option key={reason} value={reason}>{reason.replaceAll("_", " ").toLowerCase()}</option>)}</select></label>}<label className="kv-field"><span className="kv-field__label">QC remarks</span><textarea rows={3} value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Optional inspection notes" /></label></section><aside><h3>Job timeline</h3><ol>{timeline.map((event) => <li key={event.id}><strong>{event.description}</strong><small>{dateText(event.createdAt)} · {event.performedBy}</small></li>)}</ol></aside></div>
    </Modal>
  </section>;
}

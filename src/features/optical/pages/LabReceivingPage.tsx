import { useEffect, useState } from "react";
import { ClipboardCheck, RotateCcw, ShieldX } from "lucide-react";
import toast from "react-hot-toast";
import { Badge, Button, Card, DataUnavailable, Modal, PageHeader, Table } from "../../../components/ui";
import type { OpticalLabJob, ReceiveLabOrderDTO } from "../../../types/optical";

type Inspection = ReceiveLabOrderDTO["inspection"];

function deliveryDate(job: OpticalLabJob) {
  return job.promisedDeliveryDate ?? job.expectedDeliveryDate ?? "Not scheduled";
}

export default function LabReceivingPage() {
  const [jobs, setJobs] = useState<OpticalLabJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OpticalLabJob | null>(null);
  const [inspection, setInspection] = useState<Inspection>("ACCEPT");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadJobs() {
    try {
      setLoading(true);
      setJobs(await window.optical.getLabJobs({ stage: "RECEIVING" }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load the receiving queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadJobs(); }, []);

  const openInspection = (job: OpticalLabJob) => {
    setSelected(job);
    setInspection("ACCEPT");
    setNotes("");
  };

  const receive = async () => {
    if (!selected) return;
    if ((inspection === "REJECT" || inspection === "REMAKE") && !notes.trim()) {
      toast.error("Document the inspection finding before rejecting or requesting a remake.");
      return;
    }
    try {
      setSaving(true);
      await window.optical.receiveLabJob(selected.id, { inspection, notes });
      toast.success(inspection === "ACCEPT" ? "Lenses accepted; fitting is ready." : inspection === "REJECT" ? "Lab order rejected and job placed on hold." : "Remake requested and returned to dispatch.");
      setSelected(null);
      await loadJobs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to receive optical job.");
    } finally {
      setSaving(false);
    }
  };

  return <section className="optical-page">
    <PageHeader eyebrow="Inbound quality" title="Lab Receiving" subtitle="Receive and inspect customer-specific RX lenses from the Optical Job queue." action={<Badge variant="info">{jobs.length} awaiting inspection</Badge>} />
    <Card className="optical-page__guide"><ClipboardCheck size={18} /><p>Receiving updates the Optical Job, its event timeline, and job-linked notifications without changing reserved frame stock.</p></Card>
    <Card className="optical-page__queue">
      {loading ? <p className="optical-page__loading">Loading receiving queue...</p> : jobs.length ? <Table>
        <thead><tr><th>Lab order</th><th>Job / customer</th><th>Supplier</th><th>Dispatched</th><th>Expected</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>{jobs.map((job) => <tr key={job.id}><td><strong>{job.labOrderNumber}</strong><small>{job.trackingNumber ?? "No tracking number"}</small></td><td><strong>{job.jobNumber}</strong><small>{job.customerName}</small></td><td>{job.supplierName}</td><td>{job.dispatchedAt ?? "Not recorded"}</td><td>{deliveryDate(job)}</td><td><Badge variant="warning">{job.status.replaceAll("_", " ")}</Badge></td><td><Button size="sm" onClick={() => openInspection(job)}>Receive & inspect</Button></td></tr>)}</tbody>
      </Table> : <DataUnavailable title="No optical jobs to receive" description="Dispatched optical jobs appear here for inspection." icon={<ClipboardCheck size={22} />} />}
    </Card>
    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Inspect returned lenses" description={selected ? `${selected.labOrderNumber} - ${selected.jobNumber} - ${selected.customerName}` : ""} width={620} closeOnBackdrop={false} footer={<><Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button><Button onClick={() => void receive()} disabled={saving}>{saving ? "Saving..." : inspection === "ACCEPT" ? "Accept lenses" : inspection === "REJECT" ? "Reject lenses" : "Request remake"}</Button></>}>
      <div className="lab-receiving__inspection"><p>Check lens power, coating, fit, and physical condition before choosing an outcome.</p><div role="group" aria-label="Receiving outcome" className="lab-receiving__choices"><button type="button" className={inspection === "ACCEPT" ? "is-active accept" : ""} onClick={() => setInspection("ACCEPT")}><ClipboardCheck size={18} /> Accept</button><button type="button" className={inspection === "REJECT" ? "is-active reject" : ""} onClick={() => setInspection("REJECT")}><ShieldX size={18} /> Reject</button><button type="button" className={inspection === "REMAKE" ? "is-active remake" : ""} onClick={() => setInspection("REMAKE")}><RotateCcw size={18} /> Request remake</button></div><label className="kv-field"><span className="kv-field__label">Inspection notes {inspection === "ACCEPT" ? "(optional)" : "*"}</span><textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={inspection === "ACCEPT" ? "Optional acceptance notes" : "Describe the issue for the lab"} /></label></div>
    </Modal>
  </section>;
}

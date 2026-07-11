import { useEffect, useMemo, useState } from "react";
import { CheckSquare, Mail, Printer, Send, Square } from "lucide-react";
import toast from "react-hot-toast";
import { Badge, Button, Card, DataUnavailable, Input, PageHeader, Table } from "../../../components/ui";
import type { OpticalLabJob } from "../../../types/optical";

function dispatchDateToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function deliveryDate(job: OpticalLabJob) {
  return job.promisedDeliveryDate ?? job.expectedDeliveryDate ?? "Not scheduled";
}

export default function LabDispatchPage() {
  const [jobs, setJobs] = useState<OpticalLabJob[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [dispatchDate, setDispatchDate] = useState(dispatchDateToday());
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(true);
  const selectedJobs = useMemo(() => jobs.filter((job) => selected.includes(job.id)), [jobs, selected]);
  const supplierGroups = useMemo(() => {
    const groups = new Map<string, OpticalLabJob[]>();
    selectedJobs.forEach((job) => {
      const supplier = job.supplierName ?? "Unassigned supplier";
      groups.set(supplier, [...(groups.get(supplier) ?? []), job]);
    });
    return [...groups.entries()];
  }, [selectedJobs]);

  async function loadJobs() {
    try {
      setLoading(true);
      setJobs(await window.optical.getLabJobs({ stage: "DISPATCH" }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load optical jobs awaiting dispatch.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadJobs(); }, []);

  const toggle = (id: number) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const dispatchSelected = async () => {
    try {
      await window.optical.dispatchLabJobs({ jobIds: selectedJobs.map((job) => job.id), dispatchDate, courier, trackingNumber, remarks });
      toast.success(`${selectedJobs.length} optical job${selectedJobs.length === 1 ? "" : "s"} dispatched.`);
      setSelected([]);
      setCourier("");
      setTrackingNumber("");
      setRemarks("");
      await loadJobs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to dispatch optical jobs.");
    }
  };

  const printSheet = () => {
    const body = supplierGroups.map(([supplier, items]) => `<section><h1>${supplier} - Lab Dispatch</h1><p>Manufacturing document. Commercial values are excluded.</p><p><strong>Dispatch:</strong> ${dispatchDate} - ${courier || "Courier not recorded"} - ${trackingNumber || "Tracking not recorded"}</p><table><thead><tr><th>Lab order</th><th>Job</th><th>Customer</th><th>Expected</th></tr></thead><tbody>${items.map((item) => `<tr><td>${item.labOrderNumber}</td><td>${item.jobNumber}</td><td>${item.customerName}</td><td>${deliveryDate(item)}</td></tr>`).join("")}</tbody></table><p>${remarks || ""}</p></section>`).join("<hr />");
    const popup = window.open("", "lab-dispatch", "width=900,height=700");
    if (!popup) {
      toast.error("Allow pop-ups to print the dispatch sheet.");
      return;
    }
    popup.document.write(`<html><head><title>Lab Dispatch</title><style>body{font-family:Arial;padding:24px;color:#18202a}table{width:100%;border-collapse:collapse}th,td{border:1px solid #aab4c0;padding:8px;text-align:left}section{page-break-after:always}hr{page-break-after:always;border:0}</style></head><body>${body}</body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const message = encodeURIComponent(`Klear Vision lab dispatch: ${selectedJobs.map((item) => `${item.labOrderNumber} (${item.jobNumber})`).join(", ")}`);

  return <section className="optical-page">
    <PageHeader eyebrow="Manufacturing workspace" title="Lab Dispatch" subtitle="Group RX jobs by their assigned supplier and retain dispatch proof." action={<Badge variant="warning">{jobs.length} pending</Badge>} />
    <Card className="lab-dispatch__toolbar">
      <div className="lab-dispatch__metadata">
        <Input label="Dispatch date" type="date" value={dispatchDate} onChange={(event) => setDispatchDate(event.target.value)} />
        <Input label="Courier" value={courier} onChange={(event) => setCourier(event.target.value)} placeholder="Courier or runner" />
        <Input label="Tracking number" value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} />
        <Input label="Dispatch remarks" value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Lab instructions" />
      </div>
      <div className="lab-dispatch__actions">
        <span>{selectedJobs.length} selected - {supplierGroups.length} supplier group{supplierGroups.length === 1 ? "" : "s"}</span>
        <Button variant="secondary" disabled={!selectedJobs.length} onClick={printSheet}><Printer size={16} /> Print / Save PDF</Button>
        <Button variant="secondary" disabled={!selectedJobs.length} onClick={() => window.open(`mailto:?subject=Klear Vision lab dispatch&body=${message}`)}><Mail size={16} /> Email</Button>
        <Button variant="secondary" disabled={!selectedJobs.length} onClick={() => window.open(`https://wa.me/?text=${message}`, "_blank", "noopener,noreferrer")}><Send size={16} /> WhatsApp</Button>
        <Button disabled={!selectedJobs.length || !dispatchDate} onClick={() => void dispatchSelected()}><Send size={16} /> Mark dispatched</Button>
      </div>
    </Card>
    <Card className="optical-page__queue">
      {loading ? <p className="optical-page__loading">Loading lab dispatch queue...</p> : jobs.length ? <Table>
        <thead><tr><th><button className="lab-dispatch__select" type="button" aria-label="Select all pending jobs" onClick={() => setSelected(selected.length === jobs.length ? [] : jobs.map((job) => job.id))}>{selected.length === jobs.length ? <CheckSquare size={17} /> : <Square size={17} />}</button></th><th>Lab order</th><th>Job / customer</th><th>Supplier</th><th>Expected</th><th>Status</th></tr></thead>
        <tbody>{jobs.map((job) => <tr key={job.id}><td><input type="checkbox" checked={selected.includes(job.id)} onChange={() => toggle(job.id)} aria-label={`Select ${job.jobNumber}`} /></td><td><strong>{job.labOrderNumber}</strong><small>{job.orderNumber}</small></td><td><strong>{job.jobNumber}</strong><small>{job.customerName}</small></td><td>{job.supplierName}</td><td>{deliveryDate(job)}</td><td><Badge variant={job.status === "REMAKE" ? "danger" : "warning"}>{job.status.replaceAll("_", " ")}</Badge></td></tr>)}</tbody>
      </Table> : <DataUnavailable title="No optical jobs awaiting dispatch" description="RX jobs awaiting supplier dispatch will appear here." />}
    </Card>
  </section>;
}

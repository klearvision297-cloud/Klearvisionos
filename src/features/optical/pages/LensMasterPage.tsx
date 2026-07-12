import { useEffect, useMemo, useState } from "react";
import { BarChart3, CircleDollarSign, Layers3, Pencil, Plus, Power, Search, SlidersHorizontal } from "lucide-react";
import toast from "react-hot-toast";
import { Badge, Button, Card, DataUnavailable, Input, Modal, PageHeader, Table } from "../../../components/ui";
import type { Supplier } from "../../../types/supplier";
import type { LensCatalogueSummary, LensFeatures, LensSeries, LensSeriesInput, LensSeriesQuery } from "../../../types/optical";
import "../styles/lensCatalogue.css";

const emptyFeatures: LensFeatures = {
  singleVision: false, bifocal: false, progressive: false, officeLens: false, blueCut: false,
  photochromic: false, polarized: false, transitions: false, aspheric: false, digital: false,
  scratchResistant: false, antiReflection: false, hydrophobic: false, uvProtection: false, tint: false, mirror: false,
};
const emptyLens: LensSeriesInput = {
  brand: "", series: "", category: "", material: "", lensIndex: "", coating: "", tintName: "",
  supplierId: undefined, defaultCost: 0, defaultSellingPrice: 0, defaultTurnaroundDays: 0,
  internalNotes: "", isActive: true, ...emptyFeatures,
};
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

function SelectField({ label, value, onChange, children }: { label: string; value: string | number; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="lens-catalogue__field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></label>;
}

function LensFormModal({ open, lens, suppliers, onClose, onSaved }: { open: boolean; lens: LensSeries | null; suppliers: Supplier[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<LensSeriesInput>(emptyLens);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!open) return;
    setForm(lens ? { ...emptyLens, ...lens, supplierId: lens.supplierId ?? undefined } : emptyLens);
  }, [lens, open]);
  const set = <K extends keyof LensSeriesInput>(key: K, value: LensSeriesInput[K]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      if (lens) await window.optical.updateLensSeries(lens.id, form);
      else await window.optical.createLensSeries(form);
      toast.success(lens ? "Lens series updated." : "Lens series created.");
      onSaved(); onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save lens series.");
    } finally { setSaving(false); }
  };
  return <Modal open={open} onClose={onClose} title={lens ? "Edit lens series" : "New lens series"} description="Reusable catalogue data only — this never creates inventory or stock movements." width={920} closeOnBackdrop={false} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="lens-series-form" disabled={saving}>{saving ? "Saving…" : "Save lens series"}</Button></>}>
    <form id="lens-series-form" className="lens-catalogue__form" onSubmit={submit}>
      <section><h3>General</h3><div className="lens-catalogue__form-grid">
        <Input label="Brand *" value={form.brand} onChange={(event) => set("brand", event.target.value)} autoFocus />
        <Input label="Series name *" value={form.series} onChange={(event) => set("series", event.target.value)} />
        <Input label="Category" placeholder="e.g. Progressive" value={form.category ?? ""} onChange={(event) => set("category", event.target.value)} />
        <SelectField label="Supplier" value={form.supplierId ?? ""} onChange={(value) => set("supplierId", value ? Number(value) : undefined)}><option value="">No supplier assigned</option>{suppliers.filter((supplier) => supplier.isActive).map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.supplierName}</option>)}</SelectField>
        <label className="lens-catalogue__textarea"><span>Description</span><textarea value={form.internalNotes ?? ""} onChange={(event) => set("internalNotes", event.target.value)} placeholder="Optional internal description or usage note" /></label>
      </div></section>
      <section><h3>Optical properties</h3><div className="lens-catalogue__form-grid">
        <Input label="Index" placeholder="e.g. 1.67" value={form.lensIndex ?? ""} onChange={(event) => set("lensIndex", event.target.value)} />
        <Input label="Material" placeholder="e.g. Polycarbonate" value={form.material ?? ""} onChange={(event) => set("material", event.target.value)} />
        <Input label="Coating" placeholder="e.g. Anti glare" value={form.coating ?? ""} onChange={(event) => set("coating", event.target.value)} />
        <Input label="Tint" value={form.tintName ?? ""} onChange={(event) => set("tintName", event.target.value)} />
      </div><div className="lens-catalogue__feature-grid">
        {(["blueCut", "photochromic", "polarized", "tint"] as const).map((feature) => <label key={feature}><input type="checkbox" checked={form[feature]} onChange={(event) => set(feature, event.target.checked)} /> {feature === "blueCut" ? "Blue Cut" : feature[0].toUpperCase() + feature.slice(1)}</label>)}
      </div></section>
      <section><h3>Pricing & status</h3><div className="lens-catalogue__form-grid">
        <Input label="Cost price" type="number" min="0" value={form.defaultCost} onChange={(event) => set("defaultCost", Number(event.target.value || 0))} />
        <Input label="Selling price" type="number" min="0" value={form.defaultSellingPrice} onChange={(event) => set("defaultSellingPrice", Number(event.target.value || 0))} />
        <label className="lens-catalogue__status-toggle"><input type="checkbox" checked={form.isActive !== false} onChange={(event) => set("isActive", event.target.checked)} /> Active in prescription billing</label>
      </div></section>
    </form>
  </Modal>;
}

export default function LensMasterPage() {
  const [lenses, setLenses] = useState<LensSeries[]>([]);
  const [summary, setSummary] = useState<LensCatalogueSummary>({ activeCount: 0, inactiveCount: 0, mostUsedBrand: null, mostUsedSeries: null });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [supplierId, setSupplierId] = useState<number | undefined>();
  const [status, setStatus] = useState<LensSeriesQuery["status"]>("ACTIVE");
  const [sort, setSort] = useState<NonNullable<LensSeriesQuery["sort"]>>("BRAND");
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LensSeries | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((key) => key + 1);

  useEffect(() => { void Promise.all([window.supplier.getAll(), window.optical.getLensCatalogueSummary()]).then(([nextSuppliers, nextSummary]) => { setSuppliers(nextSuppliers); setSummary(nextSummary); }).catch(() => toast.error("Unable to load lens catalogue lookups.")); }, [reloadKey]);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void window.optical.getLensSeries({ search, brand: brand || undefined, category: category || undefined, supplierId, status, sort, pageSize: 100 }).then((result) => {
        if (active) { setLenses(result.items); setTotal(result.total); }
      }).catch((error) => toast.error(error instanceof Error ? error.message : "Unable to load lens catalogue."));
    }, 160);
    return () => { active = false; window.clearTimeout(timer); };
  }, [brand, category, reloadKey, search, sort, status, supplierId]);

  const brands = useMemo(() => Array.from(new Set(lenses.map((lens) => lens.brand))).sort((a, b) => a.localeCompare(b)), [lenses]);
  const categories = useMemo(() => Array.from(new Set(lenses.map((lens) => lens.category).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b)), [lenses]);
  const toggleActive = async (lens: LensSeries) => { try { await window.optical.setLensSeriesActive(lens.id, !lens.isActive); toast.success(lens.isActive ? "Lens series deactivated." : "Lens series reactivated."); reload(); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update lens status."); } };

  return <section className="lens-catalogue">
    <PageHeader eyebrow="Optical catalogue" title="Lens Catalogue" subtitle="Maintain the lens series you sell. Lens catalogue is used during prescription billing. Lenses are ordered when required and are never managed as inventory." action={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={16} /> New Lens Series</Button>} />
    <div className="lens-catalogue__stats">
      <Card><Layers3 size={19} /><span>Active Lens Series</span><strong>{summary.activeCount}</strong></Card>
      <Card><Power size={19} /><span>Inactive Lens Series</span><strong>{summary.inactiveCount}</strong></Card>
      <Card><BarChart3 size={19} /><span>Most Used Brand</span><strong>{summary.mostUsedBrand ?? "—"}</strong></Card>
      <Card><CircleDollarSign size={19} /><span>Most Used Lens Series</span><strong>{summary.mostUsedSeries ?? "—"}</strong></Card>
    </div>
    <Card className="lens-catalogue__toolbar"><label className="lens-catalogue__search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search brand, series, category, supplier, index, material or coating" /></label><div className="lens-catalogue__filters"><SlidersHorizontal size={16} /><SelectField label="Brand" value={brand} onChange={setBrand}><option value="">All brands</option>{brands.map((item) => <option key={item}>{item}</option>)}</SelectField><SelectField label="Category" value={category} onChange={setCategory}><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</SelectField><SelectField label="Supplier" value={supplierId ?? ""} onChange={(value) => setSupplierId(value ? Number(value) : undefined)}><option value="">All suppliers</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.supplierName}</option>)}</SelectField><SelectField label="Status" value={status ?? "ALL"} onChange={(value) => setStatus(value as LensSeriesQuery["status"])}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="ALL">All statuses</option></SelectField><SelectField label="Sort" value={sort} onChange={(value) => setSort(value as NonNullable<LensSeriesQuery["sort"]>)}><option value="BRAND">Brand</option><option value="SERIES">Alphabetical</option><option value="RECENTLY_USED">Recently used</option><option value="CREATED">Recently created</option><option value="PRICE">Price</option></SelectField></div></Card>
    <Card className="lens-catalogue__table">{lenses.length ? <><div className="lens-catalogue__table-heading"><strong>{total} lens series</strong><span>Usage is calculated directly from saved orders.</span></div><Table><thead><tr><th>Lens series</th><th>Optical properties</th><th>Supplier</th><th>Selling price</th><th>Used in</th><th>Last used</th><th>Status</th><th /></tr></thead><tbody>{lenses.map((lens) => <tr key={lens.id}><td><strong>{lens.brand}</strong><small>{lens.series}{lens.category ? ` · ${lens.category}` : ""}</small></td><td><strong>{lens.lensIndex ? `Index ${lens.lensIndex}` : "—"}</strong><small>{[lens.material, lens.coating, lens.blueCut && "Blue Cut", lens.photochromic && "Photochromic"].filter(Boolean).join(" · ") || "No properties"}</small></td><td>{lens.supplierName ?? "Unassigned"}</td><td>{money.format(lens.defaultSellingPrice)}</td><td>{lens.usageCount ?? 0} order{lens.usageCount === 1 ? "" : "s"}</td><td>{lens.lastUsedAt ? dateTime.format(new Date(lens.lastUsedAt)) : "Never"}</td><td><Badge variant={lens.isActive ? "success" : "neutral"}>{lens.isActive ? "Active" : "Inactive"}</Badge></td><td className="lens-catalogue__actions"><Button size="sm" variant="ghost" onClick={() => { setEditing(lens); setModalOpen(true); }} aria-label={`Edit ${lens.brand} ${lens.series}`}><Pencil size={16} /></Button><Button size="sm" variant="ghost" onClick={() => void toggleActive(lens)} aria-label={`${lens.isActive ? "Deactivate" : "Reactivate"} ${lens.brand} ${lens.series}`}><Power size={16} /></Button></td></tr>)}</tbody></Table></> : <DataUnavailable title="No lens series found" description="Create your first lens series. It will be available immediately in prescription billing and will never create inventory." icon={<Layers3 size={24} />} />}</Card>
    <LensFormModal open={modalOpen} lens={editing} suppliers={suppliers} onClose={() => setModalOpen(false)} onSaved={reload} />
  </section>;
}

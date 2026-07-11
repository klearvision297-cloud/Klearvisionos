import { useEffect, useMemo, useState } from "react";
import { Copy, Layers3, Pencil, Plus, Power, Search, Settings2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Badge, Button, Card, DataUnavailable, Input, Modal, PageHeader, Table } from "../../../components/ui";
import type { Supplier } from "../../../types/supplier";
import type {
  AvailabilityConditionField,
  AvailabilityConditionOperator,
  AvailabilityDecision,
  AvailabilityProfile,
  AvailabilityProfileCondition,
  AvailabilityProfileRule,
  CreateAvailabilityProfileDTO,
  LensFeatures,
  LensSeries,
  LensSeriesInput,
} from "../../../types/optical";

const featureLabels: Record<keyof LensFeatures, string> = {
  singleVision: "Single vision", bifocal: "Bifocal", progressive: "Progressive", officeLens: "Office", blueCut: "Blue cut", photochromic: "Photochromic", polarized: "Polarized", transitions: "Transitions", aspheric: "Aspheric", digital: "Digital", scratchResistant: "Scratch resistant", antiReflection: "Anti reflection", hydrophobic: "Hydrophobic", uvProtection: "UV protection", tint: "Tint", mirror: "Mirror",
};
const featureKeys = Object.keys(featureLabels) as (keyof LensFeatures)[];
const fieldLabels: Record<AvailabilityConditionField, string> = {
  rightSphere: "OD sphere", rightCylinder: "OD cylinder", rightAxis: "OD axis", rightAdd: "OD add", rightPD: "OD PD", rightHeight: "OD height", rightPrism: "OD prism", leftSphere: "OS sphere", leftCylinder: "OS cylinder", leftAxis: "OS axis", leftAdd: "OS add", leftPD: "OS PD", leftHeight: "OS height", leftPrism: "OS prism",
};

const emptyFeatures: LensFeatures = {
  singleVision: false, bifocal: false, progressive: false, officeLens: false, blueCut: false, photochromic: false, polarized: false, transitions: false, aspheric: false, digital: false, scratchResistant: false, antiReflection: false, hydrophobic: false, uvProtection: false, tint: false, mirror: false,
};
const emptyLens: LensSeriesInput = { brand: "", series: "", material: "", lensIndex: "", design: "", coating: "", defaultTurnaroundDays: 0, defaultCost: 0, defaultSellingPrice: 0, internalNotes: "", isActive: true, ...emptyFeatures };

type EditableCondition = Omit<AvailabilityProfileCondition, "minimum" | "maximum"> & { minimum: string; maximum: string };
type EditableRule = Omit<AvailabilityProfileRule, "conditions"> & { conditions: EditableCondition[] };
type ProfileForm = { name: string; description: string; defaultDecision: AvailabilityDecision; isActive: boolean; rules: EditableRule[] };

const emptyProfile: ProfileForm = { name: "", description: "", defaultDecision: "REVIEW_REQUIRED", isActive: true, rules: [] };
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function profileForm(profile: AvailabilityProfile | null): ProfileForm {
  if (!profile) return emptyProfile;
  return {
    name: profile.name,
    description: profile.description ?? "",
    defaultDecision: profile.rules.defaultDecision,
    isActive: profile.isActive,
    rules: profile.rules.rules.map((rule) => ({ decision: rule.decision, conditions: rule.conditions.map((condition) => ({ ...condition, minimum: condition.minimum?.toString() ?? "", maximum: condition.maximum?.toString() ?? "" })) })),
  };
}

function toProfileDto(form: ProfileForm): CreateAvailabilityProfileDTO {
  return {
    name: form.name,
    description: form.description,
    isActive: form.isActive,
    rules: {
      defaultDecision: form.defaultDecision,
      rules: form.rules.map((rule) => ({
        decision: rule.decision,
        conditions: rule.conditions.map((condition) => ({
          field: condition.field,
          operator: condition.operator,
          minimum: condition.minimum === "" ? undefined : Number(condition.minimum),
          maximum: condition.maximum === "" ? undefined : Number(condition.maximum),
        })),
      })),
    },
  };
}

function LensFormModal({ open, lens, suppliers, profiles, onClose, onSaved }: { open: boolean; lens: LensSeries | null; suppliers: Supplier[]; profiles: AvailabilityProfile[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<LensSeriesInput>(emptyLens);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!open) return;
    setForm(lens ? { ...emptyLens, ...lens, supplierId: lens.supplierId ?? undefined, availabilityProfileId: lens.availabilityProfileId ?? undefined } : emptyLens);
  }, [lens, open]);
  const update = <K extends keyof LensSeriesInput>(key: K, value: LensSeriesInput[K]) => setForm((current) => ({ ...current, [key]: value }));
  const save = async () => {
    try {
      setSaving(true);
      if (lens) await window.optical.updateLensSeries(lens.id, form);
      else await window.optical.createLensSeries(form);
      toast.success(lens ? "Lens series updated." : "Lens series added.");
      onSaved(); onClose();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save lens series."); } finally { setSaving(false); }
  };
  return <Modal open={open} onClose={onClose} title={lens ? "Edit lens series" : "New lens series"} description="Product template for future optical jobs. It never creates inventory." width={980} closeOnBackdrop={false} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save lens series"}</Button></>}><div className="lens-master__form"><section><h3>Catalogue</h3><div className="lens-master__form-grid"><Input label="Brand *" value={form.brand} onChange={(event) => update("brand", event.target.value)} autoFocus /><Input label="Series *" value={form.series} onChange={(event) => update("series", event.target.value)} /><Input label="Material" value={form.material} onChange={(event) => update("material", event.target.value)} /><Input label="Index" value={form.lensIndex} onChange={(event) => update("lensIndex", event.target.value)} /><Input label="Design" value={form.design} onChange={(event) => update("design", event.target.value)} /><Input label="Coating" value={form.coating} onChange={(event) => update("coating", event.target.value)} /></div></section><section><h3>Fulfilment</h3><div className="lens-master__form-grid"><label className="kv-field"><span className="kv-field__label">Preferred supplier</span><select value={form.supplierId ?? ""} onChange={(event) => update("supplierId", event.target.value ? Number(event.target.value) : undefined)}><option value="">No supplier selected</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.supplierName} · {supplier.turnaroundDays}d</option>)}</select></label><label className="kv-field"><span className="kv-field__label">Availability profile</span><select value={form.availabilityProfileId ?? ""} onChange={(event) => update("availabilityProfileId", event.target.value ? Number(event.target.value) : undefined)}><option value="">Profile required at billing</option>{profiles.filter((profile) => profile.isActive).map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label><Input label="Default turnaround (business days)" type="number" min="0" value={form.defaultTurnaroundDays} onChange={(event) => update("defaultTurnaroundDays", Number(event.target.value))} /><Input label="Warranty (months)" type="number" min="0" value={form.warrantyMonths ?? ""} onChange={(event) => update("warrantyMonths", event.target.value ? Number(event.target.value) : undefined)} /><Input label="Purchase cost" type="number" min="0" value={form.defaultCost} onChange={(event) => update("defaultCost", Number(event.target.value))} /><Input label="Recommended selling price" type="number" min="0" value={form.defaultSellingPrice} onChange={(event) => update("defaultSellingPrice", Number(event.target.value))} /></div></section><section><h3>Features</h3><div className="lens-master__feature-grid">{featureKeys.map((feature) => <label key={feature}><input type="checkbox" checked={form[feature]} onChange={(event) => update(feature, event.target.checked)} /> {featureLabels[feature]}</label>)}</div></section><section className="lens-master__notes"><label className="kv-field"><span className="kv-field__label">Internal notes</span><textarea rows={3} value={form.internalNotes} onChange={(event) => update("internalNotes", event.target.value)} /></label><label className="lens-master__active"><input type="checkbox" checked={form.isActive !== false} onChange={(event) => update("isActive", event.target.checked)} /> Active in Billing</label></section></div></Modal>;
}

function ProfileModal({ open, profile, onClose, onSaved }: { open: boolean; profile: AvailabilityProfile | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<ProfileForm>(emptyProfile);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setForm(profileForm(profile)); }, [open, profile]);
  const updateRule = (index: number, value: EditableRule) => setForm((current) => ({ ...current, rules: current.rules.map((rule, ruleIndex) => ruleIndex === index ? value : rule) }));
  const save = async () => {
    try { setSaving(true); const data = toProfileDto(form); if (profile) await window.optical.updateAvailabilityProfile(profile.id, data); else await window.optical.createAvailabilityProfile(data); toast.success(profile ? "Availability profile updated." : "Availability profile added."); onSaved(); onClose(); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save availability profile."); } finally { setSaving(false); }
  };
  return <Modal open={open} onClose={onClose} title={profile ? "Edit availability profile" : "New availability profile"} description="Rules are evaluated by the service; Billing does not hardcode optical ranges." width={900} closeOnBackdrop={false} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button></>}><div className="lens-master__form"><div className="lens-master__form-grid"><Input label="Profile name *" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} autoFocus /><label className="kv-field"><span className="kv-field__label">Default outcome</span><select value={form.defaultDecision} onChange={(event) => setForm((current) => ({ ...current, defaultDecision: event.target.value as AvailabilityDecision }))}><option value="READY_STOCK">Ready stock</option><option value="RX">RX order</option><option value="REVIEW_REQUIRED">Review required</option></select></label></div><label className="kv-field"><span className="kv-field__label">Description</span><textarea rows={2} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label><div className="lens-master__profile-rules"><div><h3>Conditional outcomes</h3><p>Rules run in this order; the first matching rule wins.</p></div><Button size="sm" variant="secondary" onClick={() => setForm((current) => ({ ...current, rules: [...current.rules, { decision: "REVIEW_REQUIRED", conditions: [{ field: "rightSphere", operator: "BETWEEN", minimum: "", maximum: "" }] }] }))}><Plus size={14} /> Add rule</Button>{form.rules.map((rule, ruleIndex) => <div className="lens-master__rule" key={`${ruleIndex}-${rule.decision}`}><header><strong>Rule {ruleIndex + 1}</strong><label><span>Outcome</span><select value={rule.decision} onChange={(event) => updateRule(ruleIndex, { ...rule, decision: event.target.value as AvailabilityDecision })}><option value="READY_STOCK">Ready stock</option><option value="RX">RX order</option><option value="REVIEW_REQUIRED">Review required</option></select></label><Button size="sm" variant="ghost" onClick={() => setForm((current) => ({ ...current, rules: current.rules.filter((_, index) => index !== ruleIndex) }))}><Trash2 size={14} /></Button></header>{rule.conditions.map((condition, conditionIndex) => <div className="lens-master__condition" key={`${condition.field}-${conditionIndex}`}><select value={condition.field} onChange={(event) => { const conditions = [...rule.conditions]; conditions[conditionIndex] = { ...condition, field: event.target.value as AvailabilityConditionField }; updateRule(ruleIndex, { ...rule, conditions }); }}>{Object.entries(fieldLabels).map(([field, label]) => <option key={field} value={field}>{label}</option>)}</select><select value={condition.operator} onChange={(event) => { const conditions = [...rule.conditions]; conditions[conditionIndex] = { ...condition, operator: event.target.value as AvailabilityConditionOperator }; updateRule(ruleIndex, { ...rule, conditions }); }}><option value="BETWEEN">Within range</option><option value="PRESENT">Is present</option><option value="ABSENT">Is blank</option></select>{condition.operator === "BETWEEN" ? <><Input label="Min" type="number" value={condition.minimum} onChange={(event) => { const conditions = [...rule.conditions]; conditions[conditionIndex] = { ...condition, minimum: event.target.value }; updateRule(ruleIndex, { ...rule, conditions }); }} /><Input label="Max" type="number" value={condition.maximum} onChange={(event) => { const conditions = [...rule.conditions]; conditions[conditionIndex] = { ...condition, maximum: event.target.value }; updateRule(ruleIndex, { ...rule, conditions }); }} /></> : <span className="lens-master__condition-fill">No numeric range required</span>}<Button size="sm" variant="ghost" onClick={() => updateRule(ruleIndex, { ...rule, conditions: rule.conditions.filter((_, index) => index !== conditionIndex) })}><Trash2 size={14} /></Button></div>)}<Button size="sm" variant="secondary" onClick={() => updateRule(ruleIndex, { ...rule, conditions: [...rule.conditions, { field: "rightSphere", operator: "BETWEEN", minimum: "", maximum: "" }] })}><Plus size={14} /> Add condition</Button></div>)}</div><label className="lens-master__active"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} /> Active profile</label></div></Modal>;
}

export default function LensMasterPage() {
  const [view, setView] = useState<"LENSES" | "PROFILES">("LENSES");
  const [lenses, setLenses] = useState<LensSeries[]>([]);
  const [profiles, setProfiles] = useState<AvailabilityProfile[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "ALL">("ACTIVE");
  const [supplierId, setSupplierId] = useState<number | undefined>();
  const [sort, setSort] = useState<"BRAND" | "SERIES" | "PRICE" | "UPDATED">("BRAND");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [lensModalOpen, setLensModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedLens, setSelectedLens] = useState<LensSeries | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<AvailabilityProfile | null>(null);

  const reload = () => setReloadKey((key) => key + 1);
  useEffect(() => { void Promise.all([window.optical.getAvailabilityProfiles(true), window.supplier.getAll()]).then(([nextProfiles, nextSuppliers]) => { setProfiles(nextProfiles); setSuppliers(nextSuppliers); }).catch(() => toast.error("Unable to load lens master lookups.")); }, [reloadKey]);
  useEffect(() => { let current = true; const timeout = window.setTimeout(() => { void window.optical.getLensSeries({ search, status, supplierId, sort, page, pageSize: 40 }).then((result) => { if (current) { setLenses(result.items); setTotal(result.total); } }).catch((error) => toast.error(error instanceof Error ? error.message : "Unable to load lens series.")); }, 160); return () => { current = false; window.clearTimeout(timeout); }; }, [page, reloadKey, search, sort, status, supplierId]);
  const pageCount = Math.max(1, Math.ceil(total / 40));
  const activeProfiles = useMemo(() => profiles.filter((profile) => profile.isActive).length, [profiles]);
  const saveLens = () => { reload(); setPage(1); };
  const duplicate = async (lens: LensSeries) => { try { await window.optical.duplicateLensSeries(lens.id); toast.success("Lens series duplicated."); reload(); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to duplicate lens series."); } };
  const changeActive = async (lens: LensSeries) => { try { await window.optical.setLensSeriesActive(lens.id, !lens.isActive); toast.success(lens.isActive ? "Lens series deactivated." : "Lens series activated."); reload(); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update lens series."); } };
  const removeProfile = async (profile: AvailabilityProfile) => { if (!window.confirm(`Delete ${profile.name}?`)) return; try { await window.optical.deleteAvailabilityProfile(profile.id); toast.success("Availability profile deleted."); reload(); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete profile."); } };

  return <section className="lens-master"><PageHeader eyebrow="Optical catalogue" title="Lens Master" subtitle="Product templates, preferred suppliers, and configurable availability." action={<Button onClick={() => view === "LENSES" ? (setSelectedLens(null), setLensModalOpen(true)) : (setSelectedProfile(null), setProfileModalOpen(true))}><Plus size={16} /> {view === "LENSES" ? "New lens series" : "New profile"}</Button>} /><div className="lens-master__tabs"><button type="button" className={view === "LENSES" ? "is-active" : ""} onClick={() => setView("LENSES")}><Layers3 size={16} /> Lens series <span>{total}</span></button><button type="button" className={view === "PROFILES" ? "is-active" : ""} onClick={() => setView("PROFILES")}><Settings2 size={16} /> Availability profiles <span>{activeProfiles}</span></button></div>{view === "LENSES" ? <><Card className="lens-master__toolbar"><label className="lens-master__search"><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search brand, series, index, supplier…" /></label><select value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1); }}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="ALL">All statuses</option></select><select value={supplierId ?? ""} onChange={(event) => { setSupplierId(event.target.value ? Number(event.target.value) : undefined); setPage(1); }}><option value="">All suppliers</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.supplierName}</option>)}</select><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="BRAND">Sort: Brand</option><option value="SERIES">Sort: Series</option><option value="PRICE">Sort: Price</option><option value="UPDATED">Sort: Updated</option></select></Card><Card className="lens-master__table">{lenses.length ? <Table><thead><tr><th>Lens series</th><th>Profile</th><th>Preferred supplier</th><th>Turnaround</th><th>Pricing</th><th>Status</th><th>Actions</th></tr></thead><tbody>{lenses.map((lens) => <tr key={lens.id}><td><strong>{lens.brand} {lens.series}</strong><small>{[lens.material, lens.lensIndex && `Index ${lens.lensIndex}`, lens.design].filter(Boolean).join(" · ") || "No optical specification"}</small></td><td>{lens.availabilityProfileName ?? "—"}</td><td><strong>{lens.supplierName ?? "Unassigned"}</strong><small>{lens.supplierName ? `${lens.supplierPhone ?? "No phone"} · ${lens.supplierGstin ?? "No GST"}` : "Map a preferred supplier"}</small></td><td>{lens.defaultTurnaroundDays > 0 ? `${lens.defaultTurnaroundDays} business days` : `${lens.supplierTurnaroundDays ?? 0} supplier days`}</td><td><strong>{money.format(lens.defaultSellingPrice)}</strong><small>Cost {money.format(lens.defaultCost)}</small></td><td><Badge variant={lens.isActive ? "success" : "neutral"}>{lens.isActive ? "Active" : "Inactive"}</Badge></td><td className="lens-master__actions"><Button size="sm" variant="ghost" onClick={() => { setSelectedLens(lens); setLensModalOpen(true); }} aria-label={`Edit ${lens.brand} ${lens.series}`}><Pencil size={15} /></Button><Button size="sm" variant="ghost" onClick={() => void duplicate(lens)} aria-label={`Duplicate ${lens.brand} ${lens.series}`}><Copy size={15} /></Button><Button size="sm" variant="ghost" onClick={() => void changeActive(lens)} aria-label={`${lens.isActive ? "Deactivate" : "Activate"} ${lens.brand} ${lens.series}`}><Power size={15} /></Button></td></tr>)}</tbody></Table> : <DataUnavailable title="No lens series found" description="Add a lens series to make Lens Master the source of truth for Billing." icon={<Layers3 size={22} />} />}</Card><div className="lens-master__pager"><span>{total} lens series</span><Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button><span>Page {page} of {pageCount}</span><Button size="sm" variant="secondary" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>Next</Button></div></> : <Card className="lens-master__table">{profiles.length ? <Table><thead><tr><th>Profile</th><th>Configured outcome</th><th>Rules</th><th>Lens series</th><th>Status</th><th>Actions</th></tr></thead><tbody>{profiles.map((profile) => <tr key={profile.id}><td><strong>{profile.name}</strong><small>{profile.description || "No description"}</small></td><td><Badge variant={profile.rules.defaultDecision === "READY_STOCK" ? "success" : profile.rules.defaultDecision === "RX" ? "warning" : "neutral"}>{profile.rules.defaultDecision.replaceAll("_", " ")}</Badge></td><td>{profile.rules.rules.length} conditional rule{profile.rules.rules.length === 1 ? "" : "s"}</td><td>{profile.lensSeriesCount ?? 0}</td><td><Badge variant={profile.isActive ? "success" : "neutral"}>{profile.isActive ? "Active" : "Inactive"}</Badge></td><td className="lens-master__actions"><Button size="sm" variant="ghost" onClick={() => { setSelectedProfile(profile); setProfileModalOpen(true); }} aria-label={`Edit ${profile.name}`}><Pencil size={15} /></Button><Button size="sm" variant="ghost" onClick={() => void removeProfile(profile)} aria-label={`Delete ${profile.name}`}><Trash2 size={15} /></Button></td></tr>)}</tbody></Table> : <DataUnavailable title="No availability profiles" description="Create a configurable profile before adding prescription lens series." icon={<Settings2 size={22} />} />}</Card>}</section>;
}

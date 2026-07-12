import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Search, SlidersHorizontal } from "lucide-react";
import { Badge, Card } from "../../../components/ui";
import type { AvailabilityEvaluation, LensSeries, PrescriptionForAvailability } from "../../../types/optical";

export type LensSeriesOption = LensSeries;
export type LensAvailability = AvailabilityEvaluation["decision"];

interface Props {
  selected: LensSeriesOption | null;
  prescription: PrescriptionForAvailability;
  evaluation: AvailabilityEvaluation | null;
  onSelect: (lens: LensSeriesOption) => void;
}

export function lensAvailabilityLabel(availability: LensAvailability) {
  if (availability === "READY_STOCK") return "Ready stock";
  if (availability === "RX") return "RX order";
  return "Review required";
}

function availabilityVariant(availability: LensAvailability) {
  if (availability === "READY_STOCK") return "success" as const;
  if (availability === "RX") return "warning" as const;
  return "neutral" as const;
}

function lensFeatures(lens: LensSeriesOption) {
  return [
    lens.singleVision ? "Single vision" : null,
    lens.blueCut ? "Blue Cut" : null,
    lens.photochromic ? "Photochromic" : null,
    lens.progressive ? "Progressive" : null,
    lens.bifocal ? "Bifocal" : null,
    lens.officeLens ? "Office" : null,
    lens.antiReflection ? "AR" : null,
  ].filter((feature): feature is string => Boolean(feature));
}

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function distinct(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim())))).sort((a, b) => a.localeCompare(b));
}

export default function LensSelector({ selected, prescription, evaluation, onSelect }: Props) {
  // This is the catalogue source of truth for the selector. Filters are derived below;
  // they must never overwrite this loaded list.
  const [lenses, setLenses] = useState<LensSeriesOption[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [recentOnly, setRecentOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;

    const loadActiveCatalogue = async () => {
      try {
        const firstPage = await window.optical.getLensSeries({ status: "ACTIVE", sort: "BRAND", page: 1, pageSize: 100 });
        const pages = Math.ceil(firstPage.total / firstPage.pageSize);
        const remainingPages = await Promise.all(
          Array.from({ length: Math.max(0, pages - 1) }, (_, index) => window.optical.getLensSeries({
            status: "ACTIVE", sort: "BRAND", page: index + 2, pageSize: 100,
          })),
        );
        if (active) setLenses([firstPage, ...remainingPages].flatMap((page) => page.items));
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadActiveCatalogue();
    return () => { active = false; };
  }, []);

  const brands = useMemo(() => distinct(lenses.map((lens) => lens.brand)), [lenses]);
  const categories = useMemo(() => distinct(lenses.map((lens) => lens.category)), [lenses]);
  const hasPrescription = useMemo(
    () => Object.values(prescription).some((value) => Boolean(value?.trim())),
    [prescription],
  );
  const filteredLenses = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return lenses.filter((lens) => {
      const matchesSearch = !query || [
        lens.brand, lens.series, lens.category, lens.lensIndex, lens.material, lens.coating,
        lens.tintName, lens.supplierName,
      ].some((value) => value?.toLocaleLowerCase().includes(query));
      return matchesSearch
        && (!brand || lens.brand === brand)
        && (!category || lens.category === category)
        && (!recentOnly || Boolean(lens.lastUsedAt) || (lens.usageCount ?? 0) > 0);
    });
  }, [brand, category, lenses, recentOnly, search]);
  const clearFilters = () => { setSearch(""); setBrand(""); setCategory(""); setRecentOnly(false); };

  return (
    <Card className="billing-lens">
      <div className="billing-lens__heading">
        <div><p>Lens catalogue</p><h2>Lens selection</h2></div>
        {selected && evaluation ? <Badge variant={availabilityVariant(evaluation.decision)}>{lensAvailabilityLabel(evaluation.decision)}</Badge> : null}
      </div>

      <div className="billing-lens__toolbar">
        <label className="billing-lens__search"><Search size={14} aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search brand, series, category, supplier, index, material or coating" aria-label="Search lens series" /></label>
        <div className="billing-lens__filters">
          <SlidersHorizontal size={13} aria-hidden="true" />
          <select value={brand} onChange={(event) => setBrand(event.target.value)} aria-label="Filter lens brand"><option value="">All brands</option>{brands.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter lens category"><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
          <label><input type="checkbox" checked={recentOnly} onChange={(event) => setRecentOnly(event.target.checked)} /> Recently used</label>
        </div>
      </div>
      <small>{hasPrescription ? "Configured profile rules will assess this prescription." : "Add prescription values to assess availability."}</small>

      {loading ? <div className="billing-lens__loading" aria-label="Loading active lens catalogue"><span /><span /><span /></div> : null}
      {!loading && loadError ? <div className="billing-lens__no-results" role="status">Unable to load the active lens catalogue.</div> : null}
      {!loading && !loadError && lenses.length === 0 ? <div className="billing-lens__no-results" role="status">No active lens series are available in the catalogue.</div> : null}
      {!loading && !loadError && lenses.length > 0 && filteredLenses.length === 0 ? <div className="billing-lens__no-results" role="status">No active lens series match these filters. <button type="button" onClick={clearFilters}>Clear filters</button></div> : null}
      {!loading && !loadError && filteredLenses.length > 0 ? <div className="billing-lens__cards">
        {filteredLenses.map((lens) => {
          const features = lensFeatures(lens);
          const isSelected = selected?.id === lens.id;
          return <button key={lens.id} type="button" className={`billing-lens__card ${isSelected ? "is-selected" : ""}`} aria-pressed={isSelected} onClick={() => onSelect(lens)}>
            <span className="billing-lens__card-topline"><strong>{lens.brand} <span>{lens.series}</span></strong><Badge variant={lens.isActive ? "success" : "neutral"}>{lens.isActive ? "Active" : "Inactive"}</Badge></span>
            <span className="billing-lens__specs"><span>{lens.category ?? "Category not configured"}</span><span>{lens.lensIndex ? `Index ${lens.lensIndex}` : "Index not configured"}</span><span>{lens.material ?? "Material not configured"}</span><span>{lens.coating ?? "Coating not configured"}</span><span>{lens.tintName ?? "Tint not configured"}</span><span>{lens.supplierName ?? "Supplier not configured"}</span></span>
            <span className="billing-lens__features">{features.length ? features.map((feature) => <em key={feature}>{feature}</em>) : <em>No features configured</em>}</span>
            <span className="billing-lens__card-footer"><span><Clock3 size={12} /> {lens.usageCount ?? 0} use{lens.usageCount === 1 ? "" : "s"} · {money.format(lens.defaultSellingPrice)}</span>{isSelected ? <CheckCircle2 size={15} aria-label="Selected" /> : null}</span>
          </button>;
        })}
      </div> : null}
    </Card>
  );
}

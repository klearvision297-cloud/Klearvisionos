import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Search, Sparkles } from "lucide-react";
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

export default function LensSelector({ selected, prescription, evaluation, onSelect }: Props) {
  const [lenses, setLenses] = useState<LensSeriesOption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      void window.optical
        .getLensSeries({ search, status: "ACTIVE", sort: "BRAND", pageSize: 60 })
        .then((result) => {
          if (mounted) setLenses(result.items);
        })
        .catch(() => {
          if (mounted) setLenses([]);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    }, 180);
    return () => {
      mounted = false;
      window.clearTimeout(timeout);
    };
  }, [search]);

  const hasPrescription = useMemo(
    () => Object.values(prescription).some((value) => Boolean(value?.trim())),
    [prescription],
  );

  return (
    <Card className="billing-lens">
      <div className="billing-lens__heading">
        <div>
          <p>Lens master</p>
          <h2>Lens selection</h2>
        </div>
        {selected && evaluation ? (
          <Badge variant={availabilityVariant(evaluation.decision)}>
            {lensAvailabilityLabel(evaluation.decision)}
          </Badge>
        ) : null}
      </div>

      {loading ? (
        <div className="billing-lens__loading" aria-label="Loading lens master"><span /><span /><span /></div>
      ) : lenses.length === 0 ? (
        <div className="billing-lens__empty"><span className="billing-lens__empty-icon"><Sparkles size={18} /></span><div><strong>Lens Master is ready for your catalogue</strong><p>Add an active lens series in Lens Master to use it in a prescription invoice.</p></div><small>No matching lens data has been added yet.</small></div>
      ) : (
        <>
          <div className="billing-lens__toolbar">
            <label className="billing-lens__search"><Search size={14} aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search brand, series, index..." aria-label="Search lens series" /></label>
            <small>{hasPrescription ? "Configured profile rules will assess this prescription." : "Add prescription values to assess availability."}</small>
          </div>
          <div className="billing-lens__cards">
            {lenses.map((lens) => {
              const features = lensFeatures(lens);
              const isSelected = selected?.id === lens.id;
              return <button key={lens.id} type="button" className={`billing-lens__card ${isSelected ? "is-selected" : ""}`} aria-pressed={isSelected} onClick={() => onSelect(lens)}>
                <span className="billing-lens__card-topline"><strong>{lens.brand} <span>{lens.series}</span></strong>{isSelected && evaluation ? <Badge variant={availabilityVariant(evaluation.decision)}>{lensAvailabilityLabel(evaluation.decision)}</Badge> : <Badge variant="neutral">{lens.availabilityProfileName ?? "Profile needed"}</Badge>}</span>
                <span className="billing-lens__specs"><span>{lens.lensIndex ? `Index ${lens.lensIndex}` : "Index not configured"}</span><span>{lens.material ?? "Material not configured"}</span><span>{lens.supplierName ?? "Preferred supplier not configured"}</span></span>
                <span className="billing-lens__features">{features.length ? features.map((feature) => <em key={feature}>{feature}</em>) : <em>No features configured</em>}</span>
                <span className="billing-lens__card-footer"><span><Clock3 size={12} /> {lens.defaultTurnaroundDays > 0 ? `${lens.defaultTurnaroundDays} business-day default` : "Uses supplier turnaround"}</span>{isSelected ? <CheckCircle2 size={15} aria-label="Selected" /> : null}</span>
              </button>;
            })}
          </div>
        </>
      )}
    </Card>
  );
}

import { useState } from "react";
import { ChevronDown, Stethoscope } from "lucide-react";
import { Card, Input } from "../../../components/ui";

export interface PrescriptionDraft {
  source: "IN_HOUSE" | "EXTERNAL_DOCTOR" | "UPLOADED";
  doctorName: string;
  rightSphere: string;
  rightCylinder: string;
  rightAxis: string;
  rightAdd: string;
  rightPD: string;
  rightHeight: string;
  rightPrism: string;
  leftSphere: string;
  leftCylinder: string;
  leftAxis: string;
  leftAdd: string;
  leftPD: string;
  leftHeight: string;
  leftPrism: string;
  distanceNotes: string;
  nearNotes: string;
  doctorNotes: string;
}

export const emptyPrescriptionDraft: PrescriptionDraft = {
  source: "IN_HOUSE",
  doctorName: "",
  rightSphere: "",
  rightCylinder: "",
  rightAxis: "",
  rightAdd: "",
  rightPD: "",
  rightHeight: "",
  rightPrism: "",
  leftSphere: "",
  leftCylinder: "",
  leftAxis: "",
  leftAdd: "",
  leftPD: "",
  leftHeight: "",
  leftPrism: "",
  distanceNotes: "",
  nearNotes: "",
  doctorNotes: "",
};

const primaryMeasurementFields = [
  "rightSphere",
  "rightCylinder",
  "rightAxis",
  "rightPD",
  "leftSphere",
  "leftCylinder",
  "leftAxis",
  "leftPD",
] as const;

const sphereValues = [
  "+20.00",
  "+16.00",
  "+12.00",
  "+10.00",
  "+8.00",
  "+6.00",
  "+5.00",
  "+4.00",
  "+3.00",
  "+2.50",
  "+2.00",
  "+1.75",
  "+1.50",
  "+1.25",
  "+1.00",
  "+0.75",
  "+0.50",
  "+0.25",
  "Plano",
  "-0.25",
  "-0.50",
  "-0.75",
  "-1.00",
  "-1.25",
  "-1.50",
  "-1.75",
  "-2.00",
  "-2.50",
  "-3.00",
  "-4.00",
  "-5.00",
  "-6.00",
  "-8.00",
  "-10.00",
  "-12.00",
  "-16.00",
  "-20.00",
];
const cylinderValues = [
  "Plano",
  "-0.25",
  "-0.50",
  "-0.75",
  "-1.00",
  "-1.25",
  "-1.50",
  "-1.75",
  "-2.00",
  "-2.50",
  "-3.00",
  "-3.50",
  "-4.00",
  "-5.00",
  "-6.00",
];
const addValues = [
  "+0.75",
  "+1.00",
  "+1.25",
  "+1.50",
  "+1.75",
  "+2.00",
  "+2.25",
  "+2.50",
  "+2.75",
  "+3.00",
  "+3.50",
];
const prismValues = [
  "0.25",
  "0.50",
  "0.75",
  "1.00",
  "1.50",
  "2.00",
  "2.50",
  "3.00",
  "4.00",
  "5.00",
];
const axisValues = Array.from({ length: 181 }, (_, axis) => String(axis));

export function validatePrescriptionDraft(draft: PrescriptionDraft) {
  return primaryMeasurementFields.some(
    (field) => draft[field].trim().length > 0,
  )
    ? null
    : "Add a primary prescription value to continue.";
}

interface Props {
  value: PrescriptionDraft;
  onChange: (value: PrescriptionDraft) => void;
}

type Eye = "right" | "left";
type Measurement =
  "Sphere" | "Cylinder" | "Axis" | "Add" | "PD" | "Height" | "Prism";

interface MeasurementField {
  label: Measurement;
  optional?: boolean;
  type: "suggestion" | "select" | "number";
  values?: string[];
}

const eyeFields: MeasurementField[] = [
  { label: "Sphere", type: "suggestion", values: sphereValues },
  { label: "Cylinder", type: "suggestion", values: cylinderValues },
  { label: "Axis", type: "select", values: axisValues },
  { label: "Add", optional: true, type: "select", values: addValues },
  { label: "PD", type: "number" },
  { label: "Height", optional: true, type: "number" },
  { label: "Prism", optional: true, type: "suggestion", values: prismValues },
];

function fieldKey(eye: Eye, label: Measurement): keyof PrescriptionDraft {
  const prefix = eye === "right" ? "right" : "left";
  return `${prefix}${label}` as keyof PrescriptionDraft;
}

function EyeMeasurements({
  eye,
  value,
  onChange,
}: {
  eye: Eye;
  value: PrescriptionDraft;
  onChange: (field: keyof PrescriptionDraft, nextValue: string) => void;
}) {
  const eyeName = eye === "right" ? "Right eye" : "Left eye";
  const eyeCode = eye === "right" ? "OD" : "OS";

  return (
    <section
      className={`billing-rx__eye billing-rx__eye--${eye}`}
      aria-label={eyeName}
    >
      <header className="billing-rx__eye-heading">
        <span>{eyeCode}</span>
        <div>
          <strong>{eyeName}</strong>
          <small>{eye === "right" ? "Oculus dexter" : "Oculus sinister"}</small>
        </div>
      </header>

      <div className="billing-rx__eye-fields">
        {eyeFields.map((field) => {
          const key = fieldKey(eye, field.label);
          const listId = `${eye}-${field.label.toLowerCase()}-values`;
          const displayLabel = field.label === "Add" ? "ADD" : field.label;
          const label = field.optional
            ? `${displayLabel} · optional`
            : displayLabel;

          if (field.type === "select") {
            return (
              <label className="kv-field billing-rx__select-field" key={key}>
                <span className="kv-field__label">{label}</span>
                <span className="billing-rx__select-wrap">
                  <select
                    value={value[key]}
                    onChange={(event) => onChange(key, event.target.value)}
                  >
                    <option value="">—</option>
                    {field.values?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" size={14} />
                </span>
              </label>
            );
          }

          return (
            <Input
              key={key}
              label={label}
              type={field.type === "number" ? "number" : "text"}
              inputMode={field.type === "number" ? "decimal" : "text"}
              min={field.type === "number" ? 0 : undefined}
              step={field.type === "number" ? 0.5 : undefined}
              list={field.type === "suggestion" ? listId : undefined}
              value={value[key]}
              onChange={(event) => onChange(key, event.target.value)}
            />
          );
        })}
      </div>

      {eyeFields
        .filter((field) => field.type === "suggestion")
        .map((field) => (
          <datalist
            key={`${eye}-${field.label}`}
            id={`${eye}-${field.label.toLowerCase()}-values`}
          >
            {field.values?.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        ))}
    </section>
  );
}

export default function PrescriptionWorkspace({ value, onChange }: Props) {
  const [visionMode, setVisionMode] = useState<"distance" | "near">("distance");
  const validationMessage = validatePrescriptionDraft(value);
  const activeNotesField =
    visionMode === "distance" ? "distanceNotes" : "nearNotes";

  function set(field: keyof PrescriptionDraft, fieldValue: string) {
    onChange({ ...value, [field]: fieldValue });
  }

  return (
    <Card className="billing-rx">
      <div className="billing-rx__heading">
        <div className="billing-rx__title">
          <span className="billing-rx__title-icon">
            <Stethoscope size={16} />
          </span>
          <div>
            <p>Clinical prescription</p>
            <h2>Optical Rx</h2>
          </div>
        </div>
        <label className="billing-rx__source">
          <span>Source</span>
          <select
            value={value.source}
            onChange={(event) =>
              set("source", event.target.value as PrescriptionDraft["source"])
            }
          >
            <option value="IN_HOUSE">In-house</option>
            <option value="EXTERNAL_DOCTOR">External doctor</option>
            <option value="UPLOADED">Uploaded</option>
          </select>
        </label>
      </div>

      <div className="billing-rx__eyes">
        <EyeMeasurements eye="right" value={value} onChange={set} />
        <EyeMeasurements eye="left" value={value} onChange={set} />
      </div>

      <div className="billing-rx__supporting-fields">
        <Input
          label="Doctor · optional"
          placeholder="Search or enter a doctor"
          value={value.doctorName}
          onChange={(event) => set("doctorName", event.target.value)}
        />
        <div className="billing-rx__vision-notes">
          <div
            className="billing-rx__vision-toggle"
            role="group"
            aria-label="Prescription use"
          >
            <button
              type="button"
              className={visionMode === "distance" ? "is-active" : ""}
              aria-pressed={visionMode === "distance"}
              onClick={() => setVisionMode("distance")}
            >
              Distance
            </button>
            <button
              type="button"
              className={visionMode === "near" ? "is-active" : ""}
              aria-pressed={visionMode === "near"}
              onClick={() => setVisionMode("near")}
            >
              Near
            </button>
          </div>
          <Input
            label={`${visionMode === "distance" ? "Distance" : "Near"} notes · optional`}
            placeholder={
              visionMode === "distance" ? "Distance-use note" : "Near-use note"
            }
            value={value[activeNotesField]}
            onChange={(event) => set(activeNotesField, event.target.value)}
          />
        </div>
        <details className="billing-rx__notes">
          <summary>
            Additional notes <span>Optional</span>
          </summary>
          <textarea
            value={value.doctorNotes}
            onChange={(event) => set("doctorNotes", event.target.value)}
            placeholder="Clinical or doctor notes"
          />
        </details>
      </div>

      <div
        className={`billing-rx__validation ${validationMessage ? "is-pending" : "is-ready"}`}
        role="status"
      >
        <span>
          {validationMessage ??
            "Prescription ready. Optional fields can remain empty."}
        </span>
      </div>
    </Card>
  );
}

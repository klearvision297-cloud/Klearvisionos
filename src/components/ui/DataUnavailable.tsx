import type { ReactNode } from "react";
import { DatabaseZap } from "lucide-react";

type DataUnavailableProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  compact?: boolean;
  className?: string;
};

/** A stable layout for dashboard areas that are awaiting a reporting data source. */
export function DataUnavailable({
  title,
  description,
  icon = <DatabaseZap size={20} />,
  compact = false,
  className = "",
}: DataUnavailableProps) {
  return (
    <div className={`kv-data-unavailable ${compact ? "kv-data-unavailable--compact" : ""} ${className}`}>
      <span className="kv-data-unavailable__icon">{icon}</span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}

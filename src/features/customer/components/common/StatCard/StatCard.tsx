import { ReactNode } from "react";

type StatCardProps = {
  title: string;
  value: string | number;
  icon?: ReactNode;
};

export default function StatCard({
  title,
  value,
  icon,
}: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        {icon}

        <span>{title}</span>
      </div>

      <div className="stat-value">
        {value}
      </div>
    </div>
  );
}
import type { ReactNode } from "react";
import { Card } from "./Card";
type StatCardProps = { label: string; value: ReactNode; icon?: ReactNode; detail?: ReactNode; className?: string };
export function StatCard({ label, value, icon, detail, className }: StatCardProps) { return <Card className={`kv-stat-card ${className ?? ""}`}><div className="kv-stat-card__header"><span>{label}</span>{icon && <span className="kv-stat-card__icon">{icon}</span>}</div><strong className="kv-stat-card__value">{value}</strong>{detail && <span className="kv-stat-card__detail">{detail}</span>}</Card>; }

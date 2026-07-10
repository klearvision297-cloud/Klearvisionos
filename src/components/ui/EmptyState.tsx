import type { ReactNode } from "react";
type EmptyStateProps = { title: string; description?: string; icon?: ReactNode; action?: ReactNode; className?: string };
export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) { return <section className={`kv-empty-state ${className ?? ""}`}><div className="kv-empty-state__icon">{icon}</div><h2 className="kv-empty-state__title">{title}</h2>{description && <p className="kv-empty-state__description">{description}</p>}{action && <div className="kv-empty-state__action">{action}</div>}</section>; }

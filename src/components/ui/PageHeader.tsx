import type { ReactNode } from "react";
type PageHeaderProps = { title: string; subtitle?: string; eyebrow?: string; action?: ReactNode; className?: string };
export function PageHeader({ title, subtitle, eyebrow, action, className }: PageHeaderProps) { return <header className={`kv-page-header ${className ?? ""}`}><div>{eyebrow && <p className="kv-page-header__eyebrow">{eyebrow}</p>}<h1 className="kv-page-header__title">{title}</h1>{subtitle && <p className="kv-page-header__subtitle">{subtitle}</p>}</div>{action && <div className="kv-page-header__action">{action}</div>}</header>; }

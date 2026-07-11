import type { ReactNode, TableHTMLAttributes } from "react";
import clsx from "clsx";
type TableProps = TableHTMLAttributes<HTMLTableElement> & { children: ReactNode; compact?: boolean };
export function Table({ children, compact, className, ...props }: TableProps) { return <div className="kv-table-wrap"><table className={clsx("kv-table", compact && "kv-table--compact", className)} {...props}>{children}</table></div>; }

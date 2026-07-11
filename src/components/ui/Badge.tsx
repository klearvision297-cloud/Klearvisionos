import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
type BadgeProps = HTMLAttributes<HTMLSpanElement> & { children: ReactNode; variant?: "neutral" | "info" | "success" | "warning" | "danger" };
export function Badge({ children, variant = "neutral", className, ...props }: BadgeProps) { return <span className={clsx("kv-badge", `kv-badge--${variant}`, className)} {...props}>{children}</span>; }

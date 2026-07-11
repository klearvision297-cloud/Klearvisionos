import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type CardProps = HTMLAttributes<HTMLDivElement> & { children: ReactNode; padded?: boolean; interactive?: boolean };
export function Card({ children, padded = true, interactive, className, ...props }: CardProps) {
  return <div className={clsx("kv-card", padded && "kv-card--padded", interactive && "kv-card--interactive", className)} {...props}>{children}</div>;
}

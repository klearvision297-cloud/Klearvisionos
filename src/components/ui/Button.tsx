import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "success" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  children: ReactNode;
};

export function Button({ variant = "primary", size = "md", fullWidth, className, type = "button", children, ...props }: ButtonProps) {
  return <button type={type} className={clsx("kv-button", `kv-button--${variant}`, size !== "md" && `kv-button--${size}`, fullWidth && "kv-button--full", className)} {...props}>{children}</button>;
}

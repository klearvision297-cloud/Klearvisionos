import type { InputHTMLAttributes } from "react";
import clsx from "clsx";
type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; error?: string };
export function Input({ label, hint, error, id, className, ...props }: InputProps) { const inputId = id ?? label?.toLowerCase().replace(/[^a-z0-9]+/g, "-"); return <label className="kv-field" htmlFor={inputId}>{label && <span className="kv-field__label">{label}</span>}<input id={inputId} className={clsx("kv-input", error && "kv-input--error", className)} {...props}/>{error ? <span className="kv-field__error">{error}</span> : hint ? <span className="kv-field__hint">{hint}</span> : null}</label>; }

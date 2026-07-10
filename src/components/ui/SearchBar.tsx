import { Search, X } from "lucide-react";
import type { InputHTMLAttributes } from "react";
type SearchBarProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { onClear?: () => void };
export function SearchBar({ value, onClear, className, ...props }: SearchBarProps) { return <div className={className}><div className="kv-search-bar"><Search size={18} aria-hidden="true" /><input type="search" value={value} className="kv-search-bar__input" {...props}/>{value && onClear && <button type="button" className="kv-search-bar__clear" onClick={onClear} aria-label="Clear search"><X size={15}/></button>}</div></div>; }

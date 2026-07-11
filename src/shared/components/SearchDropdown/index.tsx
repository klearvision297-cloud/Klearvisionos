import { ReactNode } from "react";

import SearchInput from "./SearchInput";
import SearchResults from "./SearchResults";

type SearchDropdownProps = {
  value: string;
  placeholder?: string;
  open: boolean;
  onChange: (
    value: string
  ) => void;
  children: ReactNode;
};

export default function SearchDropdown({
  value,
  placeholder,
  open,
  onChange,
  children,
}: SearchDropdownProps) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
      }}
    >
      <SearchInput
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />

      <SearchResults open={open}>
        {children}
      </SearchResults>
    </div>
  );
}
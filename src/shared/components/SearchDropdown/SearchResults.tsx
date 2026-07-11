import { ReactNode } from "react";

type SearchResultsProps = {
  open: boolean;
  children: ReactNode;
};

export default function SearchResults({
  open,
  children,
}: SearchResultsProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "absolute",
        width: "100%",
        marginTop: 8,
        background: "white",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow:
          "0 15px 35px rgba(0,0,0,.15)",
        border: "1px solid #E2E8F0",
        zIndex: 999,
        maxHeight: 320,
        overflowY: "auto",
      }}
    >
      {children}
    </div>
  );
}
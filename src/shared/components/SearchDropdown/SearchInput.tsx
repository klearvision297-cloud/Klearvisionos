import { Search } from "lucide-react";

type SearchInputProps = {
  value: string;
  placeholder?: string;
  onChange: (
    value: string
  ) => void;
};

export default function SearchInput({
  value,
  placeholder,
  onChange,
}: SearchInputProps) {
  return (
    <div
      style={{
        position: "relative",
      }}
    >
      <Search
        size={18}
        style={{
          position: "absolute",
          left: 15,
          top: "50%",
          transform: "translateY(-50%)",
          color: "#64748B",
        }}
      />

      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value)
        }
        style={{
          width: "100%",
          height: 48,
          paddingLeft: 42,
          paddingRight: 15,
          borderRadius: 12,
          border: "1px solid #CBD5E1",
          outline: "none",
          fontSize: 15,
        }}
      />
    </div>
  );
}
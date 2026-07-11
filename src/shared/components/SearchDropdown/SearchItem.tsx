import { ReactNode } from "react";

type SearchItemProps = {
  title: string;
  subtitle?: string;
  rightText?: string;
  icon?: ReactNode;
  onClick: () => void;
};

export default function SearchItem({
  title,
  subtitle,
  rightText,
  icon,
  onClick,
}: SearchItemProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        border: "none",
        background: "white",
        padding: "14px 18px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
        borderBottom: "1px solid #F1F5F9",
        transition: ".2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background =
          "#F8FAFC";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background =
          "white";
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 14,
          alignItems: "center",
        }}
      >
        {icon}

        <div
          style={{
            textAlign: "left",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              color: "#0F172A",
            }}
          >
            {title}
          </div>

          {subtitle && (
            <small
              style={{
                color: "#64748B",
              }}
            >
              {subtitle}
            </small>
          )}
        </div>
      </div>

      {rightText && (
        <strong
          style={{
            color: "#2563EB",
            fontSize: 13,
          }}
        >
          {rightText}
        </strong>
      )}
    </button>
  );
}
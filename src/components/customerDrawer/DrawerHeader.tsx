import {
  Phone,
  User,
  X,
  BadgeCheck,
} from "lucide-react";

type DrawerHeaderProps = {
  customer?: {
    customerCode: string;
    name: string;
    mobile: string;
  } | null;

  onClose: () => void;
};

export default function DrawerHeader({
  customer,
  onClose,
}: DrawerHeaderProps) {
  return (
    <div
      style={{
        padding: "28px",
        borderBottom: "1px solid #E2E8F0",
        background: "#F8FAFC",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "18px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "#2563EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <User size={34} />
          </div>

          <div>
            <h2
              style={{
                fontSize: 24,
                color: "#0F172A",
                marginBottom: 6,
              }}
            >
              {customer?.name ?? "Loading..."}
            </h2>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#64748B",
                marginBottom: 6,
              }}
            >
              <BadgeCheck size={16} />

              <span>
                {customer?.customerCode ??
                  "KV------"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#64748B",
              }}
            >
              <Phone size={16} />

              <span>
                {customer?.mobile ??
                  "Loading..."}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            border: "none",
            background: "#E2E8F0",
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transition: ".2s",
          }}
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
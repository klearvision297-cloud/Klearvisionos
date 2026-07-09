import {
  MapPin,
  Phone,
  MessageCircle,
  Calendar,
  UserCircle,
  Mail,
  FileText,
} from "lucide-react";

type DrawerBodyProps = {
  customer?: {
    name?: string;
    mobile?: string;
    whatsapp?: string;
    email?: string;
    gender?: string;
    dateOfBirth?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    remarks?: string;
  } | null;
};

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        padding: "14px 0",
        borderBottom: "1px solid #F1F5F9",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "#EFF6FF",
          color: "#2563EB",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          flex: 1,
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: "#64748B",
            marginBottom: 4,
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontWeight: 600,
            color: "#0F172A",
            wordBreak: "break-word",
          }}
        >
          {value && value.trim() !== ""
            ? value
            : "Not Available"}
        </div>
      </div>
    </div>
  );
}

export default function DrawerBody({
  customer,
}: DrawerBodyProps) {
  return (
    <div
      style={{
        padding: 24,
        overflowY: "auto",
        flex: 1,
      }}
    >
      <DetailRow
        icon={<Phone size={18} />}
        label="Mobile"
        value={customer?.mobile}
      />

      <DetailRow
        icon={<MessageCircle size={18} />}
        label="WhatsApp"
        value={customer?.whatsapp}
      />

      <DetailRow
        icon={<Mail size={18} />}
        label="Email"
        value={customer?.email}
      />

      <DetailRow
        icon={<UserCircle size={18} />}
        label="Gender"
        value={customer?.gender}
      />

      <DetailRow
        icon={<Calendar size={18} />}
        label="Date of Birth"
        value={customer?.dateOfBirth}
      />

      <DetailRow
        icon={<MapPin size={18} />}
        label="Address"
        value={customer?.address}
      />

      <DetailRow
        icon={<MapPin size={18} />}
        label="City"
        value={customer?.city}
      />

      <DetailRow
        icon={<MapPin size={18} />}
        label="State"
        value={customer?.state}
      />

      <DetailRow
        icon={<MapPin size={18} />}
        label="Pincode"
        value={customer?.pincode}
      />

      <DetailRow
        icon={<FileText size={18} />}
        label="Remarks"
        value={customer?.remarks}
      />
    </div>
  );
}

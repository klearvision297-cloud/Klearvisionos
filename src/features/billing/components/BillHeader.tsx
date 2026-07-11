import { CalendarDays, FileText, User2 } from "lucide-react";
import { Card, PageHeader } from "../../../components/ui";
export default function BillHeader() {
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  return <Card className="billing-header"><PageHeader title="New Billing" subtitle="Create invoice for customer" /><div className="billing-header__details"><Detail icon={<FileText size={20} />} label="Bill No." value="Draft" /><Detail icon={<CalendarDays size={20} />} label="Date" value={today} /><Detail icon={<User2 size={20} />} label="Staff" value="Anmol" /></div></Card>;
}
function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="billing-header__detail"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>; }

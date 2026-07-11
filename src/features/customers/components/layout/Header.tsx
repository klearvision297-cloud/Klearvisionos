import dayjs from "dayjs";
import { Bell, Moon } from "lucide-react";

export default function Header() {
  return (
    <header className="app-header">
      <div>
        <p className="app-header__eyebrow">Klear Vision OS</p>
        <h2 className="app-header__title">Workspace</h2>
        <small className="app-header__date">
          {dayjs().format("dddd, DD MMMM YYYY")}
        </small>
      </div>

      <div className="app-header__actions">
        <button className="app-header__icon-button" type="button" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <button className="app-header__icon-button" type="button" aria-label="Appearance settings">
          <Moon size={18} />
        </button>
        <span className="app-header__user">Anmol</span>
      </div>
    </header>
  );
}

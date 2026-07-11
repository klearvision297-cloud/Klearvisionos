import dayjs from "dayjs";
import { Bell, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import type { NotificationItem } from "../../types/optical";

export default function Header() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("kv-theme") === "dark");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("kv-theme-dark", darkMode);
    localStorage.setItem("kv-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => { void window.optical.getNotifications().then(setNotifications); }, []);
  const unread = notifications.filter((item) => !item.readAt);

  async function markRead(id: number) {
    await window.optical.markNotificationRead(id);
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
  }

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
        <button className="app-header__icon-button" type="button" aria-label="Notifications" onClick={() => setShowNotifications((visible) => !visible)}>
          <Bell size={18} />
          {unread.length ? <span className="app-header__badge">{unread.length}</span> : null}
        </button>
        <button className="app-header__icon-button" type="button" aria-label="Toggle dark mode" onClick={() => setDarkMode((enabled) => !enabled)}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <span className="app-header__user">Anmol</span>
        {showNotifications ? <aside className="app-header__notifications" aria-label="Notification center">
          <strong>Notifications</strong>
          {notifications.length ? notifications.slice(0, 6).map((item) => <button key={item.id} type="button" className={item.readAt ? "app-header__notification" : "app-header__notification unread"} onClick={() => void markRead(item.id)}><b>{item.title}</b><span>{item.message}</span></button>) : <p>No notifications yet.</p>}
        </aside> : null}
      </div>
    </header>
  );
}

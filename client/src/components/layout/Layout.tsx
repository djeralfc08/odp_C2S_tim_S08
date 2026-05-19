import { type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuthHook";

const userNav = [
  { to: "/dashboard",   label: "Dashboard",    icon: "⊞" },
  { to: "/teams",       label: "Moji timovi",   icon: "◎" },
  { to: "/matches",     label: "Moji mečevi",   icon: "⚔" },
  { to: "/watchlist",   label: "Watchlist",     icon: "★" },
  { to: "/tournaments", label: "Turniri",       icon: "🏆" },
  { to: "/games",       label: "Igre",          icon: "🎮" },
  { to: "/profile",     label: "Profil",        icon: "◉" },
];

const adminNav = [
  { to: "/admin",                        label: "Dashboard",  icon: "⊞" },
  { to: "/admin/tournaments",            label: "Turniri",    icon: "🏆" },
  { to: "/admin/games",                  label: "Igre",       icon: "🎮" },
  { to: "/admin/matches",                label: "Mečevi",     icon: "⚔" },
  { to: "/admin/users",                  label: "Korisnici",  icon: "◎" },
  { to: "/admin/health",                 label: "Health",     icon: "◈" },
  { to: "/admin/audit",                  label: "Audit log",  icon: "≡" },
];

const guestNav = [
  { to: "/tournaments", label: "Turniri", icon: "🏆" },
  { to: "/games",       label: "Igre",    icon: "🎮" },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = user?.role === "admin" ? adminNav : user ? userNav : guestNav;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="shrink-0 border-r border-gray-200 flex flex-col bg-white shadow-sm" style={{ width: 220 }}>
        {/* Logo */}
        <div className="px-5 h-16 flex items-center border-b border-gray-200 gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-bold">PG</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 tracking-tight">PulseGrid</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">
              {user?.role === "admin" ? "Admin" : user ? "Igrač" : "Gost"}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin" || item.to === "/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-transparent"
                }`
              }
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-200 px-4 py-4">
          {user ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                  <span className="text-xs text-emerald-700 font-semibold">{user.username?.[0]?.toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{user.username}</p>
                  <p className="text-[10px] text-gray-400">{user.role}</p>
                </div>
              </div>
              <button
                onClick={() => { logout(); navigate("/login"); }}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors w-full text-left"
              >
                Odjavi se →
              </button>
            </>
          ) : (
            <NavLink to="/login" className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors font-medium">
              Prijavi se →
            </NavLink>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}

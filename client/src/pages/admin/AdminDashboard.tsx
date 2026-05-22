import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTournaments } from "../../hooks/tournaments/useTournaments";
import { useGames } from "../../hooks/games/useGames";
import { usersApi } from "../../api_services/users/UsersAPIService";
import { healthApi } from "../../api_services/health/HealthAPIService";
import { PageHeader, StatCard, StatusBadge, NodeBadge, Spinner, Card } from "../../components/ui/UI";

export default function AdminDashboard() {
  const { tournaments, loading: tLoading } = useTournaments();
  const { games, loading: gLoading } = useGames();
  const [userCount, setUserCount] = useState<number | null>(null);
  const [dbHealth, setDbHealth] = useState<{ status: string; name: string }[]>([]);

  useEffect(() => {
    usersApi.getAll().then(r => { if (r.success && r.data) setUserCount(r.data.length); });
    healthApi.getDbHealth().then(r => {
      if (r.success && r.data) setDbHealth(r.data.map(n => ({ status: n.status, name: n.name })));
    });
  }, []);

  const ongoingTournaments = tournaments.filter(t => t.status === "ongoing");
  const registrationTournaments = tournaments.filter(t => t.status === "registration");

  return (
    <div>
      <PageHeader eyebrow="Admin Panel" title="Dashboard" />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Ukupno turnira" value={tLoading ? "..." : tournaments.length} color="text-emerald-600" />
        <StatCard label="U toku" value={tLoading ? "..." : ongoingTournaments.length} color="text-emerald-400" />
        <StatCard label="Igara u katalogu" value={gLoading ? "..." : games.length} color="text-violet-400" />
        <StatCard label="Korisnika" value={userCount ?? "..."} color="text-amber-400" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Tourniri u registraciji */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500">Otvorene registracije</h3>
            <Link to="/admin/tournaments" className="text-xs text-emerald-600 hover:text-emerald-700">Upravljaj →</Link>
          </div>
          {tLoading ? <div className="flex justify-center py-4"><Spinner /></div> : (
            registrationTournaments.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">Nema otvorenih registracija</p>
            ) : (
              <div className="space-y-2">
                {registrationTournaments.slice(0, 5).map(t => (
                  <Link key={t.id} to={`/admin/tournaments/${t.id}/registrations`}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white transition-colors">
                    <span className="text-xs text-gray-800 truncate">{t.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono ml-2">{t.registered_teams_count}/{t.max_teams}</span>
                  </Link>
                ))}
              </div>
            )
          )}
        </Card>

        {/* Aktivni turniri */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500">Aktivni turniri</h3>
            <Link to="/admin/matches" className="text-xs text-emerald-600 hover:text-emerald-700">Rezultati →</Link>
          </div>
          {tLoading ? <div className="flex justify-center py-4"><Spinner /></div> : (
            ongoingTournaments.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">Nema aktivnih turnira</p>
            ) : (
              <div className="space-y-2">
                {ongoingTournaments.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between py-2 px-3 rounded-lg">
                    <span className="text-xs text-gray-800 truncate">{t.name}</span>
                    <StatusBadge status={t.status} />
                  </div>
                ))}
              </div>
            )
          )}
        </Card>

        {/* DB Health */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500">DB Zdravlje</h3>
            <Link to="/admin/health" className="text-xs text-emerald-600 hover:text-emerald-700">Detalji →</Link>
          </div>
          {dbHealth.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">Učitavam...</p>
          ) : (
            <div className="space-y-2">
              {dbHealth.map(node => (
                <div key={node.name} className="flex items-center justify-between py-2 px-3 rounded-lg">
                  <span className="text-xs text-gray-800 font-mono">{node.name}</span>
                  <NodeBadge status={node.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">Brze akcije</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { to: "/admin/tournaments/new", label: "Novi turnir", icon: "🏆" },
            { to: "/admin/games", label: "Upravljaj igrama", icon: "🎮" },
            { to: "/admin/users", label: "Svi korisnici", icon: "◎" },
            { to: "/admin/audit", label: "Audit log", icon: "≡" },
          ].map(a => (
            <Link key={a.to} to={a.to}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-cyan-500/20 text-sm text-gray-700 hover:text-white transition-all">
              <span>{a.icon}</span>{a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

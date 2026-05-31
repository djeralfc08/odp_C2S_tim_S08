import { useState, useEffect } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { Link, useSearchParams } from "react-router-dom";
import { tournamentsApi } from "../../api_services/tournaments/TournamentsAPIService";
import { useGames } from "../../hooks/games/useGames";
import type { Tournament } from "../../types/tournament";
import { PageHeader, StatusBadge, FormatBadge, Spinner, Empty, ErrorBox } from "../../components/ui/UI";

const FORMAT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Svi formati" },
  { value: "single_elimination", label: "Single Elimination" },
  { value: "double_elimination", label: "Double Elimination" },
  { value: "round_robin", label: "Round Robin" },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Svi statusi" },
  { value: "upcoming", label: "Predstojeći" },
  { value: "registration", label: "Registracija" },
  { value: "ongoing", label: "U toku" },
  { value: "completed", label: "Završeni" },
  { value: "cancelled", label: "Otkazani" },
];

export function TournamentsPage() {
  usePageTitle("Turniri");
  const [searchParams, setSearchParams] = useSearchParams();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { games } = useGames();
  const [gameFilter, setGameFilter] = useState(searchParams.get("game_id") ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");
  const [formatFilter, setFormatFilter] = useState(searchParams.get("format") ?? "");

  useEffect(() => {
    setLoading(true);
    setError(null);
    tournamentsApi.getAll({
      game_id: gameFilter ? parseInt(gameFilter) : undefined,
      status: statusFilter || undefined,
      format: formatFilter || undefined,
    }).then(r => {
      if (r.success && r.data) setTournaments(r.data);
      else setError(r.message ?? "Greška");
    }).finally(() => setLoading(false));
  }, [gameFilter, statusFilter, formatFilter]);

  const handleGameFilter = (v: string) => {
    setGameFilter(v);
    const p = new URLSearchParams(searchParams);
    if (v) p.set("game_id", v); else p.delete("game_id");
    setSearchParams(p);
  };

  return (
    <div>
      <PageHeader eyebrow="Esports" title="Turniri" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={gameFilter} onChange={e => handleGameFilter(e.target.value)}
          className="bg-gray-100 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-emerald-300 transition-colors">
          <option value="">Sve igre</option>
          {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-gray-100 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-emerald-300 transition-colors">
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={formatFilter} onChange={e => setFormatFilter(e.target.value)}
          className="bg-gray-100 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-emerald-300 transition-colors">
          {FORMAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {(gameFilter || statusFilter || formatFilter) && (
          <button onClick={() => { setGameFilter(""); setStatusFilter(""); setFormatFilter(""); setSearchParams({}); }}
            className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2 border border-gray-300 rounded-xl transition-colors">
            Resetuj filtere ×
          </button>
        )}
      </div>

      {loading && <div className="flex justify-center py-16"><Spinner size={28} /></div>}
      {error && <ErrorBox message={error} />}
      {!loading && !error && tournaments.length === 0 && <Empty message="Nema pronađenih turnira" />}

      {!loading && !error && tournaments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tournaments.map(t => (
            <Link key={t.id} to={`/tournaments/${t.id}`}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-cyan-500/20 transition-all group block">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white group-hover:text-emerald-700 transition-colors truncate">{t.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{t.game_name ?? "—"}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <FormatBadge format={t.format} />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-white/4">
                <span className="font-mono">{t.registered_teams_count ?? 0}/{t.max_teams} timova</span>
                <span>Prijave do: {new Date(t.registration_deadline).toLocaleDateString("sr-RS")}</span>
              </div>

              {t.prize_pool && (
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Nagradni fond</span>
                  <span className="text-xs font-semibold text-amber-400">{t.prize_pool}</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

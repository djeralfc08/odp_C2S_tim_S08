import { Link } from "react-router-dom";
import { usePageTitle } from "../../hooks/usePageTitle";
import { tournamentsApi } from "../../api_services/tournaments/TournamentsAPIService";
import { useWatchlist } from "../../hooks/tournaments/useTournaments";
import { PageHeader, StatusBadge, FormatBadge, Spinner, Empty, ErrorBox, Btn } from "../../components/ui/UI";
import { useState } from "react";

export function WatchlistPage() {
  usePageTitle("Watchlist");
  const { tournaments, loading, error, reload } = useWatchlist();
  const [removing, setRemoving] = useState<number | null>(null);

  const handleRemove = async (id: number) => {
    setRemoving(id);
    await tournamentsApi.removeFromWatchlist(id);
    reload();
    setRemoving(null);
  };

  return (
    <div>
      <PageHeader eyebrow="Moja lista" title="Watchlist" />

      {loading && <div className="flex justify-center py-16"><Spinner size={28} /></div>}
      {error && <ErrorBox message={error} />}
      {!loading && !error && tournaments.length === 0 && (
        <Empty message="Nema praćenih turnira. Idi na turnir i klikni ☆ Prati." />
      )}

      {!loading && !error && tournaments.length > 0 && (
        <div className="space-y-3">
          {tournaments.map(t => (
            <div key={t.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 hover:border-cyan-500/15 transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <Link to={`/tournaments/${t.id}`}
                    className="text-sm font-semibold text-white hover:text-emerald-700 transition-colors truncate">
                    {t.name}
                  </Link>
                  <StatusBadge status={t.status} />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{t.game_name ?? "—"}</span>
                  <FormatBadge format={t.format} />
                  <span className="text-xs text-gray-400 font-mono">{t.registered_teams_count ?? 0}/{t.max_teams} timova</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link to={`/tournaments/${t.id}`}>
                  <Btn size="sm" variant="secondary">Detalji</Btn>
                </Link>
                <Btn size="sm" variant="ghost" disabled={removing === t.id} onClick={() => handleRemove(t.id)}>
                  {removing === t.id ? <Spinner size={12} /> : "Otprati ×"}
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

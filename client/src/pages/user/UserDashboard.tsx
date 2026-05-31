import { Link } from "react-router-dom";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { useMyTeams } from "../../hooks/teams/useTeams";
import { useWatchlist } from "../../hooks/tournaments/useTournaments";
import { useMyMatches } from "../../hooks/matches/useMatches";
import { PageHeader, StatCard, StatusBadge, Spinner, Card } from "../../components/ui/UI";

export default function UserDashboard() {
  usePageTitle("Dashboard");
  const { user } = useAuth();
  const { teams, loading: teamsLoading } = useMyTeams();
  const { tournaments: watchlist, loading: watchlistLoading } = useWatchlist();
  const { matches, loading: matchesLoading } = useMyMatches();

  const upcomingMatches = matches.filter(m => m.status === "scheduled" || m.status === "ongoing");

  return (
    <div>
      <PageHeader eyebrow="Dashboard" title={`Zdravo, ${user?.username} 👋`} />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Moji timovi" value={teamsLoading ? "..." : teams.length} color="text-emerald-600" />
        <StatCard label="Pratim turnira" value={watchlistLoading ? "..." : watchlist.length} color="text-violet-400" />
        <StatCard label="Predstojeći mečevi" value={matchesLoading ? "..." : upcomingMatches.length} color="text-amber-400" />
        <StatCard label="Odigrani mečevi" value={matchesLoading ? "..." : matches.filter(m => m.status === "completed").length} color="text-emerald-400" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Moji timovi */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500">Moji timovi</h3>
            <Link to="/teams" className="text-xs text-emerald-600 hover:text-emerald-700">Svi →</Link>
          </div>
          {teamsLoading ? <div className="flex justify-center py-4"><Spinner /></div> : (
            teams.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-gray-400 mb-3">Nisi član nijednog tima</p>
                <Link to="/teams" className="text-xs text-emerald-600 hover:text-emerald-700">Kreiraj tim →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {teams.slice(0, 4).map(t => (
                  <Link key={t.id} to={`/teams/${t.id}`}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white transition-colors group">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-50 border border-cyan-500/15 flex items-center justify-center">
                        <span className="text-[9px] text-emerald-600 font-bold">{t.tag[0]}</span>
                      </div>
                      <span className="text-xs text-gray-800 group-hover:text-white transition-colors">{t.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">[{t.tag}]</span>
                  </Link>
                ))}
              </div>
            )
          )}
        </Card>

        {/* Watchlist */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500">Watchlist</h3>
            <Link to="/watchlist" className="text-xs text-emerald-600 hover:text-emerald-700">Svi →</Link>
          </div>
          {watchlistLoading ? <div className="flex justify-center py-4"><Spinner /></div> : (
            watchlist.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-gray-400 mb-3">Nema praćenih turnira</p>
                <Link to="/tournaments" className="text-xs text-emerald-600 hover:text-emerald-700">Pretraži turnire →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {watchlist.slice(0, 4).map(t => (
                  <Link key={t.id} to={`/tournaments/${t.id}`}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white transition-colors group">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-800 group-hover:text-white transition-colors truncate">{t.name}</p>
                      <p className="text-[10px] text-gray-500">{t.game_name ?? "—"}</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </Link>
                ))}
              </div>
            )
          )}
        </Card>

        {/* Predstojeći mečevi */}
        <div className="col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500">Predstojeći mečevi</h3>
              <Link to="/matches" className="text-xs text-emerald-600 hover:text-emerald-700">Svi →</Link>
            </div>
            {matchesLoading ? <div className="flex justify-center py-4"><Spinner /></div> : (
              upcomingMatches.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">Nema predstojećih mečeva</p>
              ) : (
                <div className="space-y-2">
                  {upcomingMatches.slice(0, 5).map(m => (
                    <Link key={m.id} to={`/matches/${m.id}`}
                      className="flex items-center justify-between py-3 px-4 rounded-xl bg-white hover:bg-gray-100 transition-colors group">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-gray-400">R{m.round} M{m.match_number}</span>
                        <span className="text-xs text-gray-700">
                          {m.team1_name ?? "TBD"} <span className="text-gray-400 mx-1">vs</span> {m.team2_name ?? "TBD"}
                        </span>
                      </div>
                      <StatusBadge status={m.status} />
                    </Link>
                  ))}
                </div>
              )
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

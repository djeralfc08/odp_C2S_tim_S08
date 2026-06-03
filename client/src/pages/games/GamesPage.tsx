import { useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { Link } from "react-router-dom";
import { useGames } from "../../hooks/games/useGames";
import { PageHeader, Spinner, Empty, ErrorBox } from "../../components/ui/UI";

export function GamesPage() {
  usePageTitle("Igre");
  const { games, loading, error } = useGames();
  const [search, setSearch] = useState("");

  const filtered = games.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.genre ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader eyebrow="Katalog" title="Igre" />

      <div className="mb-6">
        <input
          type="text"
          placeholder="Pretraži igre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm bg-gray-100 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-400 outline-none focus:border-emerald-300 transition-colors"
        />
      </div>

      {loading && <div className="flex justify-center py-16"><Spinner size={28} /></div>}
      {error && <ErrorBox message={error} />}

      {!loading && !error && filtered.length === 0 && <Empty message="Nema igara" />}

      {!loading && !error && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(game => (
            <Link key={game.id}
              to={`/tournaments?game_id=${game.id}`}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-cyan-500/20 transition-all group block"
            >
              {/* Logo placeholder */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/10 border border-gray-200 flex items-center justify-center mb-4">
                <span className="text-2xl font-black text-gray-400">{game.name[0]}</span>
              </div>

              <h3 className="text-sm font-semibold text-white group-hover:text-emerald-700 transition-colors mb-1">
                {game.name}
              </h3>
              {game.genre && <p className="text-xs text-gray-500 mb-3">{game.genre}</p>}

              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 pt-3 border-t border-white/4">
                <span>Max {game.max_team_size} igrača/timu</span>
                {(game.active_tournaments_count ?? 0) > 0 && (
                  <span className="text-emerald-600">{game.active_tournaments_count} turnira</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { useTournaments } from "../../hooks/tournaments/useTournaments";
import { useGames } from "../../hooks/games/useGames";
import { StatusBadge, FormatBadge, Spinner } from "../../components/ui/UI";

function TournamentMiniCard({ t }: { t: { id: number; name: string; game_name?: string; status: string; format: string; registered_teams_count?: number; max_teams: number } }) {
  return (
    <Link to={`/tournaments/${t.id}`}
      className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-md transition-all group block shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-1">{t.name}</h3>
        <StatusBadge status={t.status} />
      </div>
      <p className="text-xs text-gray-400 mb-3">{t.game_name ?? "Nepoznata igra"}</p>
      <div className="flex items-center justify-between">
        <FormatBadge format={t.format} />
        <span className="text-xs text-gray-400 font-mono">{t.registered_teams_count ?? 0}/{t.max_teams} timova</span>
      </div>
    </Link>
  );
}

export function LandingPage() {
  const { user } = useAuth();
  const { tournaments, loading: tLoading } = useTournaments();
  const { games, loading: gLoading } = useGames();

  const activeTournaments = tournaments.filter(t => ["registration", "ongoing", "upcoming"].includes(t.status)).slice(0, 6);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 px-8 h-16 flex items-center justify-between max-w-7xl mx-auto shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-bold">PG</span>
          </div>
          <span className="text-gray-900 font-bold text-lg tracking-tight">PulseGrid</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link to="/tournaments" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Turniri</Link>
          <Link to="/games" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Igre</Link>
          {user ? (
            <Link to={user.role === "admin" ? "/admin" : "/dashboard"}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-sm">
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Prijavi se</Link>
              <Link to="/register" className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-sm">
                Registruj se
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono uppercase tracking-widest mb-8">
          Distribuirana esports platforma
        </div>
        <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-6 leading-tight">
          Organizuj. Takmici se.<br />
          <span className="text-emerald-600">Pobedjuj.</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          PulseGrid je platforma za organizaciju esports turnira. Kreiraj tim, prijavi se na turnir i prati svaki mec do finala.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/tournaments"
            className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors shadow-sm">
            Pregled turnira
          </Link>
          {!user && (
            <Link to="/register"
              className="px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium text-sm hover:bg-white transition-colors shadow-sm">
              Napravi nalog
            </Link>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-8 pb-16">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Aktivnih turnira", value: tournaments.filter(t => t.status === "ongoing").length, color: "text-emerald-600" },
            { label: "Igara u katalogu", value: games.length, color: "text-blue-600" },
            { label: "Ukupno turnira", value: tournaments.length, color: "text-violet-600" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
              <p className={`text-3xl font-black mb-1 ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 font-mono uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Active Tournaments */}
      <section className="max-w-7xl mx-auto px-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Aktivni turniri</h2>
          <Link to="/tournaments" className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors font-medium">Svi turniri &rarr;</Link>
        </div>
        {tLoading ? (
          <div className="flex justify-center py-12"><Spinner size={24} /></div>
        ) : activeTournaments.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">Nema aktivnih turnira</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {activeTournaments.map(t => <TournamentMiniCard key={t.id} t={t} />)}
          </div>
        )}
      </section>

      {/* Games */}
      <section className="max-w-7xl mx-auto px-8 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Katalog igara</h2>
          <Link to="/games" className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors font-medium">Sve igre &rarr;</Link>
        </div>
        {gLoading ? (
          <div className="flex justify-center py-8"><Spinner size={20} /></div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {games.slice(0, 8).map(g => (
              <Link key={g.id} to={`/tournaments?game_id=${g.id}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 hover:shadow-sm transition-all group shadow-sm">
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">{g.name}</span>
                {g.active_tournaments_count !== undefined && g.active_tournaments_count > 0 && (
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">{g.active_tournaments_count}</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-8 py-8 text-center text-xs text-gray-400 font-mono">
        PulseGrid - Distribuirana esports platforma - MySQL Master-Slave Replication
      </footer>
    </div>
  );
}

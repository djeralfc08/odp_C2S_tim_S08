import { useState } from "react";
import { Link } from "react-router-dom";
import { useMyMatches } from "../../hooks/matches/useMatches";
import { PageHeader, StatusBadge, Spinner, Empty, ErrorBox } from "../../components/ui/UI";
import type { MatchStatus } from "../../types/match";

const STATUS_TABS: { value: MatchStatus | "all"; label: string }[] = [
  { value: "all", label: "Svi" },
  { value: "scheduled", label: "Zakazani" },
  { value: "ongoing", label: "U toku" },
  { value: "completed", label: "Završeni" },
];

export function MyMatchesPage() {
  const { matches, loading, error } = useMyMatches();
  const [tab, setTab] = useState<MatchStatus | "all">("all");

  const filtered = tab === "all" ? matches : matches.filter(m => m.status === tab);

  return (
    <div>
      <PageHeader eyebrow="Moji nastupi" title="Mečevi" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit">
        {STATUS_TABS.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === t.value ? "bg-emerald-50 text-emerald-700 border border-cyan-500/20" : "text-gray-500 hover:text-gray-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-16"><Spinner size={28} /></div>}
      {error && <ErrorBox message={error} />}
      {!loading && !error && filtered.length === 0 && <Empty message="Nema mečeva" />}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(m => (
            <Link key={m.id} to={`/matches/${m.id}`}
              className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 hover:border-cyan-500/15 transition-all group block">
              <div className="flex items-center gap-3 w-12">
                <span className="text-[10px] font-mono text-gray-500 text-center">R{m.round}<br />M{m.match_number}</span>
              </div>

              <div className="flex-1 min-w-0">
                {m.tournament_name && (
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">{m.tournament_name}</p>
                )}
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${m.winner_id === m.team1_id ? "text-emerald-700" : "text-gray-800"}`}>
                    {m.team1_name ?? "TBD"}
                  </span>
                  <span className="text-gray-400 text-xs">vs</span>
                  <span className={`text-sm font-semibold ${m.winner_id === m.team2_id ? "text-emerald-700" : "text-gray-800"}`}>
                    {m.team2_name ?? "TBD"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {m.score && (
                  <span className="text-sm font-bold font-mono text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">{m.score}</span>
                )}
                <StatusBadge status={m.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

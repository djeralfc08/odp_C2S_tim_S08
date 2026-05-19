import type { Match } from "../../types/match";
import { StatusBadge } from "../ui/UI";

interface Props {
  matches: Match[];
}

function MatchCell({ match }: { match: Match }) {
  const team1Won = match.winner_id !== null && match.winner_id === match.team1_id;
  const team2Won = match.winner_id !== null && match.winner_id === match.team2_id;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden w-48 shadow-lg">
      <div className={`flex items-center justify-between px-3 py-2 border-b border-gray-200 ${team1Won ? "bg-emerald-500/8" : ""}`}>
        <span className={`text-xs font-medium truncate max-w-28 ${team1Won ? "text-emerald-700" : match.team1_id ? "text-gray-900" : "text-gray-400"}`}>
          {match.team1_name ?? (match.team1_id ? `Tim #${match.team1_id}` : "TBD")}
        </span>
        <span className={`text-xs font-mono ml-2 ${team1Won ? "text-emerald-600 font-bold" : "text-gray-500"}`}>
          {match.score ? match.score.split(":")[0] : "-"}
        </span>
      </div>
      <div className={`flex items-center justify-between px-3 py-2 ${team2Won ? "bg-emerald-500/8" : ""}`}>
        <span className={`text-xs font-medium truncate max-w-28 ${team2Won ? "text-emerald-700" : match.team2_id ? "text-gray-900" : "text-gray-400"}`}>
          {match.team2_name ?? (match.team2_id ? `Tim #${match.team2_id}` : "TBD")}
        </span>
        <span className={`text-xs font-mono ml-2 ${team2Won ? "text-emerald-600 font-bold" : "text-gray-500"}`}>
          {match.score ? match.score.split(":")[1] : "-"}
        </span>
      </div>
      <div className="px-3 py-1.5 border-t border-gray-200 flex items-center justify-between">
        <span className="text-[10px] text-gray-400 font-mono">M{match.match_number}</span>
        <StatusBadge status={match.status} />
      </div>
    </div>
  );
}

export function BracketDiagram({ matches }: Props) {
  if (matches.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
        Raspored mečeva još nije generisan
      </div>
    );
  }

  const maxRound = Math.max(...matches.map(m => m.round));
  const rounds: Match[][] = [];
  for (let r = 1; r <= maxRound; r++) {
    rounds.push(matches.filter(m => m.round === r).sort((a, b) => a.match_number - b.match_number));
  }

  const roundLabels: Record<number, string> = {};
  rounds.forEach((_, idx) => {
    const r = idx + 1;
    if (r === maxRound) roundLabels[r] = "Finale";
    else if (r === maxRound - 1) roundLabels[r] = "Polufinale";
    else if (r === maxRound - 2) roundLabels[r] = "Četvrtfinale";
    else roundLabels[r] = `Runda ${r}`;
  });

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-8 min-w-max">
        {rounds.map((roundMatches, idx) => {
          const round = idx + 1;
          const totalSlots = Math.pow(2, maxRound - round);
          const matchHeight = 100;
          const slotHeight = (rounds[0].length * matchHeight) / Math.max(totalSlots, 1);

          return (
            <div key={round} className="flex flex-col gap-0">
              {/* Round header */}
              <div className="mb-4 text-center">
                <span className="text-xs font-mono uppercase tracking-widest text-gray-500">{roundLabels[round]}</span>
              </div>

              {/* Matches */}
              <div className="flex flex-col" style={{ gap: Math.max(slotHeight - 88, 12) }}>
                {roundMatches.map(match => (
                  <div key={match.id} className="flex items-center">
                    <MatchCell match={match} />
                    {round < maxRound && (
                      <div className="w-8 h-px bg-gray-200 ml-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

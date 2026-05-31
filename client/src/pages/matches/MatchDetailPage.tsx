import { useState, useEffect } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useParams } from "react-router-dom";
import { matchesApi } from "../../api_services/matches/MatchesAPIService";
import { useAuth } from "../../hooks/auth/useAuthHook";
import type { MatchDetail } from "../../types/match";
import {
  PageHeader, Spinner, ErrorBox, SuccessBox, Card, StatusBadge, Btn, Modal
} from "../../components/ui/UI";

export function MatchDetailPage() {
  usePageTitle("Detalji meca");
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"success" | "error">("success");
  const [showNotes, setShowNotes] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);

  const matchId = parseInt(id ?? "0");

  const reload = () => {
    matchesApi.getById(matchId).then(r => {
      if (r.success && r.data) setMatch(r.data);
      else setError(r.message ?? "Greška");
      setLoading(false);
    });
  };

  useEffect(() => { reload(); }, [id]);

  const showMsg = (m: string, type: "success" | "error" = "success") => {
    setMsg(m); setMsgType(type); setTimeout(() => setMsg(null), 3000);
  };

  const handleSaveNotes = async () => {
    if (showNotes === null) return;
    setNotesLoading(true);
    const res = await matchesApi.updatePlayerNotes(matchId, showNotes, notes);
    if (res.success) { showMsg("Beleške ažurirane"); setShowNotes(null); reload(); }
    else showMsg(res.message ?? "Greška", "error");
    setNotesLoading(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;
  if (error || !match) return <ErrorBox message={error ?? "Meč nije pronađen"} />;

  const team1Won = match.winner_id !== null && match.winner_id === match.team1_id;
  const team2Won = match.winner_id !== null && match.winner_id === match.team2_id;

  return (
    <div>
      {msg && <div className="mb-4">{msgType === "success" ? <SuccessBox message={msg} /> : <ErrorBox message={msg} />}</div>}

      <PageHeader eyebrow={`Runda ${match.round} · Meč ${match.match_number}`} title="Detalji meča" />

      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div className={`text-center flex-1 ${team1Won ? "opacity-100" : match.winner_id ? "opacity-40" : "opacity-100"}`}>
            <p className={`text-2xl font-black ${team1Won ? "text-emerald-700" : "text-white"}`}>{match.team1_name ?? "TBD"}</p>
            {team1Won && <span className="text-xs text-emerald-600 font-mono">🏆 POBEDNIK</span>}
          </div>
          <div className="text-center px-8">
            {match.score ? (
              <p className="text-3xl font-black font-mono text-white">{match.score}</p>
            ) : (
              <p className="text-2xl font-black text-gray-400">vs</p>
            )}
            <div className="mt-2"><StatusBadge status={match.status} /></div>
          </div>
          <div className={`text-center flex-1 ${team2Won ? "opacity-100" : match.winner_id ? "opacity-40" : "opacity-100"}`}>
            <p className={`text-2xl font-black ${team2Won ? "text-emerald-700" : "text-white"}`}>{match.team2_name ?? "TBD"}</p>
            {team2Won && <span className="text-xs text-emerald-600 font-mono">🏆 POBEDNIK</span>}
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">Nastupajući igrači</h3>
        {(!match.players || match.players.length === 0) ? (
          <p className="text-xs text-gray-400 text-center py-4">Nema registrovanih nastupajućih igrača</p>
        ) : (
          <div className="space-y-2">
            {match.players.map(p => {
              const teamName = p.team_id === match.team1_id ? match.team1_name : match.team2_name;
              const isMe = p.user_id === user?.id;
              return (
                <div key={p.user_id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center">
                      <span className="text-xs text-gray-500 font-semibold">{(p.username ?? "?")[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900">{p.username ?? `Igrač #${p.user_id}`}</p>
                      <p className="text-[10px] text-gray-500">{teamName ?? `Tim #${p.team_id}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.performance_notes && (
                      <span className="text-[10px] text-gray-500 max-w-32 truncate italic">{p.performance_notes}</span>
                    )}
                    {isMe && (
                      <Btn size="sm" variant="secondary" onClick={() => { setShowNotes(p.user_id); setNotes(p.performance_notes ?? ""); }}>
                        Beleške
                      </Btn>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {showNotes !== null && (
        <Modal title="Beleška o nastupu" onClose={() => setShowNotes(null)}>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500 font-medium">Beleška (opciono)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                placeholder="Npr. MVP nastup, 35 fragova..."
                className="bg-gray-100 border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-400 outline-none focus:border-emerald-300 resize-none" />
            </div>
            <div className="flex gap-2 justify-end">
              <Btn variant="secondary" onClick={() => setShowNotes(null)}>Otkaži</Btn>
              <Btn onClick={handleSaveNotes} disabled={notesLoading}>
                {notesLoading ? <Spinner size={14} /> : "Sačuvaj"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { matchesApi } from "../../api_services/matches/MatchesAPIService";
import { useTournaments } from "../../hooks/tournaments/useTournaments";
import type { Match } from "../../types/match";
import {
  PageHeader, Btn, Spinner, ErrorBox, SuccessBox, StatusBadge, Modal, Select, Input, Table, TableHead, Empty
} from "../../components/ui/UI";

export function AdminMatchResultsPage() {
  usePageTitle("Admin | Rezultati");
  const { tournaments } = useTournaments();
  const [selectedTournament, setSelectedTournament] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"success" | "error">("success");
  const [resultModal, setResultModal] = useState<Match | null>(null);
  const [score, setScore] = useState("");
  const [winnerId, setWinnerId] = useState("");
  const [resultLoading, setResultLoading] = useState(false);
  const [scoreError, setScoreError] = useState("");

  const showMsg = (m: string, type: "success" | "error" = "success") => {
    setMsg(m); setMsgType(type); setTimeout(() => setMsg(null), 3000);
  };

  const loadMatches = (tid: string) => {
    if (!tid) return;
    setLoading(true);
    matchesApi.getByTournament(parseInt(tid)).then(r => {
      if (r.success && r.data) setMatches(r.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (selectedTournament) loadMatches(selectedTournament);
    else setMatches([]);
  }, [selectedTournament]);

  const validateScore = (s: string) => /^\d+:\d+$/.test(s);

  const handleSetResult = async () => {
    if (!resultModal) return;
    if (!validateScore(score)) { setScoreError("Format: X:Y (npr. 2:1)"); return; }
    if (!winnerId) { setScoreError("Izaberi pobednika"); return; }
    setScoreError("");
    setResultLoading(true);
    const res = await matchesApi.setResult(resultModal.id, {
      score,
      winner_id: parseInt(winnerId),
    });
    if (res.success) {
      showMsg("Rezultat unesen!");
      setResultModal(null);
      loadMatches(selectedTournament);
    } else {
      showMsg(res.message ?? "Greška", "error");
    }
    setResultLoading(false);
  };

  const pendingMatches = matches.filter(m => m.status !== "completed");
  const completedMatches = matches.filter(m => m.status === "completed");

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Rezultati mečeva" />

      {msg && <div className="mb-4">{msgType === "success" ? <SuccessBox message={msg} /> : <ErrorBox message={msg} />}</div>}

      <div className="mb-6">
        <Select
          label="Izaberi turnir"
          value={selectedTournament}
          onChange={setSelectedTournament}
          options={[
            { value: "", label: "— Izaberi turnir —" },
            ...tournaments.map(t => ({ value: String(t.id), label: t.name })),
          ]}
        />
      </div>

      {loading && <div className="flex justify-center py-16"><Spinner size={28} /></div>}

      {!loading && selectedTournament && matches.length === 0 && (
        <Empty message="Nema mečeva za ovaj turnir" />
      )}

      {!loading && pendingMatches.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">Čekaju rezultat</h3>
          <Table>
            <TableHead columns={["Runda", "Tim 1", "Tim 2", "Status", "Akcije"]} />
            <tbody>
              {pendingMatches.map(m => (
                <tr key={m.id} className="border-b border-white/4 last:border-0 hover:bg-white/1">
                  <td className="px-5 py-3.5 text-xs font-mono text-gray-500">R{m.round} / M{m.match_number}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-800">{m.team1_name ?? "TBD"}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-800">{m.team2_name ?? "TBD"}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={m.status} /></td>
                  <td className="px-5 py-3.5">
                    <Btn size="sm" onClick={() => { setResultModal(m); setScore(""); setWinnerId(""); setScoreError(""); }}>
                      Unesi rezultat
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {!loading && completedMatches.length > 0 && (
        <div>
          <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">Završeni mečevi</h3>
          <Table>
            <TableHead columns={["Runda", "Tim 1", "Rezultat", "Tim 2", "Pobednik"]} />
            <tbody>
              {completedMatches.map(m => (
                <tr key={m.id} className="border-b border-white/4 last:border-0 hover:bg-white/1">
                  <td className="px-5 py-3.5 text-xs font-mono text-gray-500">R{m.round} / M{m.match_number}</td>
                  <td className={`px-5 py-3.5 text-sm ${m.winner_id === m.team1_id ? "text-emerald-700 font-semibold" : "text-gray-500"}`}>
                    {m.team1_name ?? "TBD"}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-mono font-bold text-gray-700 text-center">{m.score ?? "—"}</td>
                  <td className={`px-5 py-3.5 text-sm ${m.winner_id === m.team2_id ? "text-emerald-700 font-semibold" : "text-gray-500"}`}>
                    {m.team2_name ?? "TBD"}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-emerald-400">
                    {m.winner_id === m.team1_id ? m.team1_name : m.team2_name}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {resultModal && (
        <Modal title="Unos rezultata" onClose={() => setResultModal(null)}>
          <div className="space-y-4">
            <div className="bg-white rounded-xl px-4 py-3 text-center">
              <span className="text-sm font-semibold text-gray-900">{resultModal.team1_name ?? "Tim 1"}</span>
              <span className="text-gray-400 mx-3">vs</span>
              <span className="text-sm font-semibold text-gray-900">{resultModal.team2_name ?? "Tim 2"}</span>
            </div>
            <Input label="Rezultat (format X:Y)" value={score} onChange={setScore}
              placeholder="npr. 2:1" error={scoreError} required />
            <Select label="Pobednik" value={winnerId} onChange={setWinnerId}
              options={[
                { value: "", label: "— Izaberi pobednika —" },
                ...(resultModal.team1_id ? [{ value: String(resultModal.team1_id), label: resultModal.team1_name ?? `Tim #${resultModal.team1_id}` }] : []),
                ...(resultModal.team2_id ? [{ value: String(resultModal.team2_id), label: resultModal.team2_name ?? `Tim #${resultModal.team2_id}` }] : []),
              ]} />
            <div className="flex gap-2 justify-end">
              <Btn variant="secondary" onClick={() => setResultModal(null)}>Otkaži</Btn>
              <Btn onClick={handleSetResult} disabled={resultLoading}>
                {resultLoading ? <Spinner size={14} /> : "Potvrdi rezultat"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

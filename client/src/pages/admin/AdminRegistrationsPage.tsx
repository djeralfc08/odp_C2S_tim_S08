import { useState, useEffect } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useParams } from "react-router-dom";
import { tournamentsApi } from "../../api_services/tournaments/TournamentsAPIService";
import type { RegistrationStatus } from "../../types/tournament";
import type { TournamentDetail } from "../../types/tournament";
import {
  PageHeader, Btn, StatusBadge, Spinner, ErrorBox, SuccessBox, Table, TableHead
} from "../../components/ui/UI";

export function AdminRegistrationsPage() {
  usePageTitle("Admin | Prijave");
  const { id } = useParams<{ id: string }>();
  const tournamentId = parseInt(id ?? "0");
  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"success" | "error">("success");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);

  const load = () => {
    tournamentsApi.getById(tournamentId).then(r => {
      if (r.success && r.data) setTournament(r.data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [id]);

  const showMsg = (m: string, type: "success" | "error" = "success") => {
    setMsg(m); setMsgType(type); setTimeout(() => setMsg(null), 3000);
  };

  const handleUpdateStatus = async (teamId: number, status: RegistrationStatus) => {
    setActionLoading(teamId);
    const res = await tournamentsApi.updateRegistration(tournamentId, teamId, status);
    if (res.success) { showMsg("Status ažuriran"); load(); }
    else showMsg(res.message ?? "Greška", "error");
    setActionLoading(null);
  };

  const handleGenerateBracket = async () => {
    if (!confirm("Generisati raspored mečeva? Ovo će zaključati prijave.")) return;
    setGenerating(true);
    const res = await tournamentsApi.generateBracket(tournamentId);
    if (res.success) showMsg("Raspored generisan!");
    else showMsg(res.message ?? "Greška", "error");
    setGenerating(false);
    load();
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;
  if (!tournament) return <ErrorBox message="Turnir nije pronađen" />;

  const registrations = tournament.registrations ?? [];
  const confirmed = registrations.filter(r => r.status === "confirmed").length;

  return (
    <div>
      {msg && <div className="mb-4">{msgType === "success" ? <SuccessBox message={msg} /> : <ErrorBox message={msg} />}</div>}

      <PageHeader
        eyebrow={tournament.name}
        title="Prijave timova"
        action={
          <Btn onClick={handleGenerateBracket} disabled={generating || confirmed < 2}>
            {generating ? <Spinner size={14} /> : "Generiši raspored"}
          </Btn>
        }
      />

      <div className="flex items-center gap-4 mb-6 text-xs font-mono text-gray-500">
        <span>Ukupno: <span className="text-gray-700">{registrations.length}</span></span>
        <span>Potvrđeni: <span className="text-emerald-400">{confirmed}</span></span>
        <span>Na čekanju: <span className="text-yellow-400">{registrations.filter(r => r.status === "pending").length}</span></span>
        <span>Diskvalifikovani: <span className="text-red-400">{registrations.filter(r => r.status === "disqualified").length}</span></span>
      </div>

      {registrations.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-12">Nema prijavljenih timova</p>
      ) : (
        <Table>
          <TableHead columns={["Tim", "Datum prijave", "Seed", "Status", "Akcije"]} />
          <tbody>
            {registrations.map(reg => (
              <tr key={reg.id} className="border-b border-white/4 last:border-0 hover:bg-white/1 transition-colors">
                <td className="px-5 py-3.5">
                  <span className="text-sm font-medium text-gray-900">{reg.team_name ?? `Tim #${reg.team_id}`}</span>
                  {reg.team_tag && <span className="ml-2 text-xs text-gray-500 font-mono">[{reg.team_tag}]</span>}
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-500 font-mono">
                  {new Date(reg.registered_at).toLocaleDateString("sr-RS")}
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-500 font-mono">{reg.seed ?? "—"}</td>
                <td className="px-5 py-3.5"><StatusBadge status={reg.status} /></td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    {reg.status !== "confirmed" && (
                      <Btn size="sm" variant="secondary" disabled={actionLoading === reg.team_id}
                        onClick={() => handleUpdateStatus(reg.team_id, "confirmed")}>
                        {actionLoading === reg.team_id ? <Spinner size={12} /> : "Potvrdi"}
                      </Btn>
                    )}
                    {reg.status !== "disqualified" && (
                      <Btn size="sm" variant="danger" disabled={actionLoading === reg.team_id}
                        onClick={() => handleUpdateStatus(reg.team_id, "disqualified")}>
                        {actionLoading === reg.team_id ? <Spinner size={12} /> : "Diskvalifikuj"}
                      </Btn>
                    )}
                    {reg.status !== "pending" && (
                      <Btn size="sm" variant="ghost" disabled={actionLoading === reg.team_id}
                        onClick={() => handleUpdateStatus(reg.team_id, "pending")}>
                        Reset
                      </Btn>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

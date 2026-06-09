import { useState, useEffect } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useParams, useNavigate } from "react-router-dom";
import { tournamentsApi } from "../../api_services/tournaments/TournamentsAPIService";
import { useTournamentMatches } from "../../hooks/matches/useMatches";
import { useMyTeams } from "../../hooks/teams/useTeams";
import { useAuth } from "../../hooks/auth/useAuthHook";
import type { TournamentDetail } from "../../types/tournament";
import {
  PageHeader, StatusBadge, FormatBadge, Spinner, ErrorBox,
  Card, Btn, SuccessBox, Modal, Select
} from "../../components/ui/UI";
import { BracketDiagram } from "../../components/bracket/BracketDiagram";

export function TournamentDetailPage() {
  usePageTitle("Turnir");
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"success" | "error">("success");
  const [onWatchlist, setOnWatchlist] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const tournamentId = parseInt(id ?? "0");
  const { matches, loading: matchesLoading } = useTournamentMatches(tournamentId);
  const { teams } = useMyTeams();

  useEffect(() => {
    if (!id) return;
    tournamentsApi.getById(tournamentId).then(r => {
      if (r.success && r.data) setTournament(r.data);
      else setError(r.message ?? "Greška");
      setLoading(false);
    });
  }, [id]);

  const showMsg = (m: string, type: "success" | "error" = "success") => {
    setMsg(m); setMsgType(type);
    setTimeout(() => setMsg(null), 3000);
  };

  const toggleWatch = async () => {
    if (!user) return navigate("/login");
    setWatchLoading(true);
    const res = onWatchlist
      ? await tournamentsApi.removeFromWatchlist(tournamentId)
      : await tournamentsApi.addToWatchlist(tournamentId);
    if (res.success) setOnWatchlist(!onWatchlist);
    else showMsg(res.message ?? "Greška", "error");
    setWatchLoading(false);
  };

  const handleRegister = async () => {
    if (!selectedTeam) return;
    setRegLoading(true);
    setRegError(null);
    const res = await tournamentsApi.register(tournamentId, parseInt(selectedTeam));
    if (res.success) {
      showMsg("Tim je uspešno prijavljen na turnir!");
      setShowRegModal(false);
      setRegError(null);
      const teamId = parseInt(selectedTeam);
      setSelectedTeam("");
      const refresh = async (attempt = 0) => {
        const r = await tournamentsApi.getById(tournamentId);
        if (r.success && r.data) {
          setTournament(r.data);
          const listed = r.data.registrations?.some(reg => reg.team_id === teamId);
          if (listed || attempt >= 4) return;
        }
        setTimeout(() => void refresh(attempt + 1), 400);
      };
      void refresh();
    } else {
      const err = res.message ?? "Greška pri prijavi";
      setRegError(err);
      showMsg(err, "error");
    }
    setRegLoading(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;
  if (error || !tournament) return <ErrorBox message={error ?? "Turnir nije pronađen"} />;

  const deadline = new Date(tournament.registration_deadline);
  const startDate = new Date(tournament.starts_at);
  const canRegister = !!user && tournament.status === "registration_open" && deadline > new Date();

  return (
    <div>
      {msg && (msgType === "success" ? <SuccessBox message={msg} /> : <ErrorBox message={msg} />)}

      <PageHeader
        eyebrow={`${tournament.game_name ?? "Esports"} · Turnir`}
        title={tournament.name}
        action={
          <div className="flex items-center gap-2">
            {user && (
              <Btn onClick={toggleWatch} disabled={watchLoading} variant="secondary">
                {watchLoading ? <Spinner size={14} /> : onWatchlist ? "★ Pratim" : "☆ Prati"}
              </Btn>
            )}
            {canRegister && (
              <Btn onClick={() => { setRegError(null); setShowRegModal(true); }}>Prijavi tim</Btn>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card>
          <p className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-3">Status</p>
          <StatusBadge status={tournament.status} />
        </Card>
        <Card>
          <p className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-3">Format</p>
          <FormatBadge format={tournament.format} />
        </Card>
        <Card>
          <p className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-3">Timovi</p>
          <p className="text-2xl font-bold text-white">{tournament.registered_teams_count ?? 0}<span className="text-sm text-gray-500">/{tournament.max_teams}</span></p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <Card>
          <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">Detalji turnira</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Igra</span>
              <span className="text-xs text-white font-medium">{tournament.game_name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Rok za prijavu</span>
              <span className="text-xs text-white font-medium">{deadline.toLocaleDateString("sr-RS")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Početak</span>
              <span className="text-xs text-white font-medium">{startDate.toLocaleDateString("sr-RS")}</span>
            </div>
            {tournament.prize_pool && (
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Nagradni fond</span>
                <span className="text-xs text-amber-400 font-semibold">{tournament.prize_pool}</span>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">Prijavljeni timovi</h3>
          {tournament.registrations && tournament.registrations.length > 0 ? (
            <div className="space-y-2">
              {tournament.registrations.slice(0, 8).map(reg => (
                <div key={reg.id} className="flex items-center justify-between py-1.5 border-b border-white/4 last:border-0">
                  <div className="flex items-center gap-2">
                    {reg.seed && <span className="text-[10px] font-mono text-gray-400 w-4">#{reg.seed}</span>}
                    <span className="text-xs text-gray-800">{reg.team_name ?? `Tim #${reg.team_id}`}</span>
                    {reg.team_tag && <span className="text-[10px] text-gray-500 font-mono">[{reg.team_tag}]</span>}
                  </div>
                  <StatusBadge status={reg.status} />
                </div>
              ))}
              {tournament.registrations.length > 8 && (
                <p className="text-xs text-gray-400 text-center pt-1">+{tournament.registrations.length - 8} više</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-4 text-center">Nema prijavljenih timova</p>
          )}
        </Card>
      </div>

      {/* Bracket */}
      <Card>
        <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-6">Raspored mečeva</h3>
        {matchesLoading ? (
          <div className="flex justify-center py-8"><Spinner size={24} /></div>
        ) : (
          <BracketDiagram matches={matches} />
        )}
      </Card>

      {/* Register modal */}
      {showRegModal && (
        <Modal title="Prijavi tim na turnir" onClose={() => { setShowRegModal(false); setRegError(null); }}>
          <div className="space-y-4">
            {regError && <ErrorBox message={regError} />}
            <Select
              label="Izaberi tim"
              value={selectedTeam}
              onChange={setSelectedTeam}
              options={[
                { value: "", label: "— Izaberi tim —" },
                ...teams.map(t => ({ value: String(t.id), label: `${t.name} [${t.tag}]` })),
              ]}
            />
            <div className="flex gap-2 justify-end">
              <Btn variant="secondary" onClick={() => setShowRegModal(false)}>Otkaži</Btn>
              <Btn onClick={handleRegister} disabled={!selectedTeam || regLoading}>
                {regLoading ? <Spinner size={14} /> : "Prijavi"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

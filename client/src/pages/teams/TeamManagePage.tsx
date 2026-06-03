import { useState, useEffect } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useParams, useNavigate } from "react-router-dom";
import { teamsApi } from "../../api_services/teams/TeamsAPIService";
import { useAuth } from "../../hooks/auth/useAuthHook";
import type { TeamDetail } from "../../types/team";
import {
  PageHeader, Btn, Modal, Input, Spinner, ErrorBox, SuccessBox,
  Card, RoleBadge
} from "../../components/ui/UI";

export function TeamManagePage() {
  usePageTitle("Upravljanje timom");
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"success" | "error">("success");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteTag, setInviteTag] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const teamId = parseInt(id ?? "0");

  const reload = () => {
    teamsApi.getById(teamId).then(r => {
      if (r.success && r.data) setTeam(r.data);
      else setError(r.message ?? "Greška");
      setLoading(false);
    });
  };

  useEffect(() => { reload(); }, [id]);

  const showMsg = (m: string, type: "success" | "error" = "success") => {
    setMsg(m); setMsgType(type);
    setTimeout(() => setMsg(null), 3000);
  };

  const isCaptain = team?.members?.find(m => m.user_id === user?.id)?.role === "captain";

  const handleInvite = async () => {
    if (!inviteTag.trim()) return;
    setInviteLoading(true);
    const res = await teamsApi.invite(teamId, inviteTag.trim());
    if (res.success) { showMsg("Pozivnica je poslata!"); setShowInvite(false); setInviteTag(""); }
    else showMsg(res.message ?? "Greška", "error");
    setInviteLoading(false);
  };

  const handleRemoveMember = async (userId: number) => {
    setActionLoading(userId);
    const res = await teamsApi.removeMember(teamId, userId);
    if (res.success) { showMsg("Član je uklonjen"); reload(); }
    else showMsg(res.message ?? "Greška", "error");
    setActionLoading(null);
  };

  const handleTransferCaptain = async (userId: number) => {
    setActionLoading(userId);
    const res = await teamsApi.updateMemberRole(teamId, userId, "captain");
    if (res.success) { showMsg("Kapitenstvo preneseno!"); reload(); }
    else showMsg(res.message ?? "Greška", "error");
    setActionLoading(null);
  };

  const handleDeleteTeam = async () => {
    if (!confirm("Da li si sigurna/an? Ovo će obrisati tim i odjaviti ga sa svih turnira.")) return;
    const res = await teamsApi.remove(teamId);
    if (res.success) navigate("/teams");
    else showMsg(res.message ?? "Greška pri brisanju", "error");
  };

  const handleLeave = async () => {
    if (!confirm("Da li zaista želiš da napustiš tim?")) return;
    const res = await teamsApi.removeMember(teamId, user!.id);
    if (res.success) navigate("/teams");
    else showMsg(res.message ?? "Greška", "error");
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;
  if (error || !team) return <ErrorBox message={error ?? "Tim nije pronađen"} />;

  return (
    <div>
      {msg && <div className="mb-4">{msgType === "success" ? <SuccessBox message={msg} /> : <ErrorBox message={msg} />}</div>}

      <PageHeader
        eyebrow="Upravljanje timom"
        title={`${team.name} [${team.tag}]`}
        action={
          <div className="flex gap-2">
            {isCaptain && <Btn onClick={() => setShowInvite(true)}>Pozovi igrača</Btn>}
            {isCaptain
              ? <Btn variant="danger" onClick={handleDeleteTeam}>Obriši tim</Btn>
              : <Btn variant="danger" onClick={handleLeave}>Napusti tim</Btn>
            }
          </div>
        }
      />

      {team.description && (
        <p className="text-sm text-gray-500 mb-6 bg-white border border-gray-200 rounded-xl px-4 py-3">{team.description}</p>
      )}

      <Card>
        <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">
          Članovi · {team.members?.length ?? 0}
        </h3>
        <div className="space-y-1">
          {(team.members ?? []).map(member => (
            <div key={member.user_id}
              className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-white transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-cyan-500/15 flex items-center justify-center">
                  <span className="text-xs text-emerald-600 font-semibold">{member.username[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.username}</p>
                  <p className="text-[10px] text-gray-400 font-mono">
                    Pridružen {new Date(member.joined_at).toLocaleDateString("sr-RS")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RoleBadge role={member.role} />
                {isCaptain && member.user_id !== user?.id && (
                  <div className="flex gap-1 ml-2">
                    {member.role !== "captain" && (
                      <Btn size="sm" variant="secondary"
                        disabled={actionLoading === member.user_id}
                        onClick={() => handleTransferCaptain(member.user_id)}>
                        {actionLoading === member.user_id ? <Spinner size={12} /> : "↑ Kapiten"}
                      </Btn>
                    )}
                    <Btn size="sm" variant="danger"
                      disabled={actionLoading === member.user_id}
                      onClick={() => handleRemoveMember(member.user_id)}>
                      {actionLoading === member.user_id ? <Spinner size={12} /> : "Ukloni"}
                    </Btn>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showInvite && (
        <Modal title="Pozovi igrača" onClose={() => setShowInvite(false)}>
          <div className="space-y-4">
            <Input label="Gamer tag igrača" value={inviteTag} onChange={setInviteTag} placeholder="npr. ProGamer123" required />
            <div className="flex gap-2 justify-end">
              <Btn variant="secondary" onClick={() => setShowInvite(false)}>Otkaži</Btn>
              <Btn onClick={handleInvite} disabled={inviteLoading || !inviteTag.trim()}>
                {inviteLoading ? <Spinner size={14} /> : "Pošalji pozivnicu"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

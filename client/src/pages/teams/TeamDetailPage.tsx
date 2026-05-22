import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { teamsApi } from "../../api_services/teams/TeamsAPIService";
import type { TeamDetail } from "../../types/team";
import { PageHeader, Spinner, ErrorBox, Card, RoleBadge } from "../../components/ui/UI";

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    teamsApi.getById(parseInt(id)).then(r => {
      if (r.success && r.data) setTeam(r.data);
      else setError(r.message ?? "Greška");
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;
  if (error || !team) return <ErrorBox message={error ?? "Tim nije pronađen"} />;

  return (
    <div>
      <PageHeader eyebrow="Javni profil · Tim" title={`${team.name} [${team.tag}]`} />

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-1">
          <Card>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/10 border border-gray-200 flex items-center justify-center mb-4 mx-auto">
              <span className="text-3xl font-black text-gray-500">{team.tag[0]}</span>
            </div>
            <h2 className="text-base font-bold text-white text-center mb-1">{team.name}</h2>
            <p className="text-sm text-gray-500 text-center font-mono mb-4">[{team.tag}]</p>
            {team.description && (
              <p className="text-xs text-gray-500 text-center leading-relaxed">{team.description}</p>
            )}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest text-center">
                Kreiran {new Date(team.created_at).toLocaleDateString("sr-RS")}
              </p>
            </div>
          </Card>
        </div>

        <div className="col-span-2">
          <Card>
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">
              Članovi tima · {team.members?.length ?? 0}
            </h3>
            {(!team.members || team.members.length === 0) ? (
              <p className="text-xs text-gray-400 py-4 text-center">Nema članova</p>
            ) : (
              <div className="space-y-2">
                {team.members.map(m => (
                  <div key={m.user_id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-50 border border-cyan-500/20 flex items-center justify-center">
                        <span className="text-xs text-emerald-600 font-semibold">{m.username[0]?.toUpperCase()}</span>
                      </div>
                      <span className="text-sm text-gray-900 font-medium">{m.username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RoleBadge role={m.role} />
                      <span className="text-[10px] text-gray-400 font-mono">
                        od {new Date(m.joined_at).toLocaleDateString("sr-RS")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

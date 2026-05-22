import { useState } from "react";
import { Link } from "react-router-dom";
import { teamsApi } from "../../api_services/teams/TeamsAPIService";
import { useMyTeams } from "../../hooks/teams/useTeams";
import { PageHeader, Btn, Modal, Input, Spinner, ErrorBox, SuccessBox } from "../../components/ui/UI";

function CreateTeamModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (name.length < 2 || name.length > 80) return "Naziv tima mora biti 2–80 karaktera";
    if (!/^[A-Z0-9]{2,6}$/.test(tag)) return "Tag mora biti 2–6 velikih slova/cifara";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError(null);
    const res = await teamsApi.create({ name, tag, description: description || undefined });
    if (res.success) { onCreated(); onClose(); }
    else setError(res.message ?? "Greška pri kreiranju tima");
    setLoading(false);
  };

  return (
    <Modal title="Kreiraj novi tim" onClose={onClose}>
      <div className="space-y-4">
        {error && <ErrorBox message={error} />}
        <Input label="Naziv tima" value={name} onChange={setName} placeholder="npr. Phoenix Rising" required />
        <Input label="Tag tima (2–6 vel. slova)" value={tag} onChange={v => setTag(v.toUpperCase())} placeholder="PHNX" required />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500 font-medium">Opis (opciono)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
            placeholder="Kratki opis tima..."
            className="bg-gray-100 border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-400 outline-none focus:border-emerald-300 transition-colors resize-none" />
        </div>
        <div className="flex gap-2 justify-end">
          <Btn variant="secondary" onClick={onClose}>Otkaži</Btn>
          <Btn onClick={handleSubmit} disabled={loading}>
            {loading ? <Spinner size={14} /> : "Kreiraj tim"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

export function TeamsPage() {
  const { teams, loading, error, reload } = useMyTeams();
  const [showCreate, setShowCreate] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreated = () => {
    setSuccessMsg("Tim je uspešno kreiran!");
    setTimeout(() => setSuccessMsg(null), 3000);
    reload();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Moji timovi"
        title="Timovi"
        action={<Btn onClick={() => setShowCreate(true)}>+ Novi tim</Btn>}
      />

      {successMsg && <div className="mb-4"><SuccessBox message={successMsg} /></div>}
      {error && <ErrorBox message={error} />}
      {loading && <div className="flex justify-center py-16"><Spinner size={28} /></div>}

      {!loading && !error && teams.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">◎</span>
          </div>
          <p className="text-gray-500 text-sm mb-2">Nisi član nijednog tima</p>
          <p className="text-gray-400 text-xs mb-6">Kreiraj tim i postani kapiten, ili čekaj da te neko pozove</p>
          <Btn onClick={() => setShowCreate(true)}>Kreiraj prvi tim</Btn>
        </div>
      )}

      {!loading && !error && teams.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {teams.map(team => (
            <Link key={team.id} to={`/teams/${team.id}/manage`}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-cyan-500/20 transition-all group block">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/10 border border-gray-200 flex items-center justify-center">
                  <span className="text-sm font-black text-gray-500">{team.tag[0]}</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-emerald-700 transition-colors">{team.name}</h3>
                  <span className="text-xs text-gray-500 font-mono">[{team.tag}]</span>
                </div>
              </div>
              {team.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{team.description}</p>
              )}
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 pt-3 border-t border-white/4">
                <span>{team.member_count ?? "?"} članova</span>
                <span>Upravljaj →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && <CreateTeamModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  );
}

import { useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { gamesApi } from "../../api_services/games/GamesAPIService";
import { useGames } from "../../hooks/games/useGames";
import type { CreateGameDto } from "../../types/game";
import {
  PageHeader, Btn, Input, Modal, Spinner, ErrorBox, SuccessBox,
  Table, TableHead, Empty
} from "../../components/ui/UI";

interface GameFormProps {
  initial?: { name: string; genre: string; max_team_size: string; logo_url: string };
  onSubmit: (dto: CreateGameDto) => Promise<void>;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  title: string;
}

function GameForm({ initial, onSubmit, onClose, loading, error, title }: GameFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [genre, setGenre] = useState(initial?.genre ?? "");
  const [maxSize, setMaxSize] = useState(initial?.max_team_size ?? "5");
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url ?? "");
  const [errs, setErrs] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Naziv je obavezan";
    const size = parseInt(maxSize);
    if (isNaN(size) || size < 1 || size > 20) e.maxSize = "Mora biti između 1 i 20";
    if (Object.keys(e).length) { setErrs(e); return; }
    await onSubmit({ name, genre: genre || undefined, max_team_size: size, logo_url: logoUrl || undefined });
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        {error && <ErrorBox message={error} />}
        <Input label="Naziv igre" value={name} onChange={setName} placeholder="npr. Valorant" required error={errs.name} />
        <Input label="Žanr (opciono)" value={genre} onChange={setGenre} placeholder="npr. FPS, MOBA..." />
        <Input label="Maks. igrača po timu" type="number" value={maxSize} onChange={setMaxSize} required error={errs.maxSize} />
        <Input label="URL logotipa (opciono)" value={logoUrl} onChange={setLogoUrl} placeholder="https://..." />
        <div className="flex gap-2 justify-end">
          <Btn variant="secondary" onClick={onClose}>Otkaži</Btn>
          <Btn onClick={handleSubmit} disabled={loading}>
            {loading ? <Spinner size={14} /> : "Sačuvaj"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

export function AdminGamesPage() {
  usePageTitle("Admin | Igre");
  const { games, loading, error, reload } = useGames();
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"success" | "error">("success");
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const showMsg = (m: string, type: "success" | "error" = "success") => {
    setMsg(m); setMsgType(type); setTimeout(() => setMsg(null), 3000);
  };

  const handleCreate = async (dto: CreateGameDto) => {
    setFormLoading(true); setFormError(null);
    const res = await gamesApi.create(dto);
    if (res.success) { showMsg("Igra kreirana!"); setShowCreate(false); reload(); }
    else setFormError(res.message ?? "Greška");
    setFormLoading(false);
  };

  const handleEdit = async (dto: CreateGameDto) => {
    if (editId === null) return;
    setFormLoading(true); setFormError(null);
    const res = await gamesApi.update(editId, dto);
    if (res.success) { showMsg("Igra ažurirana!"); setEditId(null); reload(); }
    else setFormError(res.message ?? "Greška");
    setFormLoading(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Obriši igru "${name}"? Ovo nije moguće ako ima turnira.`)) return;
    setDeleting(id);
    const res = await gamesApi.remove(id);
    if (res.success) { showMsg("Igra obrisana"); reload(); }
    else showMsg(res.message ?? "Greška", "error");
    setDeleting(null);
  };

  const editGame = games.find(g => g.id === editId);

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Katalog igara"
        action={<Btn onClick={() => setShowCreate(true)}>+ Nova igra</Btn>}
      />

      {msg && <div className="mb-4">{msgType === "success" ? <SuccessBox message={msg} /> : <ErrorBox message={msg} />}</div>}
      {error && <ErrorBox message={error} />}
      {loading && <div className="flex justify-center py-16"><Spinner size={28} /></div>}
      {!loading && !error && games.length === 0 && <Empty message="Nema igara u katalogu" />}

      {!loading && !error && games.length > 0 && (
        <Table>
          <TableHead columns={["Naziv", "Žanr", "Max igrača/timu", "Akt. turniri", "Akcije"]} />
          <tbody>
            {games.map(g => (
              <tr key={g.id} className="border-b border-white/4 last:border-0 hover:bg-white/1 transition-colors">
                <td className="px-5 py-3.5">
                  <p className="text-sm font-medium text-gray-900">{g.name}</p>
                  <p className="text-xs text-gray-400 font-mono">#{g.id}</p>
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-500">{g.genre ?? "—"}</td>
                <td className="px-5 py-3.5 text-xs text-gray-500 font-mono text-center">{g.max_team_size}</td>
                <td className="px-5 py-3.5 text-xs font-mono text-center">
                  <span className={g.active_tournaments_count ? "text-emerald-600" : "text-gray-400"}>
                    {g.active_tournaments_count ?? 0}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-1.5">
                    <Btn size="sm" variant="secondary" onClick={() => setEditId(g.id)}>Uredi</Btn>
                    <Btn size="sm" variant="danger" disabled={deleting === g.id}
                      onClick={() => handleDelete(g.id, g.name)}>
                      {deleting === g.id ? <Spinner size={12} /> : "Briši"}
                    </Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {showCreate && (
        <GameForm title="Nova igra" onClose={() => setShowCreate(false)}
          onSubmit={handleCreate} loading={formLoading} error={formError} />
      )}
      {editGame && (
        <GameForm title="Uredi igru"
          initial={{ name: editGame.name, genre: editGame.genre ?? "", max_team_size: String(editGame.max_team_size), logo_url: editGame.logo_url ?? "" }}
          onClose={() => setEditId(null)} onSubmit={handleEdit} loading={formLoading} error={formError} />
      )}
    </div>
  );
}

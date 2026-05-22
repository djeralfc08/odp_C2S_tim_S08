import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { tournamentsApi } from "../../api_services/tournaments/TournamentsAPIService";
import type { Tournament } from "../../types/tournament";
import { PageHeader, Btn, StatusBadge, FormatBadge, Spinner, Empty, ErrorBox, SuccessBox, Table, TableHead } from "../../components/ui/UI";

export function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"success" | "error">("success");
  const [deleting, setDeleting] = useState<number | null>(null);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    tournamentsApi.getAll().then(r => {
      if (r.success && r.data) setTournaments(r.data);
      else setError(r.message ?? "Greška");
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const showMsg = (m: string, type: "success" | "error" = "success") => {
    setMsg(m); setMsgType(type); setTimeout(() => setMsg(null), 3000);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Obriši turnir "${name}"?`)) return;
    setDeleting(id);
    const res = await tournamentsApi.remove(id);
    if (res.success) { showMsg("Turnir obrisan"); load(); }
    else showMsg(res.message ?? "Greška", "error");
    setDeleting(null);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Upravljanje turnirima"
        action={<Btn onClick={() => navigate("/admin/tournaments/new")}>+ Novi turnir</Btn>}
      />

      {msg && <div className="mb-4">{msgType === "success" ? <SuccessBox message={msg} /> : <ErrorBox message={msg} />}</div>}
      {error && <ErrorBox message={error} />}
      {loading && <div className="flex justify-center py-16"><Spinner size={28} /></div>}
      {!loading && !error && tournaments.length === 0 && <Empty message="Nema turnira" />}

      {!loading && !error && tournaments.length > 0 && (
        <Table>
          <TableHead columns={["Naziv", "Igra", "Format", "Timovi", "Status", "Akcije"]} />
          <tbody>
            {tournaments.map(t => (
              <tr key={t.id} className="border-b border-white/4 last:border-0 hover:bg-white/1 transition-colors">
                <td className="px-5 py-3.5">
                  <p className="text-sm font-medium text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500 font-mono">#{t.id}</p>
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-500">{t.game_name ?? "—"}</td>
                <td className="px-5 py-3.5"><FormatBadge format={t.format} /></td>
                <td className="px-5 py-3.5 text-xs text-gray-500 font-mono">{t.registered_teams_count ?? 0}/{t.max_teams}</td>
                <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <Link to={`/admin/tournaments/${t.id}/registrations`}>
                      <Btn size="sm" variant="secondary">Prijave</Btn>
                    </Link>
                    <Link to={`/admin/tournaments/${t.id}/edit`}>
                      <Btn size="sm" variant="secondary">Uredi</Btn>
                    </Link>
                    <Btn size="sm" variant="danger" disabled={deleting === t.id}
                      onClick={() => handleDelete(t.id, t.name)}>
                      {deleting === t.id ? <Spinner size={12} /> : "Briši"}
                    </Btn>
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

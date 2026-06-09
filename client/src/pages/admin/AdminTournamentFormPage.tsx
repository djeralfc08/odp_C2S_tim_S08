import { useState, useEffect, useRef } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useNavigate, useParams } from "react-router-dom";
import { tournamentsApi } from "../../api_services/tournaments/TournamentsAPIService";
import { useGames } from "../../hooks/games/useGames";
import type { TournamentFormat, TournamentStatus } from "../../types/tournament";
import { PageHeader, Btn, Input, Select, Spinner, ErrorBox, Card } from "../../components/ui/UI";

function isPowerOfTwo(n: number) {
  return n > 0 && (n & (n - 1)) === 0;
}

export function AdminTournamentFormPage() {
  usePageTitle("Admin | Turniri");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { games } = useGames();
  const isEdit = Boolean(id && id !== "new");

  const [name, setName] = useState("");
  const [gameId, setGameId] = useState("");
  const [format, setFormat] = useState<TournamentFormat>("single_elimination");
  const [maxTeams, setMaxTeams] = useState("8");
  const [deadline, setDeadline] = useState("");
  const [startDate, setStartDate] = useState("");
  const [prizePool, setPrizePool] = useState("");
  const [status, setStatus] = useState<TournamentStatus>("registration_open");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const statusTouched = useRef(false);

  useEffect(() => {
    if (!isEdit || !id) return;
    statusTouched.current = false;
    let cancelled = false;
    setFetchLoading(true);
    tournamentsApi.getById(parseInt(id)).then(r => {
      if (cancelled) return;
      if (r.success && r.data) {
        const t = r.data;
        setName(t.name);
        setGameId(String(t.game_id));
        setFormat(t.format);
        setMaxTeams(String(t.max_teams));
        setDeadline(t.registration_deadline.split("T")[0]);
        setStartDate(t.starts_at.split("T")[0]);
        setPrizePool(t.prize_pool ?? "");
        if (!statusTouched.current) setStatus(t.status);
      }
      setFetchLoading(false);
    });
    return () => { cancelled = true; };
  }, [id, isEdit]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.length < 3 || name.length > 120) e.name = "Naziv turnira je obavezan (3–120 karaktera)";
    if (!gameId) e.gameId = "Izaberi igru";
    const mt = parseInt(maxTeams);
    if (isNaN(mt) || mt < 4 || mt > 256) e.maxTeams = "Broj timova mora biti 4–256";
    else if ((format === "single_elimination" || format === "double_elimination") && !isPowerOfTwo(mt))
      e.maxTeams = "Broj timova mora biti stepen broja 2 (4, 8, 16...)";
    if (!deadline) e.deadline = "Obavezan datum";
    if (!startDate) e.startDate = "Obavezan datum";
    if (deadline && startDate && new Date(deadline) >= new Date(startDate))
      e.deadline = "Rok prijave mora biti pre datuma početka";
    if (!isEdit && deadline && new Date(deadline) <= new Date())
      e.deadline = "Rok prijave mora biti u budućnosti";
    if (isEdit && !status) e.status = "Izaberi status";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setErrors({});
    const dto = {
      name, game_id: parseInt(gameId), format, max_teams: parseInt(maxTeams),
      registration_deadline: deadline, starts_at: startDate,
      prize_pool: prizePool || undefined,
      ...(isEdit ? { status } : {}),
    };
    if (isEdit && !dto.status) {
      setErrors({ general: "Status turnira nije izabran" });
      setLoading(false);
      return;
    }
    const res = isEdit && id
      ? await tournamentsApi.update(parseInt(id), dto)
      : await tournamentsApi.create(dto);
    if (res.success) navigate("/admin/tournaments");
    else setErrors({ general: res.message ?? "Greška" });
    setLoading(false);
  };

  if (fetchLoading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  return (
    <div>
      <PageHeader eyebrow="Admin" title={isEdit ? "Uredi turnir" : "Novi turnir"} />

      <Card className="max-w-2xl">
        <div className="space-y-4">
          {errors.general && <ErrorBox message={errors.general} />}

          <Input label="Naziv turnira" value={name} onChange={setName}
            placeholder="npr. Spring Championship 2025" required error={errors.name} />

          <Select label="Igra" value={gameId} onChange={setGameId} required error={errors.gameId}
            options={[{ value: "", label: "— Izaberi igru —" }, ...games.map(g => ({ value: String(g.id), label: g.name }))]} />

          <Select label="Format" value={format} onChange={v => setFormat(v as TournamentFormat)} required
            options={[
              { value: "single_elimination", label: "Single Elimination" },
              { value: "double_elimination", label: "Double Elimination" },
              { value: "round_robin", label: "Round Robin" },
            ]} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Maksimalan broj timova" type="number" value={maxTeams}
              onChange={setMaxTeams} placeholder="8" required error={errors.maxTeams} />
            <Input label="Nagradni fond (opciono)" value={prizePool}
              onChange={setPrizePool} placeholder="npr. $1000" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Rok za prijavu" type="date" value={deadline}
              onChange={setDeadline} required error={errors.deadline} />
            <Input label="Datum početka" type="date" value={startDate}
              onChange={setStartDate} required error={errors.startDate} />
          </div>

          {isEdit && (
            <Select label="Status turnira" value={status} onChange={v => { statusTouched.current = true; setStatus(v as TournamentStatus); }}
              options={[
                { value: "draft", label: "Nacrt" },
                { value: "registration_open", label: "Prijave otvorene" },
                { value: "registration_locked", label: "Prijave zaključane" },
                { value: "in_progress", label: "U toku" },
                { value: "completed", label: "Završen" },
                { value: "cancelled", label: "Otkazan" },
              ]}
            />
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Btn variant="secondary" onClick={() => navigate("/admin/tournaments")}>Otkaži</Btn>
            <Btn onClick={handleSubmit} disabled={loading}>
              {loading ? <Spinner size={14} /> : isEdit ? "Sačuvaj izmene" : "Kreiraj turnir"}
            </Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}

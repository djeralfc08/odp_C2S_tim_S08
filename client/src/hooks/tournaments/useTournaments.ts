import { useState, useEffect, useCallback } from "react";
import type { Tournament } from "../../types/tournament";
import { tournamentsApi } from "../../api_services/tournaments/TournamentsAPIService";

export function useTournaments(params?: { game_id?: number; status?: string; format?: string }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await tournamentsApi.getAll(params);
    if (res.success && res.data) {
      setTournaments(res.data);
    } else {
      setError(res.message ?? "Greška");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { tournaments, loading, error, reload: load };
}

export function useWatchlist() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await tournamentsApi.getWatchlist();
    if (res.success && res.data) {
      setTournaments(res.data);
    } else {
      setError(res.message ?? "Greška");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { tournaments, loading, error, reload: load };
}

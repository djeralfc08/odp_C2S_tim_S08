import { useState, useEffect, useCallback } from "react";
import type { Match } from "../../types/match";
import { matchesApi } from "../../api_services/matches/MatchesAPIService";

export function useTournamentMatches(tournamentId: number) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await matchesApi.getByTournament(tournamentId);
    if (res.success && res.data) {
      setMatches(res.data);
    } else {
      setError(res.message ?? "Greška");
    }
    setLoading(false);
  }, [tournamentId]);

  useEffect(() => { load(); }, [load]);

  return { matches, loading, error, reload: load };
}

export function useMyMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await matchesApi.getMyMatches();
    if (res.success && res.data) {
      setMatches(res.data);
    } else {
      setError(res.message ?? "Greška");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { matches, loading, error, reload: load };
}

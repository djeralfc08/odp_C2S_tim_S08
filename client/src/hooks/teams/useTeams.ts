import { useState, useEffect, useCallback } from "react";
import type { Team } from "../../types/team";
import { teamsApi } from "../../api_services/teams/TeamsAPIService";

export function useMyTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await teamsApi.getMyTeams();
    if (res.success && res.data) {
      setTeams(res.data);
    } else {
      setError(res.message ?? "Greška");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { teams, loading, error, reload: load };
}

import { useState, useEffect, useCallback } from "react";
import type { Game } from "../../types/game";
import { gamesApi } from "../../api_services/games/GamesAPIService";

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await gamesApi.getAll();
    if (res.success && res.data) {
      setGames(res.data);
    } else {
      setError(res.message ?? "Greška");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { games, loading, error, reload: load };
}

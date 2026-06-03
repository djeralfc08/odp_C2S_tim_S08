import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuthHook";
import type { IAuthAPIService } from "../../api_services/auth/IAuthAPIService";

export function LoginForm({ authApi }: { authApi: IAuthAPIService }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(""); setLoading(true);
    const res = await authApi.login(username, password);
    setLoading(false);
    if (!res.success || !res.data) { setError(res.message ?? "Pogrešni kredencijali"); return; }
    login(res.data);
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto mb-4 shadow-sm shadow-emerald-100">
          <span className="text-emerald-700 font-bold text-sm">PG</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Dobrodošao nazad</h1>
        <p className="text-sm text-gray-500 mt-1">Prijavi se na PulseGrid</p>
      </div>

      {error && (
        <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">Gamer tag</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-colors shadow-sm"
            placeholder="tvoj_gamer_tag" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">Lozinka</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-colors shadow-sm"
            placeholder="••••••••" />
        </div>
        <button type="submit" disabled={loading}
          className="mt-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl py-3 text-sm transition-colors shadow-sm shadow-emerald-200">
          {loading ? "Prijavljujem se..." : "Prijavi se"}
        </button>
      </form>

      <p className="text-center text-gray-500 text-sm mt-6">
        Nemaš nalog?{" "}
        <Link to="/register" className="text-emerald-600 hover:text-emerald-700 transition-colors">Registruj se</Link>
      </p>
    </div>
  );
}

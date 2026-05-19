import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuthHook";
import type { IAuthAPIService } from "../../api_services/auth/IAuthAPIService";

function validateGamerTag(v: string) {
  if (v.length < 3 || v.length > 30) return "Gamer tag mora biti 3–30 karaktera";
  if (!/^[a-zA-Z0-9._-]+$/.test(v)) return "Dozvoljeni znakovi: slova, brojevi, _, -, .";
  return null;
}
function validatePassword(v: string) {
  if (v.length < 8) return "Lozinka mora biti najmanje 8 karaktera";
  if (!/[A-Z]/.test(v)) return "Lozinka mora sadržati bar jedno veliko slovo";
  if (!/[0-9]/.test(v)) return "Lozinka mora sadržati bar jedan broj";
  return null;
}

export function RegisterForm({ authApi }: { authApi: IAuthAPIService }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [realName, setRealName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    const tagErr = validateGamerTag(username);
    if (tagErr) e.username = tagErr;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Unesite validan email";
    const passErr = validatePassword(password);
    if (passErr) e.password = passErr;
    return e;
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setServerError("");
    setLoading(true);
    const res = await authApi.register(username, email, password, "user");
    setLoading(false);
    if (!res.success || !res.data) {
      setServerError(res.message ?? "Registracija neuspešna");
      return;
    }
    login(res.data);
  };

  const fieldClass = (err?: string) =>
    `w-full bg-gray-100 border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-400 focus:outline-none transition-colors ${
      err ? "border-red-500/50 focus:border-red-400" : "border-gray-300 focus:border-emerald-400"
    }`;

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto mb-4 shadow-sm shadow-emerald-100">
          <span className="text-emerald-700 font-bold text-sm">PG</span>
        </div>
        <h1 className="text-xl font-bold text-white">Napravi nalog</h1>
        <p className="text-sm text-gray-500 mt-1">Pridruži se PulseGrid platformi</p>
      </div>

      {serverError && (
        <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">
          {serverError}
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">
            Gamer tag <span className="text-red-400">*</span>
          </label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)}
            required placeholder="npr. ProGamer123" className={fieldClass(errors.username)} />
          {errors.username && <p className="text-xs text-red-400 mt-1">{errors.username}</p>}
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">Pravo ime (opciono)</label>
          <input type="text" value={realName} onChange={e => setRealName(e.target.value)}
            placeholder="npr. Marko Marković" className={fieldClass()} />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">
            Email <span className="text-red-400">*</span>
          </label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            required placeholder="email@example.com" className={fieldClass(errors.email)} />
          {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">
            Lozinka <span className="text-red-400">*</span>
          </label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            required placeholder="Min 8 znakova, 1 veliko slovo, 1 broj" className={fieldClass(errors.password)} />
          {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
        </div>

        <button type="submit" disabled={loading}
          className="mt-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl py-3 text-sm transition-colors shadow-sm shadow-emerald-200">
          {loading ? "Kreiram nalog..." : "Registruj se"}
        </button>
      </form>

      <p className="text-center text-gray-500 text-sm mt-6">
        Već imaš nalog?{" "}
        <Link to="/login" className="text-emerald-600 hover:text-emerald-700 transition-colors">Prijavi se</Link>
      </p>
    </div>
  );
}

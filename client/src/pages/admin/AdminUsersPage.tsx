import { useEffect, useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { usersApi, type UserDto } from "../../api_services/users/UsersAPIService";
import {
  PageHeader, Table, TableHead, RoleBadge, Empty, ErrorBox, SuccessBox,
  Spinner, Btn
} from "../../components/ui/UI";

export function AdminUsersPage() {
  usePageTitle("Admin | Korisnici");
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"success" | "error">("success");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");

  const load = () => {
    usersApi.getAll().then(r => {
      if (r.success && r.data) setUsers(r.data);
      else setError(r.message ?? "Greška");
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const showMsg = (m: string, type: "success" | "error" = "success") => {
    setMsg(m); setMsgType(type); setTimeout(() => setMsg(null), 3000);
  };

  const handleChangeRole = async (user: UserDto) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    if (!confirm(`Promeniti ulogu korisnika "${user.username}" u ${newRole}?`)) return;
    setUpdatingId(user.id);
    const res = await usersApi.updateRole(user.id, newRole);
    if (res.success) { showMsg("Uloga promenjena!"); load(); }
    else showMsg(res.message ?? "Greška", "error");
    setUpdatingId(null);
  };

  const filtered = users.filter(u => {
    const matchesRole = !roleFilter || u.role === roleFilter;
    const matchesSearch = !search || u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Korisnici" />

      {msg && <div className="mb-4">{msgType === "success" ? <SuccessBox message={msg} /> : <ErrorBox message={msg} />}</div>}
      {error && <ErrorBox message={error} />}

      <div className="flex gap-3 mb-6">
        <input
          type="text" placeholder="Pretraži po imenu ili emailu..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="bg-gray-100 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-400 outline-none focus:border-emerald-300 transition-colors flex-1 max-w-sm"
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="bg-gray-100 border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-emerald-300 transition-colors">
          <option value="">Sve uloge</option>
          <option value="user">Igrač</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading && <div className="flex justify-center py-16"><Spinner size={28} /></div>}
      {!loading && !error && filtered.length === 0 && <Empty message="Nema korisnika" />}

      {!loading && !error && filtered.length > 0 && (
        <Table>
          <TableHead columns={["#", "Korisnik", "Email", "Uloga", "Status", "Akcije"]} />
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-white/4 last:border-0 hover:bg-white/1 transition-colors">
                <td className="px-5 py-3.5 text-xs text-gray-500 font-mono">{u.id}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center">
                      <span className="text-[9px] text-gray-500 font-semibold">{u.username[0]?.toUpperCase()}</span>
                    </div>
                    <span className="text-sm text-gray-900">{u.username}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-500">{u.email}</td>
                <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-mono ${u.is_active ? "text-emerald-400" : "text-red-400"}`}>
                    {u.is_active ? "Aktivan" : "Neaktivan"}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <Btn size="sm" variant="secondary" disabled={updatingId === u.id}
                    onClick={() => handleChangeRole(u)}>
                    {updatingId === u.id ? <Spinner size={12} /> : u.role === "admin" ? "Ukloni admin" : "Postavi admin"}
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

export default AdminUsersPage;

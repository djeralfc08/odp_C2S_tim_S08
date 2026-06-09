import { useState, useEffect, useCallback } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { auditsApi } from "../../api_services/audits/AuditsAPIService";
import type { AuditLog } from "../../types/audit";
import { PageHeader, Spinner, ErrorBox, Pagination, Table, TableHead } from "../../components/ui/UI";

const PAGE_SIZE = 20;

function formatEntity(log: AuditLog): string | null {
  if (!log.entity) return null;
  return log.entity_id != null ? `${log.entity} #${log.entity_id}` : log.entity;
}

export function AdminAuditPage() {
  usePageTitle("Admin | Audit log");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback((p: number) => {
    setLoading(true);
    setError(null);
    auditsApi.getLogs(p, PAGE_SIZE).then(r => {
      if (r.success && r.data) {
        setLogs(r.data.items ?? []);
        setTotal(r.data.total ?? 0);
      } else {
        setError(r.message ?? "Greška");
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(page); }, [page]);

  const filtered = search
    ? logs.filter(l =>
        (l.action ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (l.username ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (l.entity ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (l.details ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const handlePageChange = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0 });
  };

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Audit Log" />

      <div className="flex items-center gap-4 mb-6">
        <input
          type="text" placeholder="Pretraži akcije, korisnike..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="bg-gray-100 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-400 outline-none focus:border-emerald-300 transition-colors flex-1 max-w-sm"
        />
        <span className="text-xs text-gray-500 font-mono">{total} zapisa ukupno</span>
      </div>

      {error && <ErrorBox message={error} />}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : (
        <>
          <Table>
            <TableHead columns={["Vreme", "Korisnik", "Akcija", "Entitet", "Detalji"]} />
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} className="border-b border-white/4 last:border-0 hover:bg-white/1 transition-colors">
                  <td className="px-5 py-3 text-xs text-gray-500 font-mono whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("sr-RS")}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-700">
                    {log.username ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-mono text-emerald-600/80 bg-emerald-500/5 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-600 font-mono">
                    {formatEntity(log) ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500 max-w-xs truncate">
                    {log.details ?? <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-xs text-gray-400">
                    Nema zapisa
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={handlePageChange} />
        </>
      )}
    </div>
  );
}

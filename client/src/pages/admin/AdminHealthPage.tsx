import { useState, useEffect, useCallback } from "react";
import { healthApi } from "../../api_services/health/HealthAPIService";
import type { DbNodeHealth, ApiNodeHealth } from "../../types/health";
import { PageHeader, NodeBadge, Spinner, Card } from "../../components/ui/UI";

function LatencyBar({ ms }: { ms: number | null }) {
  if (ms === null) return <span className="text-xs text-gray-400 font-mono">—</span>;
  const color = ms < 100 ? "text-emerald-400" : ms < 500 ? "text-yellow-400" : "text-red-400";
  return <span className={`text-xs font-mono ${color}`}>{ms}ms</span>;
}

export function AdminHealthPage() {
  const [dbNodes, setDbNodes] = useState<DbNodeHealth[]>([]);
  const [apiNodes, setApiNodes] = useState<ApiNodeHealth[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [dbRes, apiRes] = await Promise.all([
      healthApi.getDbHealth(),
      healthApi.getApiHealth(),
    ]);
    if (dbRes.success && dbRes.data) setDbNodes(dbRes.data);
    if (apiRes.success && apiRes.data) setApiNodes(apiRes.data);
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  const dbHealthy = dbNodes.filter(n => n.status === "healthy").length;
  const apiHealthy = apiNodes.filter(n => n.status === "healthy").length;

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Health Dashboard"
        action={
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <span className="text-xs text-gray-400 font-mono">
                Ažurirano: {lastUpdate.toLocaleTimeString("sr-RS")}
              </span>
            )}
            <button onClick={refresh}
              className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors border border-cyan-500/20 px-3 py-1.5 rounded-lg">
              Osvježi
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : (
        <div className="space-y-8">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">DB čvorovi</p>
                  <p className="text-2xl font-bold text-white">
                    <span className="text-emerald-400">{dbHealthy}</span>
                    <span className="text-gray-400">/{dbNodes.length}</span>
                  </p>
                  <p className="text-xs text-gray-500">zdravih čvorova</p>
                </div>
                <div className="text-4xl opacity-20">🗄️</div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">API čvorovi</p>
                  <p className="text-2xl font-bold text-white">
                    <span className="text-emerald-400">{apiHealthy}</span>
                    <span className="text-gray-400">/{apiNodes.length}</span>
                  </p>
                  <p className="text-xs text-gray-500">zdravih čvorova</p>
                </div>
                <div className="text-4xl opacity-20">⚡</div>
              </div>
            </Card>
          </div>

          {/* DB Nodes */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">MySQL čvorovi (Master-Slave)</h3>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {["Čvor", "Uloga", "Host", "Port", "Status", "Latencija", "Poslednja provjera"].map(c => (
                      <th key={c} className="text-left px-5 py-3.5 text-xs text-gray-500 font-mono uppercase tracking-wider">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dbNodes.map(node => (
                    <tr key={node.name} className="border-b border-white/4 last:border-0 hover:bg-white/1">
                      <td className="px-5 py-3.5 font-mono text-sm text-gray-900 font-semibold">{node.name}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded font-mono ${node.role === "master" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"}`}>
                          {node.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 font-mono">{node.host}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 font-mono">{node.port}</td>
                      <td className="px-5 py-3.5"><NodeBadge status={node.status} /></td>
                      <td className="px-5 py-3.5"><LatencyBar ms={node.latency} /></td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 font-mono">
                        {new Date(node.last_check).toLocaleTimeString("sr-RS")}
                      </td>
                    </tr>
                  ))}
                  {dbNodes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-xs text-gray-400">Nema podataka</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* API Nodes */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">API serveri (Load Balancer pool)</h3>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {["Server", "URL", "Port", "Status", "Latencija", "Poslednja provjera"].map(c => (
                      <th key={c} className="text-left px-5 py-3.5 text-xs text-gray-500 font-mono uppercase tracking-wider">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {apiNodes.map(node => (
                    <tr key={node.id} className="border-b border-white/4 last:border-0 hover:bg-white/1">
                      <td className="px-5 py-3.5 font-mono text-sm text-gray-900">API #{node.id}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 font-mono">{node.url}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 font-mono">{node.port}</td>
                      <td className="px-5 py-3.5"><NodeBadge status={node.status} /></td>
                      <td className="px-5 py-3.5"><LatencyBar ms={node.latency} /></td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 font-mono">
                        {new Date(node.last_check).toLocaleTimeString("sr-RS")}
                      </td>
                    </tr>
                  ))}
                  {apiNodes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-xs text-gray-400">Nema podataka</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Auto-refresh notice */}
          <p className="text-[10px] text-gray-400 font-mono text-center">
            Automatski refresh svakih 10 sekundi · SELECT 1 health check na svim čvorovima
          </p>
        </div>
      )}
    </div>
  );
}

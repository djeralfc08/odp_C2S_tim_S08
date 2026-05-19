import { type ReactNode } from "react";

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin inline-block" style={{ color: "#10b981" }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 60" />
    </svg>
  );
}

export function Empty({ message = "Nema podataka" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
        <span className="text-gray-400 text-lg">◦</span>
      </div>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">
      {message}
    </div>
  );
}

export function SuccessBox({ message }: { message: string }) {
  return (
    <div className="border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-xl">
      {message}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:       "bg-amber-50 text-amber-700 border-amber-200",
    active:        "bg-blue-50 text-blue-700 border-blue-200",
    completed:     "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled:     "bg-red-50 text-red-600 border-red-200",
    upcoming:      "bg-violet-50 text-violet-700 border-violet-200",
    registration:  "bg-teal-50 text-teal-700 border-teal-200",
    ongoing:       "bg-blue-50 text-blue-700 border-blue-200",
    confirmed:     "bg-emerald-50 text-emerald-700 border-emerald-200",
    disqualified:  "bg-red-50 text-red-600 border-red-200",
    scheduled:     "bg-gray-100 text-gray-600 border-gray-200",
  };
  const dot: Record<string, string> = {
    pending: "bg-amber-400", active: "bg-blue-500 animate-pulse", completed: "bg-emerald-500",
    cancelled: "bg-red-400", upcoming: "bg-violet-500", registration: "bg-teal-500 animate-pulse",
    ongoing: "bg-blue-500 animate-pulse", confirmed: "bg-emerald-500", disqualified: "bg-red-400",
    scheduled: "bg-gray-400",
  };
  const labels: Record<string, string> = {
    pending: "Na čekanju", active: "Aktivan", completed: "Završen", cancelled: "Otkazan",
    upcoming: "Predstojeći", registration: "Registracija", ongoing: "U toku",
    confirmed: "Potvrđen", disqualified: "Diskvalifikovan", scheduled: "Zakazan",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${map[status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status] ?? "bg-gray-400"}`} />
      {labels[status] ?? status}
    </span>
  );
}

export function FormatBadge({ format }: { format: string }) {
  const map: Record<string, string> = {
    single_elimination: "bg-orange-50 text-orange-700 border-orange-200",
    double_elimination: "bg-rose-50 text-rose-700 border-rose-200",
    round_robin:        "bg-teal-50 text-teal-700 border-teal-200",
  };
  const labels: Record<string, string> = {
    single_elimination: "Single Elim",
    double_elimination: "Double Elim",
    round_robin:        "Round Robin",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${map[format] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {labels[format] ?? format}
    </span>
  );
}

export function NodeBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    healthy:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    degraded: "bg-amber-50 text-amber-700 border-amber-200",
    offline:  "bg-red-50 text-red-600 border-red-200",
  };
  const dot: Record<string, string> = {
    healthy: "bg-emerald-500 animate-pulse", degraded: "bg-amber-400", offline: "bg-red-500",
  };
  const labels: Record<string, string> = { healthy: "Zdrav", degraded: "Degradiran", offline: "Nedostupan" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${map[status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status] ?? "bg-gray-400"}`} />
      {labels[status] ?? status}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${
      role === "admin"   ? "bg-amber-50 text-amber-700 border-amber-200" :
      role === "captain" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
      "bg-gray-100 text-gray-600 border-gray-200"
    }`}>
      {role === "admin" ? "Admin" : role === "captain" ? "Kapiten" : "Član"}
    </span>
  );
}

export function Pagination({ page, total, pageSize, onChange }: {
  page: number; total: number; pageSize: number; onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-3 mt-5 text-xs text-gray-400">
      <button
        disabled={page <= 1} onClick={() => onChange(page - 1)}
        className="px-3 py-1.5 border border-gray-200 rounded-lg hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-30 transition-colors bg-white"
      >←</button>
      <span className="font-mono text-gray-600">{page} / {totalPages}</span>
      <button
        disabled={page >= totalPages} onClick={() => onChange(page + 1)}
        className="px-3 py-1.5 border border-gray-200 rounded-lg hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-30 transition-colors bg-white"
      >→</button>
      <span className="text-gray-400">{total} ukupno</span>
    </div>
  );
}

export function StatCard({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-2 hover:border-emerald-300 hover:shadow-sm transition-all shadow-sm">
      <p className="text-xs text-gray-400 uppercase tracking-widest font-mono">{label}</p>
      <p className={`text-2xl font-bold tracking-tight ${color ?? "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ columns }: { columns: string[] }) {
  return (
    <thead>
      <tr className="border-b border-gray-200 bg-gray-50">
        {columns.map((c) => (
          <th key={c} className="text-left px-5 py-3.5 text-xs text-gray-500 font-mono uppercase tracking-wider">{c}</th>
        ))}
      </tr>
    </thead>
  );
}

export function PageHeader({ eyebrow, title, action }: {
  eyebrow: string; title: string; action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <p className="text-xs text-emerald-600 font-mono uppercase tracking-widest mb-1">{eyebrow}</p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Btn({
  children, onClick, variant = "primary", disabled = false, type = "button", size = "md", className = ""
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const base = "inline-flex items-center gap-2 font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" };
  const variants = {
    primary:   "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm",
    secondary: "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm",
    danger:    "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
    ghost:     "text-gray-500 hover:text-gray-800 hover:bg-gray-100",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Input({
  label, type = "text", value, onChange, placeholder, error, required
}: {
  label?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs text-gray-600 font-medium">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        className={`bg-white border rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors shadow-sm
          ${error ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" : "border-gray-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"}`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Select({
  label, value, onChange, options, error, required
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs text-gray-600 font-medium">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        value={value} onChange={e => onChange(e.target.value)} required={required}
        className={`bg-white border rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors shadow-sm
          ${error ? "border-red-300 focus:border-red-400" : "border-gray-300 focus:border-emerald-400"}`}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Modal({ title, children, onClose }: {
  title: string; children: ReactNode; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors text-lg leading-none">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

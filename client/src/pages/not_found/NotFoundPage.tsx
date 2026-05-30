import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="font-mono text-8xl text-gray-100 mb-2 font-black select-none">404</p>
        <p className="text-gray-800 font-semibold text-lg mb-2">Stranica nije pronađena</p>
        <p className="text-gray-400 text-sm mb-8">Stranica koju tražiš ne postoji ili je premeštena.</p>
        <Link to="/" className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-sm">← Nazad na početnu</Link>
      </div>
    </main>
  );
}

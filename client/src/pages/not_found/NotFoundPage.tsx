import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="font-mono text-7xl text-white/6 mb-4 font-bold">404</p>
        <p className="text-gray-500 text-sm mb-6">Page not found.</p>
        <Link to="/login" className="text-gray-500 text-sm hover:text-gray-900 transition-colors">← Back to login</Link>
      </div>
    </main>
  );
}

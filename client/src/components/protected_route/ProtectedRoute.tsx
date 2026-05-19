import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { Spinner } from "../ui/UI";

export const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole: string }> = ({ children, requiredRole }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Spinner size={24} />
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  if (user?.role !== requiredRole) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="border border-red-500/20 bg-red-500/8 rounded-2xl p-10 text-center max-w-sm">
        <p className="text-red-400 text-sm mb-2">Nemate pristup ovoj stranici.</p>
        <p className="text-xs text-gray-500 mb-6">
          Potrebna uloga: <span className="text-gray-500">{requiredRole}</span> · Vaša uloga: <span className="text-gray-500">{user?.role}</span>
        </p>
        <a href="/" className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors">← Nazad na početnu</a>
      </div>
    </div>
  );

  return <>{children}</>;
};

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "../../components/auth/LoginForm";
import { authApi } from "../../api_services/auth/AuthAPIService";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { usePageTitle } from "../../hooks/usePageTitle";

export default function LoginPage() {
  usePageTitle("Prijava");
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    navigate(user.role === "admin" ? "/admin" : "/dashboard");
  }, [isAuthenticated, user, navigate]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <LoginForm authApi={authApi} />
    </main>
  );
}

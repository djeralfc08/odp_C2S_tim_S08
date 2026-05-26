import type { ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/protected_route/ProtectedRoute";
import { Layout } from "./components/layout/Layout";

// Auth
import LoginPage    from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import NotFoundPage from "./pages/not_found/NotFoundPage";

// Public
import { LandingPage }          from "./pages/landing/LandingPage";
import { GamesPage }            from "./pages/games/GamesPage";
import { TournamentsPage }      from "./pages/tournaments/TournamentsPage";
import { TournamentDetailPage } from "./pages/tournaments/TournamentDetailPage";
import { TeamDetailPage }       from "./pages/teams/TeamDetailPage";

// User (igrač)
import UserDashboard            from "./pages/user/UserDashboard";
import { TeamsPage }            from "./pages/teams/TeamsPage";
import { TeamManagePage }       from "./pages/teams/TeamManagePage";
import { WatchlistPage }        from "./pages/watchlist/WatchlistPage";
import { MyMatchesPage }        from "./pages/matches/MyMatchesPage";
import { MatchDetailPage }      from "./pages/matches/MatchDetailPage";
import { ProfilePage }          from "./pages/profile/ProfilePage";

// Admin
import AdminDashboard           from "./pages/admin/AdminDashboard";
import { AdminTournamentsPage } from "./pages/admin/AdminTournamentsPage";
import { AdminTournamentFormPage } from "./pages/admin/AdminTournamentFormPage";
import { AdminRegistrationsPage } from "./pages/admin/AdminRegistrationsPage";
import { AdminGamesPage }       from "./pages/admin/AdminGamesPage";
import { AdminUsersPage }       from "./pages/admin/AdminUsersPage";
import { AdminMatchResultsPage } from "./pages/admin/AdminMatchResultsPage";
import { AdminHealthPage }      from "./pages/admin/AdminHealthPage";
import { AdminAuditPage }       from "./pages/admin/AdminAuditPage";

function WithLayout({ children }: { children: ReactNode }) {
  return <Layout>{children}</Layout>;
}

function AdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin">
      <WithLayout>{children}</WithLayout>
    </ProtectedRoute>
  );
}

function UserRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="player">
      <WithLayout>{children}</WithLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Javne auth stranice (bez layouta) */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Landing page (bez layouta) */}
      <Route path="/" element={<LandingPage />} />

      {/* Javne stranice sa layoutom */}
      <Route path="/tournaments"     element={<WithLayout><TournamentsPage /></WithLayout>} />
      <Route path="/tournaments/:id" element={<WithLayout><TournamentDetailPage /></WithLayout>} />
      <Route path="/games"           element={<WithLayout><GamesPage /></WithLayout>} />
      <Route path="/teams/:id"       element={<WithLayout><TeamDetailPage /></WithLayout>} />

      {/* Igrač stranice */}
      <Route path="/dashboard"          element={<UserRoute><UserDashboard /></UserRoute>} />
      <Route path="/teams"              element={<UserRoute><TeamsPage /></UserRoute>} />
      <Route path="/teams/:id/manage"   element={<UserRoute><TeamManagePage /></UserRoute>} />
      <Route path="/watchlist"          element={<UserRoute><WatchlistPage /></UserRoute>} />
      <Route path="/matches"            element={<UserRoute><MyMatchesPage /></UserRoute>} />
      <Route path="/matches/:id"        element={<UserRoute><MatchDetailPage /></UserRoute>} />
      <Route path="/profile"            element={<UserRoute><ProfilePage /></UserRoute>} />

      {/* Admin stranice */}
      <Route path="/admin"                                  element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/tournaments"                      element={<AdminRoute><AdminTournamentsPage /></AdminRoute>} />
      <Route path="/admin/tournaments/new"                  element={<AdminRoute><AdminTournamentFormPage /></AdminRoute>} />
      <Route path="/admin/tournaments/:id/edit"             element={<AdminRoute><AdminTournamentFormPage /></AdminRoute>} />
      <Route path="/admin/tournaments/:id/registrations"    element={<AdminRoute><AdminRegistrationsPage /></AdminRoute>} />
      <Route path="/admin/games"                            element={<AdminRoute><AdminGamesPage /></AdminRoute>} />
      <Route path="/admin/users"                            element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
      <Route path="/admin/matches"                          element={<AdminRoute><AdminMatchResultsPage /></AdminRoute>} />
      <Route path="/admin/health"                           element={<AdminRoute><AdminHealthPage /></AdminRoute>} />
      <Route path="/admin/audit"                            element={<AdminRoute><AdminAuditPage /></AdminRoute>} />

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*"    element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <section className="mx-auto max-w-xl rounded-2xl border border-border bg-panel p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Checking session...</h2>
      </section>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

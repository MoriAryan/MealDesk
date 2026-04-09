import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { Coffee } from "lucide-react";

export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center gap-4"
        style={{ background: "var(--color-bg)" }}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-3xl shadow-xl"
          style={{
            background: "linear-gradient(135deg, var(--color-accent) 0%, #f97316 100%)",
            boxShadow: "0 8px 32px rgba(193,91,61,0.4)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        >
          <Coffee size={24} className="text-white" />
        </div>
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--color-muted)" }}
        >
          Checking session…
        </p>
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); box-shadow: 0 8px 32px rgba(193,91,61,0.4); }
            50%       { transform: scale(1.06); box-shadow: 0 12px 40px rgba(193,91,61,0.55); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/landing" replace />;
  }

  return children;
}

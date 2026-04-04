import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

type AuthTab = "login" | "signup";

export function LoginPage() {
  const { login, signup, user } = useAuth();
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === "login") {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Authentication failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto mt-8 max-w-xl rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] p-6 shadow-sm md:mt-14 md:p-8">
      <div className="mb-6 flex gap-2 rounded-xl bg-[var(--c-panel-2)] p-1">
        <button
          type="button"
          onClick={() => setActiveTab("login")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${
            activeTab === "login" ? "bg-[var(--c-accent)] text-white" : "text-[var(--c-ink)]"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("signup")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${
            activeTab === "signup" ? "bg-[var(--c-accent)] text-white" : "text-[var(--c-ink)]"
          }`}
        >
          Signup
        </button>
      </div>

      <h2 className="text-2xl font-semibold">{activeTab === "login" ? "Welcome Back" : "Create Account"}</h2>
      <p className="mt-2 text-sm text-[var(--c-muted)]">Phase 2 auth is now partially implemented.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {activeTab === "signup" ? (
          <label className="block text-sm">
            Name
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--c-border)] bg-white px-3 py-2"
            />
          </label>
        ) : null}

        <label className="block text-sm">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--c-border)] bg-white px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          Password
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--c-border)] bg-white px-3 py-2"
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--c-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Please wait..." : activeTab === "login" ? "Login" : "Signup"}
        </button>
      </form>
    </section>
  );
}

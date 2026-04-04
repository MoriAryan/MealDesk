import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Coffee } from "lucide-react";

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

  const inputClasses = "mt-2 block w-full rounded-xl border border-border bg-bg/50 px-4 py-3 text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors shadow-inner"

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center justify-center rounded-2xl bg-accent p-3 shadow-lg shadow-accent/20">
         <Coffee size={32} className="text-white" />
      </div>
      
      <section className="w-full max-w-md overflow-hidden rounded-[2rem] border border-border bg-panel/80 p-8 shadow-[var(--shadow-artisanal)] backdrop-blur-xl sm:p-10">
        
        <div className="relative mb-10 flex w-full rounded-full bg-bg p-1 shadow-inner border border-border/50">
          <div 
             className="absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-full bg-panel shadow-sm transition-transform duration-300 ease-out"
             style={{ transform: activeTab === 'login' ? 'translateX(0)' : 'translateX(100%)' }}
          />
          <button
            type="button"
            onClick={() => setActiveTab("login")}
            className={`relative z-10 flex-1 py-2.5 text-sm font-semibold tracking-wide transition-colors ${activeTab === 'login' ? 'text-accent' : 'text-muted hover:text-ink'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("signup")}
            className={`relative z-10 flex-1 py-2.5 text-sm font-semibold tracking-wide transition-colors ${activeTab === 'signup' ? 'text-accent' : 'text-muted hover:text-ink'}`}
          >
            Create Account
          </button>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-ink">
            {activeTab === "login" ? "Welcome back" : "Join the cafe"}
          </h2>
          <p className="mt-2 text-sm text-muted">
             {activeTab === "login" ? "Enter your credentials to access the terminal." : "Set up your management account."}
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {activeTab === "signup" && (
            <label className="block text-sm font-medium text-ink">
              Full Name
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Manager Name"
                className={inputClasses}
              />
            </label>
          )}

          <label className="block text-sm font-medium text-ink">
            Email Address
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="manager@cafe.com"
              className={inputClasses}
            />
          </label>

          <label className="block text-sm font-medium text-ink">
            Password
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className={inputClasses}
            />
          </label>

          {error && (
            <div className="rounded-xl bg-red-500/10 p-3 text-center border border-red-500/20">
               <p className="text-sm font-medium text-red-500">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-accent px-4 py-3.5 text-sm font-bold tracking-wide text-white transition-all hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-panel disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-accent/20"
          >
            {loading ? "Authenticating..." : activeTab === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </section>
    </div>
  );
}

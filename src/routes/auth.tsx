import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import adoLogoFull from "@/assets/ado-logo-full.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — ADO International Transport Nepal" },
      {
        name: "description",
        content: "Sign in to the ADO International Transport Nepal cargo tracking dashboard.",
      },
      { property: "og:title", content: "Sign in — ADO International Transport Nepal" },
      {
        property: "og:description",
        content: "Team access to consignments, warehouse stock and transit tracking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (signUpError) throw signUpError;
        setMessage("Account created. Check your inbox if confirmation is required, then sign in.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const googleSignIn = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src={adoLogoFull.url}
            alt="ADO International"
            className="h-28 w-auto max-w-full object-contain"
          />
          <span className="mt-2 text-sm font-extrabold text-sky-800 tracking-wide">
            ADO International Transport Nepal
          </span>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-white p-6 shadow-xl shadow-sky-900/5">
          <h1 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <Package size={18} className="text-sky-500" />
            {mode === "signin" ? "Team sign in" : "Create your account"}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Access the live cargo ledger, transit tracker and client directory.
          </p>

          <form onSubmit={submit} className="mt-5 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
            {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}
            {message && <p className="text-xs font-semibold text-emerald-600">{message}</p>}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-sky-600 disabled:opacity-60"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span className="h-px flex-1 bg-sky-200" />
            or
            <span className="h-px flex-1 bg-sky-200" />
          </div>

          <button
            onClick={googleSignIn}
            className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700"
          >
            Continue with Google
          </button>

          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setMessage(null);
            }}
            className="mt-5 w-full text-center text-xs font-semibold text-slate-500 hover:text-sky-700"
          >
            {mode === "signin" ? "No account yet? Create one" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Compass, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { travelApi } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const result = await travelApi.login({ email: email.trim().toLowerCase(), password });
      setSession(result.token, result.user);
      toast.success("You are signed in.");
      navigate((location.state as { from?: string } | null)?.from || "/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="glass-card overflow-hidden">
          <div className="bg-foreground px-8 py-7 text-background">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary">
                <Compass className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-background/60">Account</p>
                <h1 className="mt-2 font-heading text-3xl font-semibold">Log in</h1>
              </div>
            </div>
            <p className="mt-4 text-sm text-background/75">
              Sign in to keep your destination searches in Mongo-backed history and reuse them across sessions.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5 p-8">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="traveler@email.com" required />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Password</label>
                <Link to="/forgot-password" className="text-sm font-semibold text-primary">
                  Forgot password?
                </Link>
              </div>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log In"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              New here?{" "}
              <Link to="/signup" className="font-semibold text-primary">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Login;

import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Compass, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { travelApi } from "@/lib/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { setSession } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const token = useMemo(() => params.get("token") || "", [params]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!token) {
      toast.error("Reset token is missing.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await travelApi.resetPassword({ token, password });
      setSession(result.token, result.user);
      toast.success("Password updated.");
      navigate("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="glass-card overflow-hidden">
          <div className="bg-accent px-8 py-7 text-accent-foreground">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-accent-foreground/70">Security</p>
                <h1 className="mt-2 font-heading text-3xl font-semibold">Reset password</h1>
              </div>
            </div>
            <p className="mt-4 text-sm text-accent-foreground/80">
              Choose a new password to restore access to your account.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5 p-8">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">New Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Confirm Password</label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} required />
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Need a new link?{" "}
              <Link to="/forgot-password" className="font-semibold text-primary">
                Request another one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
};

export default ResetPassword;

import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Compass, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { travelApi } from "@/lib/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetUrl, setResetUrl] = useState("");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const result = await travelApi.forgotPassword({ email });
      setResetUrl(result.resetUrl || "");
      toast.success(result.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create a reset link.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="glass-card overflow-hidden">
          <div className="bg-secondary px-8 py-7 text-secondary-foreground">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-secondary-foreground/70">Security</p>
                <h1 className="mt-2 font-heading text-3xl font-semibold">Forgot password</h1>
              </div>
            </div>
            <p className="mt-4 text-sm text-secondary-foreground/80">
              Enter your email and we’ll generate a password reset link for this app.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5 p-8">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="traveler@email.com" required />
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
            </Button>

            {resetUrl ? (
              <div className="rounded-2xl border border-border bg-muted/50 p-4 text-sm">
                <p className="font-semibold text-foreground">Reset link</p>
                <a href={resetUrl} className="mt-2 block break-all font-medium text-primary">
                  {resetUrl}
                </a>
              </div>
            ) : null}

            <p className="text-center text-sm text-muted-foreground">
              Back to{" "}
              <Link to="/login" className="font-semibold text-primary">
                login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword;

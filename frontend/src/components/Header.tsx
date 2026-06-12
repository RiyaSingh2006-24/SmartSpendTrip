import { useState } from "react";
import { Bell, Compass, Menu, PlaneTakeoff, UserCircle, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Planner", sectionId: "trip-planner" },
  { label: "Explore", sectionId: "features" },
  { label: "Nearby", sectionId: "nearby-finder" },
  { label: "AI Advisor", sectionId: "ai-advisor" },
  { label: "Saved Trips", sectionId: "saved-trips" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const scrollToSection = (sectionId: string) => {
    navigate("/");
    setMobileOpen(false);
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/50 bg-background/78 shadow-[0_10px_40px_-30px_hsl(var(--foreground)/0.55)] backdrop-blur-2xl">
      <div className="container mx-auto flex h-20 items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-primary shadow-[0_16px_34px_-20px_hsl(var(--primary))]">
            <PlaneTakeoff className="h-5 w-5 text-primary-foreground" />
            <Compass className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-foreground p-0.5 text-background" />
          </div>
          <span className="hidden font-heading text-xl font-semibold sm:inline">SmartSpend Trip AI</span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-white/70 bg-card/76 p-1.5 shadow-sm lg:flex">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => scrollToSection(item.sectionId)}
              className="pill-nav relative after:absolute after:inset-x-5 after:-bottom-1 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform hover:after:scale-x-100"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => scrollToSection("saved-trips")}
              aria-label="Notifications"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card/80 text-muted-foreground shadow-sm transition hover:-translate-y-0.5 hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
            </button>
            {user ? (
              <>
                <div className="flex items-center gap-2 rounded-full border border-border bg-card/85 px-3 py-2 text-sm shadow-sm">
                  <UserCircle className="h-4 w-4 text-primary" />
                  <span>{user.name}</span>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          <button
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card shadow-sm md:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-border bg-card/95 p-4 shadow-xl backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => scrollToSection(item.sectionId)}
                className="rounded-2xl px-4 py-3 text-left text-sm font-medium text-foreground transition hover:bg-muted"
              >
                {item.label}
              </button>
            ))}
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl px-4 py-3 text-left text-sm font-medium text-foreground transition hover:bg-muted"
              >
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" className="rounded-2xl px-4 py-3 text-left text-sm font-medium text-foreground transition hover:bg-muted">
                  Login
                </Link>
                <Link to="/signup" className="rounded-2xl px-4 py-3 text-left text-sm font-medium text-foreground transition hover:bg-muted">
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
};

export default Header;

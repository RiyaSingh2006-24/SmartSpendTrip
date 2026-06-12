import { Button } from "@/components/ui/button";
import { Bell, CalendarDays, CloudSun, Clock, IndianRupee, MapPin, Search, Sparkles, Star, Utensils } from "lucide-react";

const suggestions = ["Mysore Palace", "Kyoto temples", "Goa beaches", "New York food walk"];
const quickStats = [
  { label: "Weather", value: "28C", icon: CloudSun },
  { label: "Entry", value: "Rs 100", icon: IndianRupee },
  { label: "Rating", value: "4.7", icon: Star },
];
const trendCards = [
  {
    title: "Mysore Palace",
    meta: "Open 10 AM - 5:30 PM",
    image: "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Jaipur",
    meta: "3-day budget route",
    image: "https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?auto=format&fit=crop&w=900&q=80",
  },
];

const Hero = () => {
  const scrollToPlanner = () => {
    document.getElementById("trip-planner")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToStack = () => {
    document.getElementById("platform-stack")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="container mx-auto px-4 pb-10 pt-10 md:pb-16 md:pt-14">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.02fr),minmax(380px,0.98fr)] lg:gap-14">
        <div className="space-y-7">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered travel planning
          </span>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-5xl font-semibold sm:text-6xl lg:text-[4.5rem]">
              SmartSpend Trip AI
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Search any destination, compare live travel signals, and generate weather-aware itineraries, local food ideas, hidden gems, maps, and budget plans in one premium workspace.
            </p>
          </div>

          <div className="glass-card p-3">
            <div className="flex flex-col gap-3 rounded-[1.15rem] border border-border bg-background/85 p-2 shadow-inner md:flex-row md:items-center">
              <div className="flex min-h-14 flex-1 items-center gap-3 px-3">
                <Search className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Search destination</p>
                  <p className="text-[15px] font-semibold text-foreground">City, state, country, landmark, or attraction</p>
                </div>
              </div>
              <Button variant="hero" size="xl" onClick={scrollToPlanner} className="shrink-0">
                <Sparkles className="h-4 w-4" />
                Generate Plan
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 px-1">
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={scrollToPlanner}
                  className="rounded-full border border-border bg-card/80 px-3 py-2 text-sm font-medium text-muted-foreground transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <Button variant="hero-outline" size="xl" onClick={scrollToStack}>
              View Platform
            </Button>
            <a href="#ai-advisor" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl px-4 text-[15px] font-semibold text-primary transition hover:text-foreground">
              Ask AI Advisor
            </a>
          </div>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <div className="glass-card w-full max-w-[33rem] overflow-hidden">
            <div className="relative h-56 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80"
                alt="Travel destination architecture"
                className="h-full w-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/72 via-foreground/10 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-background">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-background/70">Live Destination Preview</p>
                <h3 className="mt-2 font-heading text-3xl font-semibold">Mysore Palace</h3>
              </div>
            </div>
            <div className="p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Search result</p>
                <h3 className="mt-2 font-heading text-2xl font-semibold">Images, timings, tickets, reviews</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <MapPin className="h-6 w-6" />
              </div>
            </div>
            <div className="mb-5 grid grid-cols-3 gap-3">
              {quickStats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl bg-background/80 p-4 text-center">
                  <Icon className="mx-auto h-4 w-4 text-primary" />
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
                  <p className="mt-1 font-heading text-xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {trendCards.map((card) => (
                <div key={card.title} className="overflow-hidden rounded-2xl border border-border bg-background/80">
                  <img src={card.image} alt={card.title} className="h-24 w-full object-cover" loading="lazy" />
                  <div className="p-3">
                    <p className="font-semibold">{card.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{card.meta}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {["7-day forecast", "Route planning", "Food discovery", "Saved trips"].map((tag) => (
                <span key={tag} className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                  {tag}
                </span>
              ))}
            </div>
            </div>
          </div>

          <div className="absolute -right-4 top-8 hidden max-w-[14rem] rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm lg:block">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-secondary" /> Opening hours and best visiting windows
            </span>
          </div>
          <div className="absolute -bottom-5 left-0 hidden max-w-[16rem] rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm lg:block">
            <span className="flex items-center gap-1.5">
              <Utensils className="h-3.5 w-3.5 text-gold" /> Local food, hidden gems, and price alerts
            </span>
          </div>
          <div className="absolute right-6 top-44 hidden rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm lg:block">
            <span className="flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-primary" /> Weather alert ready
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

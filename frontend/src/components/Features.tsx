import { useState } from "react";
import {
  ArrowRight,
  Brain,
  Check,
  CloudSun,
  Database,
  DollarSign,
  MapPin,
  MessageSquare,
  Navigation,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    id: "decision-engine",
    icon: Brain,
    eyebrow: "Ranking",
    title: "Decision Engine",
    kicker: "Turns messy destination data into a shortlist that feels explainable.",
    desc: "Scores places against budget fit, place quality, weather, and demand before itinerary generation starts, so the traveler sees why one destination beats another.",
    accent: "Best when the traveler knows the vibe they want, but not the smartest place yet.",
    signals: ["Budget fit", "Place quality", "Weather score", "Demand level"],
    outcomes: [
      "Ranks destinations before the user commits.",
      "Explains why a recommendation is a match.",
      "Cuts down early planning uncertainty.",
    ],
    steps: [
      { label: "Input Layer", value: "Budget, trip style, traveler count, and destination search." },
      { label: "Scoring Logic", value: "Weights cost, quality, weather, and demand into one confidence score." },
      { label: "Visible Result", value: "A ranked shortlist with reasoned recommendations." },
    ],
    statLabel: "Primary Win",
    statValue: "Smarter first choice",
    glowClass: "from-primary/22 via-primary/8 to-transparent",
    iconClass: "bg-primary/12 text-primary",
    badgeClass: "bg-primary/12 text-primary",
  },
  {
    id: "regional-intelligence",
    icon: MapPin,
    eyebrow: "Geography",
    title: "Regional Intelligence",
    kicker: "Understands broad searches and translates them into real local options.",
    desc: "Takes region-level searches like Rajasthan or Goa and expands them into city-level recommendations so travelers can start wide without losing precision.",
    accent: "Useful when users know the region they want, but not the exact city they should stay in.",
    signals: ["Region search", "Locality seeds", "Geo matching", "Map-ready coordinates"],
    outcomes: [
      "Converts broad intent into local choices.",
      "Prevents dead-end searches with vague destinations.",
      "Keeps discovery grounded in real geography.",
    ],
    steps: [
      { label: "Search Expansion", value: "Interprets region and locality intent from the user query." },
      { label: "Validation", value: "Checks likely cities and local areas against map and place signals." },
      { label: "Visible Result", value: "Shows ranked local matches instead of a vague regional answer." },
    ],
    statLabel: "Primary Win",
    statValue: "Broad search, precise output",
    glowClass: "from-accent/20 via-accent/8 to-transparent",
    iconClass: "bg-accent/12 text-accent",
    badgeClass: "bg-accent/12 text-accent",
  },
  {
    id: "budget-allocation",
    icon: DollarSign,
    eyebrow: "Spend Control",
    title: "Budget Allocation",
    kicker: "Makes the trip budget feel actionable instead of abstract.",
    desc: "Breaks spend across transport, stay, food, activities, and contingency so travelers can see how the plan works before they generate the itinerary.",
    accent: "This is the part that makes the product feel practical, not just inspirational.",
    signals: ["Trip days", "Travelers", "Currency", "Budget category"],
    outcomes: [
      "Clarifies where money is going.",
      "Creates a day-level spending anchor.",
      "Improves trust in itinerary suggestions.",
    ],
    steps: [
      { label: "Budget Intake", value: "Reads total budget, trip length, traveler count, and currency." },
      { label: "Allocation Logic", value: "Splits spend into realistic planning buckets." },
      { label: "Visible Result", value: "Shows a usable budget mix before itinerary generation." },
    ],
    statLabel: "Primary Win",
    statValue: "Budget clarity before booking",
    glowClass: "from-gold/22 via-primary/8 to-transparent",
    iconClass: "bg-primary/12 text-primary",
    badgeClass: "bg-primary/12 text-primary",
  },
  {
    id: "weather-signals",
    icon: CloudSun,
    eyebrow: "Live Data",
    title: "Weather Signals",
    kicker: "Adds real timing intelligence so recommendations feel season-aware.",
    desc: "Uses current and forecast context to improve destination ranking, travel timing, and recommendation quality instead of treating every place as equally suitable every day.",
    accent: "This is one of the quickest ways to make the assistant feel genuinely smart.",
    signals: ["Forecast", "Temperature", "Comfort score", "Timing risk"],
    outcomes: [
      "Avoids bad-fit recommendations during weak weather windows.",
      "Improves planning confidence for selected dates.",
      "Makes the advice feel more alive and current.",
    ],
    steps: [
      { label: "Forecast Pull", value: "Captures current conditions and near-term travel weather." },
      { label: "Context Merge", value: "Blends weather with budget and place quality signals." },
      { label: "Visible Result", value: "Reorders destinations and timing suggestions using live context." },
    ],
    statLabel: "Primary Win",
    statValue: "Season-aware recommendations",
    glowClass: "from-secondary/20 via-accent/10 to-transparent",
    iconClass: "bg-secondary/12 text-secondary",
    badgeClass: "bg-secondary/12 text-secondary",
  },
  {
    id: "nearby-finder",
    icon: Navigation,
    eyebrow: "Discovery",
    title: "Nearby Finder",
    kicker: "Keeps the product useful even after the itinerary has been generated.",
    desc: "Surfaces attractions and restaurants around the current location with budget-aware suggestions, so the planner remains helpful in the middle of the trip too.",
    accent: "This is the capability that makes the app feel alive in the real world, not just during planning.",
    signals: ["Current location", "Nearby venues", "Budget category", "Place quality"],
    outcomes: [
      "Supports spontaneous decisions during the trip.",
      "Extends value beyond pre-trip planning.",
      "Makes the planner feel location-aware and dynamic.",
    ],
    steps: [
      { label: "Location Capture", value: "Reads the traveler's live position from the browser." },
      { label: "Place Matching", value: "Finds nearby attractions and restaurants that fit the budget." },
      { label: "Visible Result", value: "Shows useful local options without losing trip context." },
    ],
    statLabel: "Primary Win",
    statValue: "Useful after itinerary generation",
    glowClass: "from-accent/18 via-secondary/10 to-transparent",
    iconClass: "bg-accent/12 text-accent",
    badgeClass: "bg-accent/12 text-accent",
  },
  {
    id: "trip-aware-chat",
    icon: MessageSquare,
    eyebrow: "Assistant",
    title: "Trip-Aware Chat",
    kicker: "Makes follow-up questions feel connected to the actual trip.",
    desc: "Answers with awareness of saved searches, itinerary context, destination details, and budget assumptions instead of acting like a blank generic chatbot.",
    accent: "This is where the product stops feeling like a toolset and starts feeling like one assistant.",
    signals: ["Search history", "Saved itinerary", "Budget context", "Destination memory"],
    outcomes: [
      "Carries context forward into follow-up questions.",
      "Prevents repeated user explanation.",
      "Makes the assistant feel personally useful.",
    ],
    steps: [
      { label: "Context Recall", value: "Loads saved search, trip, and traveler information." },
      { label: "Response Framing", value: "Answers using the active itinerary and destination memory." },
      { label: "Visible Result", value: "Conversational support that feels continuous, not reset each time." },
    ],
    statLabel: "Primary Win",
    statValue: "Continuity across the whole trip",
    glowClass: "from-primary/18 via-accent/10 to-transparent",
    iconClass: "bg-primary/12 text-primary",
    badgeClass: "bg-primary/12 text-primary",
  },
] as const;

const workflow = [
  {
    step: "01",
    title: "Evaluate",
    desc: "Compare live destination signals before building the itinerary.",
  },
  {
    step: "02",
    title: "Generate",
    desc: "Create a structured, budget-aware trip with visible allocations.",
  },
  {
    step: "03",
    title: "Continue",
    desc: "Keep nearby discovery and contextual chat connected after planning.",
  },
] as const;

const sectionStats = [
  {
    label: "Core Modules",
    value: "6",
    copy: "Connected across ranking, budgeting, discovery, and trip-aware support.",
  },
  {
    label: "Memory Layer",
    value: "SQL-backed",
    copy: "Saved trips and chats stay attached to the traveler's profile context.",
  },
  {
    label: "Interaction Mode",
    value: "Hover or tap",
    copy: "Preview each capability like a live product surface, not a static feature list.",
  },
] as const;

const Features = () => {
  const [activeFeatureId, setActiveFeatureId] = useState(features[0].id);
  const activeFeature =
    features.find((feature) => feature.id === activeFeatureId) || features[0];
  const ActiveIcon = activeFeature.icon;

  return (
    <section id="features" className="scroll-mt-28 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.12),transparent_68%)]" />
      <div className="pointer-events-none absolute inset-y-16 left-0 w-full bg-[radial-gradient(circle_at_left,hsl(var(--accent)/0.08),transparent_45%)]" />

      <div className="container relative mx-auto px-4 py-20 md:py-24">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,0.82fr),minmax(0,1.18fr)] xl:items-start">
          <div className="space-y-5">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Planning Capabilities
            </span>
            <h2 className="max-w-4xl font-heading text-4xl font-semibold tracking-[-0.06em] md:text-5xl">
              Capabilities that feel interactive, confident, and product-grade
            </h2>
            <p className="max-w-3xl text-lg text-muted-foreground">
              This section now behaves more like a live product walkthrough. Hover or tap a
              capability to inspect how it works, what signals it reads, and what it changes in
              the traveler experience.
            </p>

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              {sectionStats.map((stat) => (
                <div key={stat.label} className="rounded-[1.5rem] border border-border bg-card/80 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-2 font-heading text-3xl font-semibold">{stat.value}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{stat.copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card relative overflow-hidden p-6 sm:p-8">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--primary)/0.14),transparent_58%)]" />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Experience Flow
                  </p>
                  <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.05em]">
                    See why each capability matters before the traveler reaches the itinerary
                  </h3>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-background/85 px-4 py-2 text-sm font-medium shadow-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Interactive capability preview
                </span>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {workflow.map(({ step, title, desc }) => (
                  <div key={step} className="rounded-[1.5rem] border border-border bg-background/75 p-5 transition-transform duration-300 hover:-translate-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{step}</p>
                    <p className="mt-3 font-heading text-xl font-semibold">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 xl:grid-cols-[minmax(290px,0.78fr),minmax(0,1.22fr)]">
          <div className="space-y-3">
            {features.map((feature, index) => {
              const FeatureIcon = feature.icon;
              const active = feature.id === activeFeatureId;

              return (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => setActiveFeatureId(feature.id)}
                  onMouseEnter={() => setActiveFeatureId(feature.id)}
                  onFocus={() => setActiveFeatureId(feature.id)}
                  className={cn(
                    "group w-full rounded-[1.6rem] border p-5 text-left transition-all duration-300",
                    active
                      ? "border-foreground/15 bg-foreground text-background shadow-[0_24px_60px_-34px_hsl(var(--foreground)/0.55)]"
                      : "border-border bg-card/85 hover:-translate-y-1 hover:border-foreground/15 hover:shadow-[0_18px_40px_-32px_hsl(var(--foreground)/0.35)]",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-300",
                          active ? "bg-white/12 text-background" : feature.iconClass,
                        )}
                      >
                        <FeatureIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p
                          className={cn(
                            "text-xs font-semibold uppercase tracking-[0.18em]",
                            active ? "text-background/65" : "text-muted-foreground",
                          )}
                        >
                          {String(index + 1).padStart(2, "0")} {feature.eyebrow}
                        </p>
                        <p className="mt-2 font-heading text-2xl font-semibold">{feature.title}</p>
                      </div>
                    </div>
                    <ArrowRight
                      className={cn(
                        "mt-1 h-5 w-5 shrink-0 transition-transform duration-300",
                        active ? "translate-x-0 text-background" : "text-muted-foreground group-hover:translate-x-1",
                      )}
                    />
                  </div>

                  <p
                    className={cn(
                      "mt-4 max-w-xl text-sm leading-6",
                      active ? "text-background/78" : "text-muted-foreground",
                    )}
                  >
                    {feature.kicker}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {feature.signals.slice(0, 3).map((signal) => (
                      <span
                        key={signal}
                        className={cn(
                          "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                          active ? "bg-white/10 text-background/80" : feature.badgeClass,
                        )}
                      >
                        {signal}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="glass-card relative min-h-[36rem] overflow-hidden p-6 sm:p-8">
            <div className={cn("absolute inset-0 bg-[linear-gradient(135deg,var(--tw-gradient-stops))]", activeFeature.glowClass)} />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent" />

            <div className="relative flex h-full flex-col">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]", activeFeature.badgeClass)}>
                      Live Module Preview
                    </span>
                    <span className="rounded-full border border-border bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {activeFeature.eyebrow}
                    </span>
                  </div>
                  <h3 className="mt-5 max-w-3xl font-heading text-[2.4rem] font-semibold tracking-[-0.06em] sm:text-[3rem]">
                    {activeFeature.title}
                  </h3>
                  <p className="mt-3 max-w-3xl text-lg text-foreground/78">{activeFeature.kicker}</p>
                </div>

                <div className="rounded-[1.5rem] border border-border bg-background/85 p-4 shadow-sm">
                  <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", activeFeature.iconClass)}>
                    <ActiveIcon className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.08fr),minmax(300px,0.92fr)]">
                <div className="rounded-[1.75rem] border border-border bg-background/82 p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      What This Module Does
                    </p>
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <Database className="h-3.5 w-3.5" />
                      Product logic
                    </span>
                  </div>
                  <p className="mt-4 text-[15px] leading-7 text-muted-foreground">
                    {activeFeature.desc}
                  </p>

                  <div className="mt-6 space-y-3">
                    {activeFeature.steps.map((step, index) => (
                      <div key={step.label} className="rounded-[1.35rem] border border-border bg-card/90 p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            0{index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              {step.label}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-foreground/85">{step.value}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.75rem] bg-foreground p-5 text-background shadow-[0_24px_60px_-34px_hsl(var(--foreground)/0.6)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-background/60">
                      {activeFeature.statLabel}
                    </p>
                    <p className="mt-3 font-heading text-3xl font-semibold tracking-[-0.05em]">
                      {activeFeature.statValue}
                    </p>
                    <p className="mt-4 text-sm leading-6 text-background/72">{activeFeature.accent}</p>
                  </div>

                  <div className="rounded-[1.75rem] border border-border bg-background/82 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Signals In Play
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {activeFeature.signals.map((signal) => (
                        <span
                          key={signal}
                          className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground"
                        >
                          {signal}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-border bg-background/82 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      What It Unlocks
                    </p>
                    <div className="mt-4 space-y-3">
                      {activeFeature.outcomes.map((item) => (
                        <div key={item} className="flex items-start gap-3 rounded-2xl bg-card px-4 py-3">
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/12 text-secondary">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                          <p className="text-sm leading-6 text-foreground/85">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;

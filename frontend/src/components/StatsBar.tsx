import { ArrowUpRight, CloudSun, DatabaseZap, Map, MessageSquare, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const stack = [
  {
    icon: Map,
    label: "Destination Discovery",
    value: "Local Discovery",
    desc: "Place quality, popularity, and regional signals help the planner surface destinations worth considering first.",
    detail: "Find better places",
    cardClassName: "xl:col-span-2 bg-gradient-to-br from-primary/15 via-card to-card",
    iconClassName: "bg-primary/12 text-primary",
    detailClassName: "bg-primary/10 text-primary",
    numberClassName: "text-primary/70",
  },
  {
    icon: CloudSun,
    label: "Weather Guidance",
    value: "Live Weather Intelligence",
    desc: "Current weather context helps the planner avoid weak-fit destinations during the selected travel dates.",
    detail: "Plan for the right season",
    cardClassName: "xl:col-span-2 bg-gradient-to-br from-accent/10 via-card to-card",
    iconClassName: "bg-accent/10 text-accent",
    detailClassName: "bg-accent/10 text-accent",
    numberClassName: "text-accent/70",
  },
  {
    icon: DatabaseZap,
    label: "Trip Memory",
    value: "Saved Trip History",
    desc: "Trips, itineraries, and assistant context stay saved, so travelers can come back without losing their progress.",
    detail: "Pick up where you left off",
    cardClassName: "xl:col-span-2 bg-gradient-to-br from-secondary/12 via-card to-card",
    iconClassName: "bg-secondary/12 text-secondary",
    detailClassName: "bg-secondary/10 text-secondary",
    numberClassName: "text-secondary/70",
  },
  {
    icon: Wallet,
    label: "Budget Planning",
    value: "Flexible Budget Modes",
    desc: "Recommendations shift with the travel budget across stay, transport, food, and activity choices.",
    detail: "Low, mid, or premium trips",
    cardClassName: "xl:col-span-3 bg-gradient-to-br from-gold/15 via-card to-card",
    iconClassName: "bg-gold/12 text-gold",
    detailClassName: "bg-gold/12 text-gold",
    numberClassName: "text-gold/80",
  },
  {
    icon: MessageSquare,
    label: "Assistant Layer",
    value: "Trip-aware Assistant",
    desc: "Follow-up answers stay grounded in the saved trip context instead of resetting to generic chatbot replies.",
    detail: "Ask smarter follow-up questions",
    cardClassName: "xl:col-span-3 border-foreground/5 bg-foreground text-background",
    iconClassName: "bg-background/10 text-background",
    detailClassName: "bg-background/10 text-background/90",
    numberClassName: "text-background/55",
  },
];

const StatsBar = () => (
  <section id="platform-stack" className="scroll-mt-28 relative overflow-hidden border-y border-border/80">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_36%),radial-gradient(circle_at_bottom_right,hsl(var(--accent)/0.1),transparent_30%)]" />
    <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-card/70 to-transparent" />

    <div className="container relative mx-auto px-4 py-16 md:py-20">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr),360px]">
        <div className="rounded-[2rem] border border-border bg-card/90 p-8 shadow-[0_22px_60px_-38px_hsl(var(--foreground)/0.24)] md:p-10">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Platform Stack
          </span>
          <h2 className="mt-6 max-w-4xl font-heading text-4xl font-semibold tracking-[-0.06em] md:text-5xl">
            A travel-planning platform that feels structured, connected, and trustworthy
          </h2>
          <p className="mt-5 max-w-3xl text-lg text-muted-foreground">
            SmartSpend Trip AI combines live discovery data, forecast context, trip memory, budget logic, and contextual chat into one product flow instead of disconnected widgets.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              {
                title: "Live Signals",
                desc: "Places and weather improve destination fit before planning starts.",
              },
              {
                title: "Saved Progress",
                desc: "Trips and conversations stay connected to the traveler.",
              },
              {
                title: "Budget Guidance",
                desc: "Spend level shapes recommendations from start to finish.",
              },
            ].map(({ title, desc }) => (
              <div key={title} className="rounded-[1.4rem] border border-border bg-background/75 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
                <p className="mt-2 text-sm leading-6 text-foreground/80">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-foreground/5 bg-foreground p-6 text-background shadow-[0_24px_65px_-42px_hsl(var(--foreground)/0.55)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-background/60">Operational Overview</p>

          <div className="mt-6 space-y-3">
            {[
              {
                value: "5",
                label: "connected product layers",
              },
              {
                value: "3",
                label: "decision inputs before itinerary generation",
              },
              {
                value: "1",
                label: "shared trip memory across planner and chat",
              },
            ].map(({ value, label }) => (
              <div key={label} className="rounded-[1.5rem] border border-background/10 bg-background/5 px-5 py-4">
                <p className="font-heading text-4xl font-semibold text-background">{value}</p>
                <p className="mt-1 text-sm leading-6 text-background/72">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.6rem] bg-background/8 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-background/55">Why it matters</p>
            <p className="mt-3 text-sm leading-7 text-background/78">
              Every step, from ranking destinations to nearby recommendations and follow-up chat, stays grounded in the same trip context.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-6">
        {stack.map(({ icon: Icon, label, value, desc, detail, cardClassName, iconClassName, detailClassName, numberClassName }, index) => {
          const inverted = cardClassName.includes("bg-foreground");

          return (
            <div
              key={label}
              className={cn(
                "group rounded-[1.8rem] border p-6 shadow-[0_20px_55px_-38px_hsl(var(--foreground)/0.22)] transition-all duration-300 hover:-translate-y-1.5",
                inverted ? "hover:border-background/10" : "border-border hover:border-primary/20",
                cardClassName,
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", iconClassName)}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn("text-[11px] font-semibold uppercase tracking-[0.24em]", numberClassName)}>
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <p className={cn("mt-8 text-xs font-semibold uppercase tracking-[0.16em]", inverted ? "text-background/58" : "text-muted-foreground")}>
                {label}
              </p>
              <h3 className="mt-2 font-heading text-[2rem] font-semibold tracking-[-0.05em]">{value}</h3>
              <p className={cn("mt-4 text-[15px] leading-7", inverted ? "text-background/78" : "text-muted-foreground")}>{desc}</p>

              <div className="mt-6 flex items-center justify-between gap-4 border-t pt-4">
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
                    detailClassName,
                  )}
                >
                  {detail}
                </span>
                <ArrowUpRight className={cn("h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5", inverted ? "text-background/55" : "text-muted-foreground")} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default StatsBar;

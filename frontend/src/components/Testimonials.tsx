import { Quote, Star } from "lucide-react";

const reviews = [
  {
    title: "Sample Review 01",
    quote: "The destination ranking felt practical because it balanced weather, budget, and nearby options before building the itinerary.",
    tag: "Budget-focused planning",
  },
  {
    title: "Sample Review 02",
    quote: "I liked that the planner remembered the trip context, so follow-up questions felt connected instead of starting over each time.",
    tag: "Persistent trip memory",
  },
  {
    title: "Sample Review 03",
    quote: "The layout makes the product feel much more complete, especially with nearby suggestions and clear budget modes in one flow.",
    tag: "Product-style experience",
  },
];

const Testimonials = () => (
  <section id="reviews" className="scroll-mt-28 relative overflow-hidden border-t border-border/80">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.08),transparent_42%)]" />

    <div className="container relative mx-auto px-4 py-20 md:py-24">
      <div className="mb-10 grid gap-6 xl:grid-cols-[minmax(0,1fr),320px] xl:items-end">
        <div className="space-y-4">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Sample Reviews
          </span>
          <h2 className="max-w-4xl font-heading text-4xl font-semibold tracking-[-0.06em] md:text-5xl">
            A clean testimonial section you can replace with real customer feedback later
          </h2>
          <p className="max-w-3xl text-lg text-muted-foreground">
            These quotes are placeholders for presentation and layout, so the landing page feels complete without pretending they are verified public reviews.
          </p>
        </div>

        <div className="rounded-[1.8rem] border border-border bg-card/85 p-6 shadow-[0_18px_50px_-36px_hsl(var(--foreground)/0.22)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Presentation Note</p>
          <p className="mt-3 text-sm leading-7 text-foreground/80">
            When you launch publicly, replace these with real user feedback, ratings, or case-study quotes.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {reviews.map(({ title, quote, tag }) => (
          <div key={title} className="glass-card relative overflow-hidden p-7 hover-lift">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/80 via-primary/20 to-transparent" />
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Quote className="h-5 w-5 text-primary" />
              </div>
              <div className="flex items-center gap-1 text-gold">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-current" />
                ))}
              </div>
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
            <p className="mt-4 text-[16px] leading-8 text-foreground/88">"{quote}"</p>
            <div className="mt-6 border-t border-border pt-4">
              <span className="inline-flex rounded-full bg-muted px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {tag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;

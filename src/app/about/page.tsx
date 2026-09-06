"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PRODUCTS } from "@/lib/product-data";
import BuzzingBees from "../../components/about/buzzing-bees";

/**
 * Reveal
 * A single, restrained entrance primitive used across the page.
 * - "load": animates immediately on mount (used for the hero's one
 *   orchestrated load sequence).
 * - "view": animates once when the element first enters the viewport,
 *   via IntersectionObserver under the hood (no scroll listeners, no
 *   layout reads on scroll, no document-height manipulation).
 * Only opacity/transform are animated. Fully inert when the visitor
 * prefers reduced motion — layout stays static, nothing moves.
 */
function Reveal({
  children,
  className,
  delay = 0,
  y = 16,
  mode = "view",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  mode?: "load" | "view";
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const hidden = { opacity: 0, y };
  const shown = { opacity: 1, y: 0 };

  return (
    <motion.div
      className={className}
      initial={hidden}
      animate={mode === "load" ? shown : undefined}
      whileInView={mode === "view" ? shown : undefined}
      viewport={mode === "view" ? { once: true, margin: "-80px" } : undefined}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function HiveGraphic() {
  return (
    <svg viewBox="0 0 520 520" role="img" aria-label="Abstract StickHive honeycomb graphic" className="h-full w-full">
      <defs>
        <linearGradient id="hive-fill" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ffd43b" />
          <stop offset="1" stopColor="#ff8a00" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="#111111" strokeWidth="2">
        <path d="M260 62 326 100v76l-66 38-66-38v-76l66-38Z" fill="url(#hive-fill)" />
        <path d="m194 214 66 38v76l-66 38-66-38v-76l66-38Z" fill="#b8f2d0" />
        <path d="m326 214 66 38v76l-66 38-66-38v-76l66-38Z" fill="#fff8ed" />
        <path d="m260 366 66 38v76l-66 38-66-38v-76l66-38Z" fill="#ffd43b" />
        <path d="m128 366 66 38v76l-66 38-66-38v-76l66-38Z" fill="#fff8ed" />
        <path d="m392 366 66 38v76l-66 38-66-38v-76l66-38Z" fill="#b8f2d0" />
      </g>
      <g transform="translate(212 112)">
        <ellipse cx="48" cy="42" rx="30" ry="21" fill="#111111" />
        <ellipse cx="48" cy="42" rx="18" ry="13" fill="#ffd43b" />
        <ellipse cx="25" cy="22" rx="20" ry="13" fill="#fff" opacity="0.7" />
        <ellipse cx="71" cy="22" rx="20" ry="13" fill="#fff" opacity="0.7" />
        <circle cx="38" cy="39" r="3" fill="#fff" />
        <circle cx="58" cy="39" r="3" fill="#fff" />
        <path d="M39 51c6 5 12 5 18 0" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/**
 * Single source of truth for the "Where we came from" diagram: the SVG
 * circles and their HTML labels both read from this array, in the same
 * 0–560 coordinate space as the viewBox, so they can never drift apart
 * or overlap the way two independently-hand-positioned layers can.
 * "align" controls which side of the anchor point the label text grows
 * from, so a long label near an edge never gets clipped or collides
 * with its neighbor.
 */
const ORIGIN_STOPS = [
  { cx: 70, cy: 420, fill: "#ffd43b", label: "Classroom", align: "left" as const, side: "below" as const },
  { cx: 250, cy: 185, fill: "#b8f2d0", label: "Experiment", align: "center" as const, side: "above" as const },
  { cx: 490, cy: 115, fill: "#ff8a00", label: "StickHive", align: "right" as const, side: "above" as const },
];

/**
 * OriginPath
 * The "Where we came from" diagram. The connecting line draws itself
 * on and the three stops fade in with a small stagger the first time
 * the diagram scrolls into view — this is the one storytelling motion
 * beat for the section, not a scroll-scrubbed animation. pathLength
 * and opacity/scale are the only properties touched, so there is no
 * layout cost.
 */
function OriginPath() {
  const shouldReduceMotion = useReducedMotion();
  const stops = ORIGIN_STOPS;

  if (shouldReduceMotion) {
    return (
      <svg viewBox="0 0 560 560" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path
          d="M70 420C145 330 135 210 250 185C360 160 350 85 490 115"
          fill="none"
          stroke="#111"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="8 10"
          opacity="0.22"
        />
        {stops.map((s) => (
          <circle key={s.cx} cx={s.cx} cy={s.cy} r="14" fill={s.fill} stroke="#111" strokeWidth="2" />
        ))}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 560 560" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <motion.path
        d="M70 420C145 330 135 210 250 185C360 160 350 85 490 115"
        fill="none"
        stroke="#111"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="8 10"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 0.22 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
      />
      {stops.map((s, i) => (
        <motion.circle
          key={s.cx}
          cx={s.cx}
          cy={s.cy}
          r="14"
          fill={s.fill}
          stroke="#111"
          strokeWidth="2"
          style={{ transformOrigin: `${s.cx}px ${s.cy}px` }}
          initial={{ opacity: 0, scale: 0.6 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45, delay: 0.3 + i * 0.18 }}
        />
      ))}
    </svg>
  );
}

const kicker = "font-serif italic text-honey-orange text-lg md:text-xl";

const products = [
  {
    tag: "Collections",
    accent: "bg-hive-yellow",
    title: "Curated sticker collections",
    text: "Original drops spanning anime, gaming, nature, technology, food, sports, aesthetics and more.",
    href: "/shop",
  },
  {
    tag: "Vinyl",
    accent: "bg-[#b8f2d0]",
    title: "Premium vinyl stickers",
    text: "Small-format pieces designed to bring colour, humour and personality to everyday surfaces.",
    href: "/shop",
  },
  {
    tag: "Custom",
    accent: "bg-honey-orange",
    title: "Custom stickers",
    text: "A way to turn your own idea, identity or artwork into something tangible and distinctly yours.",
    href: "/custom-sticker",
  },
];

const values = [
  ["Craft", "Details matter. From the artwork to the final peel, we want the little things to feel considered."],
  ["Personality", "We are not trying to make everyone like the same thing. The Hive should make room for different tastes."],
  ["Curiosity", "We are students and builders. We learn by making, testing, listening and trying again."],
];

export default function AboutPage() {
  return (
    <main className="w-full max-w-full overflow-x-hidden bg-cream text-foreground">
      <section className="relative min-h-[88vh] overflow-hidden px-6 pb-24 pt-36 md:px-10 md:pt-44 lg:px-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_32%,rgba(255,212,59,0.22),transparent_26%),radial-gradient(circle_at_12%_75%,rgba(184,242,208,0.25),transparent_25%)]" />

        <div className="relative mx-auto grid max-w-[1400px] items-center gap-14 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="relative z-10">
            <Reveal mode="load" y={10}>
              <div className="mb-8 flex items-center gap-3 text-sm font-semibold text-black/55">
                <Link href="/" aria-label="Home" className="inline-flex items-center gap-2 transition-colors hover:text-foreground">
                  <Home size={16} />
                  Home
                </Link>
                <span className="text-black/25">/</span>
                <span>About StickHive</span>
              </div>
            </Reveal>

            <Reveal mode="load" delay={0.08} y={18}>
              <h1 className="max-w-6xl text-[clamp(3.5rem,7.2vw,7.4rem)] font-bold leading-[0.9] tracking-[-0.075em]">
                We are building a brand around <span className="font-serif italic text-honey-orange">personality.</span>
              </h1>
            </Reveal>

            <Reveal mode="load" delay={0.18} y={16}>
              <p className="mt-9 max-w-2xl text-xl leading-8 text-black/60 md:text-2xl">
                StickHive began as a classroom idea and became something we decided was worth taking seriously: a place where stickers turn interests, humour, fandoms and little pieces of identity into something you can actually hold.
              </p>
            </Reveal>

            <Reveal mode="load" delay={0.28} y={14}>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-bold text-white transition-colors duration-300 hover:bg-honey-orange"
                >
                  See what we make
                  <ArrowRight size={17} className="transition-transform duration-300 motion-safe:group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/custom-sticker"
                  className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-6 py-3.5 text-sm font-bold text-foreground transition-colors duration-300 hover:border-black/30 hover:bg-black/[0.02]"
                >
                  Make yours
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal mode="load" delay={0.22} y={24} className="relative mx-auto aspect-square w-full max-w-[560px]">
            <div className="absolute inset-[7%] rounded-[3rem] border border-black/10 bg-white/50 shadow-[0_30px_90px_rgba(17,17,17,0.1)] backdrop-blur-sm" />
            <div className="absolute inset-[14%] rounded-[2.5rem] bg-[#123F3A] p-7 text-white sm:p-8 md:p-10">
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex shrink-0 items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 sm:text-xs">
                  <span>StickHive</span>
                  <span>Est. from an idea</span>
                </div>
                <div className="flex min-h-0 flex-1 items-center justify-center py-4 sm:py-5">
                  <div className="h-full max-h-[300px] w-full max-w-[300px]">
                    <HiveGraphic />
                  </div>
                </div>
                <p className="shrink-0 max-w-xs text-sm leading-6 text-white/55">
                  A hive is made from many small pieces. So is a brand. So is personality.
                </p>
              </div>
            </div>
            <div className="absolute -right-1 top-[13%] rounded-full border border-black/10 bg-hive-yellow px-4 py-2 text-xs font-black uppercase tracking-[0.14em] shadow-lg">
              Made to stick
            </div>
          </Reveal>
        </div>
      </section>

      <section
        className="relative isolate overflow-hidden border-y border-black/10 bg-white px-6 py-24 md:px-10 md:py-32 lg:px-14"
        style={{ overflowAnchor: "none" }}
      >
        <BuzzingBees count={3} variant="light" />

        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <svg className="absolute -left-20 top-10 h-56 w-56 text-[#123F3A]/[0.06]" viewBox="0 0 200 200" fill="none">
            <path d="M100 16 154 47v62l-54 31-54-31V47l54-31Z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M46 109 100 140l54-31M100 16v62" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <svg className="absolute -right-24 bottom-4 h-64 w-64 text-honey-orange/[0.07]" viewBox="0 0 220 220" fill="none">
            <path d="M110 20 167 53v66l-57 33-57-33V53l57-33Z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M53 119 110 152l57-33M110 20v82" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-[1400px]">
          <div className="grid gap-14 lg:grid-cols-[0.42fr_0.58fr] lg:gap-20">
            <Reveal className="self-start lg:pt-2">
              <div className="text-xs">
                <p className="select-text font-black uppercase tracking-[0.22em] text-black selection:bg-hive-yellow selection:text-foreground">
                  WHAT WE BELIEVE
                </p>
              </div>
              <h2 className="mt-6 max-w-md text-5xl font-bold leading-[0.96] tracking-[-0.06em] md:text-6xl lg:text-7xl">
                One small thing can say a lot about you.
              </h2>
              <p className="mt-6 max-w-sm text-base leading-7 text-black/50 md:text-lg">
                The things we choose to wear, carry and stick around us can say more than a paragraph ever could.
              </p>
            </Reveal>
            <div className="space-y-14 md:space-y-16">
              <div>
                <p className={kicker}>Mission</p>
                <p className="mt-5 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.035em] md:text-5xl">
                  To make self-expression more tangible, more playful and more personal — one thoughtfully made sticker at a time.
                </p>
              </div>
              <div className="border-t border-black/10 pt-16">
                <p className={kicker}>Vision</p>
                <p className="mt-5 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.035em] md:text-5xl">
                  To build a creative brand people return to when they want something that feels unmistakably theirs.
                </p>
              </div>
              <div className="border-t border-black/10 pt-16">
                <p className={kicker}>Promise</p>
                <p className="mt-5 max-w-3xl text-2xl leading-9 text-black/60 md:text-3xl md:leading-10">
                  We will put our heart, craft and relentless attention into the things we make. We are learning while we build, but we will never use that as an excuse to stop chasing excellence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-6 py-28 md:px-10 md:py-40 lg:px-14">
        <div className="mx-auto grid max-w-[1400px] items-center gap-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="relative min-w-0 aspect-square w-full max-w-[560px]">
            <OriginPath />
            {ORIGIN_STOPS.map((stop, i) => {
              const left = `${(stop.cx / 560) * 100}%`;
              const top = `${(stop.cy / 560) * 100}%`;
              const translateX = stop.align === "left" ? "0%" : stop.align === "right" ? "-100%" : "-50%";
              const translateY = stop.side === "below" ? "34px" : "calc(-100% - 34px)";

              return (
                <div
                  key={stop.label}
                  className="absolute"
                  style={{ left, top, transform: `translate(${translateX}, ${translateY})` }}
                >
                  <Reveal delay={0.75 + i * 0.15} y={6}>
                    <span className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                      {stop.label}
                    </span>
                  </Reveal>
                </div>
              );
            })}
          </div>

          <Reveal className="min-w-0">
            <p className={kicker}>Where we came from</p>
            <h2 className="mt-5 max-w-3xl text-5xl font-bold leading-[0.94] tracking-[-0.06em] md:text-7xl">
              A classroom exercise became a commitment.
            </h2>
            <div className="mt-9 max-w-2xl space-y-6 text-lg leading-8 text-black/60 md:text-xl">
              <p>
                StickHive did not begin with a polished business plan. It began with students throwing ideas onto a table, questioning them, refining them and eventually landing on something simple: stickers are tiny, but they can carry a surprising amount of identity.
              </p>
              <p>
                That idea stayed with us. We started thinking about the kinds of designs we would actually want to buy, the people we wanted to make them for and what it would mean to build a brand that felt genuinely ours.
              </p>
              <p>
                Now the goal is bigger than a classroom submission. We want to learn the craft of building a real consumer brand — from design and production to technology, customer experience and the details nobody sees.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-6 py-28 md:px-10 md:py-40 lg:px-14">
        <div className="mx-auto max-w-[1400px]">
          <div className="max-w-3xl">
            <p className={kicker}>What we sell</p>
            <h2 className="mt-5 text-5xl font-bold leading-[0.94] tracking-[-0.06em] md:text-7xl">Small objects. A lot of character.</h2>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-black/55 md:text-xl">
              Our catalogue is built around the things people naturally collect and personalise — with room for original artwork, themed drops and designs made by the people in the Hive.
            </p>
          </div>

          <div className="mt-16 grid grid-flow-dense gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <Link
                key={product.title}
                href={product.href}
                className={`group relative overflow-hidden rounded-[2rem] border border-black/10 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-honey-orange/30 hover:shadow-[0_20px_45px_rgba(17,17,17,0.08)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                  index === 0 ? "md:col-span-2 lg:col-span-2" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-8">
                  <div>
                    <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-black/35">
                      <span className={`size-1.5 rounded-full ${product.accent}`} aria-hidden="true" />
                      {product.tag}
                    </span>
                    <h3 className="mt-12 max-w-lg text-3xl font-bold leading-[1] tracking-[-0.045em] md:text-4xl">{product.title}</h3>
                  </div>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-black/10 transition-colors duration-300 group-hover:bg-hive-yellow">
                    <ArrowRight size={17} className="transition-transform duration-300 motion-safe:group-hover:translate-x-0.5" />
                  </span>
                </div>
                <p className="mt-6 max-w-xl text-base leading-7 text-black/55">{product.text}</p>
                <div className="mt-12 h-2 w-full overflow-hidden rounded-full bg-black/5">
                  <div className="h-full w-1/3 rounded-full bg-hive-yellow transition-[width] duration-500 group-hover:w-full" />
                </div>
              </Link>
            ))}
          </div>

          <p className="mt-7 text-sm text-black/40">
            The current catalogue includes themed collections across anime, Marvel, DC, gaming, nature, cute, aesthetic, memes, movies, technology and sports, alongside custom work.
          </p>
        </div>
      </section>

      <section className="border-t border-black/10 bg-white px-6 py-28 md:px-10 md:py-40 lg:px-14">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-16 lg:grid-cols-[0.55fr_1.45fr]">
            <div>
              <p className={kicker}>The standard we want to keep</p>
              <h2 className="mt-5 max-w-md text-5xl font-bold leading-[0.94] tracking-[-0.06em] md:text-6xl">Our soul is in the details.</h2>
            </div>
            <div className="grid gap-10 md:grid-cols-3">
              {values.map(([title, text]) => (
                <div key={title} className="border-t-2 border-foreground pt-5">
                  <h3 className="text-2xl font-bold tracking-[-0.03em]">{title}</h3>
                  <p className="mt-4 text-base leading-7 text-black/55">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-32 pt-24 md:px-10 md:pb-44 md:pt-32 lg:px-14">
        <Reveal y={20} className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[3rem] bg-hive-yellow px-7 py-14 md:px-14 md:py-20">
          <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full border-[55px] border-black/[0.05]" />
          <div className="relative max-w-4xl">
            <p className="font-serif italic text-lg text-[#123F3A]/70 md:text-xl">Get in touch</p>
            <h2 className="mt-5 text-5xl font-bold leading-[0.92] tracking-[-0.065em] md:text-7xl">
              Have an idea, a question or something you want to make stick?
            </h2>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-black/60 md:text-xl">
              Come talk to us. We are building StickHive one conversation, one experiment and one very good sticker at a time.
            </p>
            <Link
              href="/contact"
              className="group mt-9 inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-4 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#123F3A] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              Get in touch
              <ArrowRight size={17} className="transition-transform duration-300 motion-safe:group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </section>

      <div className="sr-only">StickHive currently has {PRODUCTS.length} catalogue entries.</div>
    </main>
  );
}
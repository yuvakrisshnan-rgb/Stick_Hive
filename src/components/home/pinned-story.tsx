"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const moments = [
  {
    title: "Designed for self-expression",
    body: "From fandoms and inside jokes to clean brand marks, every sticker starts with a reason to exist.",
    accent: "Personality",
  },
  {
    title: "Made to live everywhere",
    body: "Laptop, bottle, notebook or packaging — the goal is simple: make ordinary surfaces feel like yours.",
    accent: "Everyday objects",
  },
  {
    title: "A real brand, built while learning",
    body: "StickHive started as a classroom idea and is becoming a real student-built business through constant making and iteration.",
    accent: "Built in public",
  },
];

export default function PinnedStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  useGSAP(() => {
    if (reduceMotion) return;

    const cards = gsap.utils.toArray<HTMLElement>("[data-story-card]");

    cards.forEach((card, index) => {
      gsap.fromTo(
        card,
        { y: 90, opacity: 0.25, scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top 82%",
            end: "top 42%",
            scrub: true,
          },
        },
      );

      if (index < cards.length - 1) {
        gsap.to(card, {
          scale: 0.94,
          opacity: 0.35,
          scrollTrigger: {
            trigger: cards[index + 1],
            start: "top 55%",
            end: "top 25%",
            scrub: true,
          },
        });
      }
    });

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top+=48",
      end: "bottom bottom-=48",
      pin: "[data-story-copy]",
      pinSpacing: false,
    });
  }, { scope: sectionRef, dependencies: [reduceMotion] });

  return (
    <section ref={sectionRef} className="relative overflow-hidden px-5 py-32 sm:px-8 md:py-48 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
        <div data-story-copy className="self-start lg:max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-black/40">Why StickHive</p>
          <h2 className="mt-5 text-5xl font-bold leading-[0.98] tracking-[-0.055em] md:text-6xl">
            Tiny objects can carry a lot of meaning.
          </h2>
          <p className="mt-6 text-base leading-7 text-black/55">
            We are building StickHive around that idea: creativity should be easy to wear, share and keep close.
          </p>
        </div>

        <div className="space-y-6">
          {moments.map((moment, index) => (
            <article
              key={moment.title}
              data-story-card
              className="group sticky top-20 min-h-[58vh] overflow-hidden rounded-[2.5rem] border border-black/10 bg-white p-7 shadow-[0_25px_80px_rgba(17,17,17,0.08)] sm:p-10 md:min-h-[64vh]"
            >
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-start justify-between gap-6">
                  <span className="text-sm font-semibold text-black/35">0{index + 1}</span>
                  <span className="rounded-full bg-cream px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-black/50">
                    {moment.accent}
                  </span>
                </div>
                <div className="max-w-2xl">
                  <h3 className="text-4xl font-bold leading-tight tracking-[-0.045em] md:text-6xl">{moment.title}</h3>
                  <p className="mt-6 max-w-xl text-lg leading-8 text-black/55">{moment.body}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

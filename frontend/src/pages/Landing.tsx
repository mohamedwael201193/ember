import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { MagneticButton } from "@/components/MagneticButton";
import { SmoothScroll } from "@/components/SmoothScroll";
import {
  SvgArchitecture,
  SvgFail,
  SvgOrbitSignal,
  SvgProofChain,
  SvgRescueFlow,
} from "@/components/svg/SvgScene";

gsap.registerPlugin(ScrollTrigger);

/**
 * design_plan
 * RNG seed = len("EMBER FRONTEND REDESIGN...") % 4 → 2
 * Hero: Editorial Split (light copy / dark orbit)
 * Arsenal: SVG story scenes, pinned rescue scrub, architecture explore
 * GSAP: pin+scrub pipeline, stroke-draw chapters
 * Fonts: Syne + DM Sans (locked)
 * AIDA: Nav → Hero → Fail → Rescue pin → Proof → Architecture → CTA
 * H1 max-w-xl / clamp 2 lines · no stamps · no meta labels
 */

export function Landing() {
  const root = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !root.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".hero-reveal", {
        y: 40,
        opacity: 0,
        filter: "blur(10px)",
        duration: 0.85,
        stagger: 0.09,
        ease: "power3.out",
      });

      // Chapter word scrub
      gsap.utils.toArray<HTMLElement>(".story-pin").forEach((section) => {
        const words = section.querySelectorAll(".word");
        gsap.set(words, { opacity: 0.12 });
        gsap.to(words, {
          opacity: 1,
          stagger: 0.04,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=80%",
            pin: true,
            scrub: 0.6,
          },
        });
      });

      // Rescue pipeline pin
      const pipe = root.current!.querySelector(".rescue-pin");
      if (pipe) {
        const cards = pipe.querySelectorAll(".rescue-step");
        gsap.from(cards, {
          y: 80,
          opacity: 0.15,
          stagger: 0.12,
          ease: "none",
          scrollTrigger: {
            trigger: pipe,
            start: "top top",
            end: "+=140%",
            pin: true,
            scrub: 0.8,
          },
        });
      }

      gsap.from(".arch-panel", {
        scrollTrigger: {
          trigger: ".arch-section",
          start: "top 70%",
        },
        y: 32,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: "power3.out",
      });
    }, root);

    return () => ctx.revert();
  }, [reduce]);

  const failWords =
    "When an AI agent dies mid-mission, payroll freezes and trust collapses.".split(
      " "
    );
  const wakeWords =
    "EMBER wakes. Observer sees the miss. Sentinel restores the stream.".split(
      " "
    );

  return (
    <SmoothScroll>
      <main ref={root} className="overflow-x-hidden w-full max-w-full bg-[#09090b] text-[#fafafa]">
        <div className="grain" aria-hidden />

        <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between px-5 md:px-10">
          <Link to="/" className="font-display text-lg font-bold tracking-tight">
            EMBER
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-[#a1a1aa] md:flex">
            <a href="#story" className="hover:text-white">
              Story
            </a>
            <a href="#rescue" className="hover:text-white">
              Rescue
            </a>
            <a href="#architecture" className="hover:text-white">
              System
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/app/mission/new"
              className="hidden h-9 items-center rounded-[4px] border border-white/15 px-3 text-xs font-medium sm:inline-flex"
            >
              Build mission
            </Link>
            <MagneticButton href="/app" className="text-xs uppercase tracking-wide">
              Open console
            </MagneticButton>
          </div>
        </header>

        {/* ATTENTION — editorial split */}
        <section className="grid min-h-[100dvh] grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col justify-end bg-[#f4f4f5] px-6 pb-16 pt-24 text-[#18181b] md:px-12 lg:pb-24">
            <p className="hero-reveal mb-4 text-xs font-medium uppercase tracking-[0.22em] text-[#52525b]">
              Continuity for AI payroll
            </p>
            <h1 className="hero-reveal font-display max-w-xl text-[clamp(2.6rem,5.2vw,4.5rem)] font-extrabold leading-[0.96] tracking-[-0.04em] text-balance">
              When the agent dies, the mission lives.
            </h1>
            <p className="hero-reveal mt-6 max-w-md text-base leading-relaxed text-[#52525b]">
              EMBER detects the miss, replays the payment, and seals proof on Base.
            </p>
            <div className="hero-reveal mt-8 flex flex-wrap gap-3">
              <Link
                to="/app"
                className="inline-flex h-11 items-center gap-2 rounded-[4px] bg-[#18181b] px-5 text-sm font-medium text-white"
              >
                See it live
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#story"
                className="inline-flex h-11 items-center rounded-[4px] border border-[#18181b]/20 px-5 text-sm font-medium"
              >
                Watch the story
              </a>
            </div>
          </div>
          <div className="relative flex min-h-[48dvh] items-center justify-center bg-[#09090b] px-8 lg:min-h-[100dvh]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(255,92,26,0.18),transparent_55%)]" />
            <SvgOrbitSignal className="relative z-10 max-w-md" />
          </div>
        </section>

        {/* INTEREST — failure story */}
        <section id="story" className="story-pin flex min-h-[100dvh] flex-col justify-center px-6 py-24 md:px-12">
          <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                {failWords.map((w, i) => (
                  <span key={`f-${i}`} className="word mr-[0.3em] inline-block">
                    {w}
                  </span>
                ))}
              </h2>
            </div>
            <SvgFail />
          </div>
        </section>

        <section className="story-pin flex min-h-[100dvh] flex-col justify-center bg-[#111113] px-6 py-24 md:px-12">
          <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
            <SvgRescueFlow />
            <div>
              <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                {wakeWords.map((w, i) => (
                  <span key={`${w}-${i}`} className="word mr-[0.3em] inline-block">
                    {w}
                  </span>
                ))}
              </h2>
            </div>
          </div>
        </section>

        {/* DESIRE — rescue pipeline pin */}
        <section id="rescue" className="rescue-pin flex min-h-[100dvh] flex-col justify-center px-6 py-20 md:px-12">
          <div className="mx-auto w-full max-w-5xl">
            <h2 className="font-display max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
              From miss to sealed proof.
            </h2>
            <p className="mt-4 max-w-lg text-[#a1a1aa]">
              One pipeline. Five beats. Nothing left to hope.
            </p>
            <div className="mt-12 grid gap-3 md:grid-cols-5">
              {[
                "Observer detects unpaid slots from receipts",
                "Sentinel locks the rescue journal",
                "Replay restores employee payments",
                "Proof hashed and pinned to IPFS",
                "Anchor settles the truth on Base",
              ].map((line, i) => (
                <div
                  key={line}
                  className="rescue-step rounded-[4px] border border-white/10 bg-[#111113] p-5"
                >
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[#ff5c1a]">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#d4d4d8]">{line}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Proof visualization */}
        <section className="px-6 py-28 md:px-12 md:py-36">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                Proof you can open.
              </h2>
              <p className="mt-4 max-w-md text-[#a1a1aa]">
                Hash, CID, and chain anchor must agree. Continuity is visible, not claimed.
              </p>
            </div>
            <SvgProofChain />
          </div>
        </section>

        {/* Architecture explore */}
        <section
          id="architecture"
          className="arch-section border-t border-white/10 bg-[#0c0c0e] px-6 py-28 md:px-12 md:py-36"
        >
          <div className="mx-auto max-w-6xl">
            <h2 className="arch-panel font-display max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
              The system as a living map.
            </h2>
            <p className="arch-panel mt-4 max-w-xl text-[#a1a1aa]">
              Mission at the center. PAYDAY streams. Observer watches. Sentinel recovers. Proof closes the loop.
            </p>
            <div className="arch-panel mt-14">
              <SvgArchitecture />
            </div>
            <div className="arch-panel mt-10 grid gap-3 md:grid-cols-3">
              {[
                { t: "PAYDAY", d: "Primary stream pays on a fixed cadence." },
                { t: "Sentinel", d: "Guardian that replays only what receipts prove missed." },
                { t: "Mainnet", d: "Base chain records the sealed proof." },
              ].map((c) => (
                <div key={c.t} className="rounded-[4px] border border-white/10 p-6">
                  <h3 className="font-display text-xl font-bold">{c.t}</h3>
                  <p className="mt-2 text-sm text-[#a1a1aa]">{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ACTION */}
        <section className="px-6 py-24 md:px-12 md:py-32">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[4px] border border-white/10 bg-[#111113] px-8 py-16 md:px-16">
            <div className="pointer-events-none absolute -right-16 top-0 h-64 w-64 rounded-full bg-[#ff5c1a]/20 blur-3xl" />
            <h2 className="font-display max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
              Build a mission in minutes.
            </h2>
            <p className="mt-4 max-w-md text-[#a1a1aa]">
              Guided wallet, payroll, and recovery. No blockchain homework.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <MagneticButton href="/app/mission/new">
                Start mission builder
                <ArrowRight className="h-4 w-4" />
              </MagneticButton>
              <MagneticButton href="/app" variant="ghost">
                Open live console
              </MagneticButton>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-white/10 px-6 py-10 text-sm text-[#a1a1aa] md:flex-row md:items-center md:justify-between md:px-12">
          <span className="font-display font-bold text-white">EMBER</span>
          <span>Autonomous continuity for mission payroll.</span>
        </footer>
      </main>
    </SmoothScroll>
  );
}

import { useEffect, useId, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Draw stroke paths on scroll into view */
  drawOnScroll?: boolean;
  viewBox?: string;
  title: string;
};

/** Shared wrapper: stroke-draw + soft glow for original EMBER SVGs */
export function SvgScene({
  children,
  className,
  drawOnScroll = true,
  viewBox = "0 0 480 320",
  title,
}: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const reduce = useReducedMotion();
  const uid = useId();

  useEffect(() => {
    if (reduce || !ref.current || !drawOnScroll) return;
    const svg = ref.current;
    const paths = svg.querySelectorAll<SVGGeometryElement>(
      "path[data-draw], circle[data-draw], line[data-draw], polyline[data-draw]"
    );

    const ctx = gsap.context(() => {
      paths.forEach((el) => {
        let len = 240;
        try {
          if ("getTotalLength" in el) len = el.getTotalLength();
        } catch {
          /* ignore */
        }
        gsap.set(el, {
          strokeDasharray: len,
          strokeDashoffset: len,
          opacity: 1,
        });
        gsap.to(el, {
          strokeDashoffset: 0,
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: {
            trigger: svg,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        });
      });

      gsap.to(svg.querySelectorAll("[data-pulse]"), {
        opacity: 0.35,
        duration: 1.2,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        stagger: 0.15,
      });
    }, svg);

    return () => ctx.revert();
  }, [reduce, drawOnScroll]);

  return (
    <svg
      ref={ref}
      viewBox={viewBox}
      className={cn("h-auto w-full overflow-visible", className)}
      role="img"
      aria-labelledby={uid}
    >
      <title id={uid}>{title}</title>
      <defs>
        <linearGradient id={`${uid}-ember`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff5c1a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ff8a4c" stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff5c1a" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ff5c1a" stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}-soft`}>
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g
        style={{
          ["--g-ember" as string]: `url(#${uid}-ember)`,
          ["--g-glow" as string]: `url(#${uid}-glow)`,
          ["--f-soft" as string]: `url(#${uid}-soft)`,
        }}
      >
        {children}
      </g>
    </svg>
  );
}

export function SvgFail({ className }: { className?: string }) {
  return (
    <SvgScene title="AI agent fails and the mission freezes" className={className}>
      <rect x="24" y="40" width="432" height="240" rx="8" fill="#111113" stroke="rgba(255,255,255,0.08)" />
      {/* agent body */}
      <circle cx="160" cy="140" r="36" fill="none" stroke="#ef4444" strokeWidth="2" data-draw />
      <path
        d="M140 140 L180 140 M160 120 L160 160"
        stroke="#ef4444"
        strokeWidth="2"
        strokeLinecap="round"
        data-draw
      />
      {/* frozen streams */}
      {[0, 1, 2, 3].map((i) => (
        <path
          key={i}
          d={`M220 ${90 + i * 28} H400`}
          stroke="rgba(250,250,250,0.15)"
          strokeWidth="3"
          strokeDasharray="8 10"
          data-draw
        />
      ))}
      <circle cx="400" cy="160" r="22" fill="var(--g-glow)" data-pulse />
      <text x="40" y="260" fill="#a1a1aa" fontSize="12" fontFamily="JetBrains Mono, monospace">
        AGENT DOWN · STREAM FROZEN
      </text>
    </SvgScene>
  );
}

export function SvgRescueFlow({ className }: { className?: string }) {
  const steps = [
    { x: 50, label: "Observe" },
    { x: 140, label: "Sentinel" },
    { x: 230, label: "Replay" },
    { x: 320, label: "Proof" },
    { x: 410, label: "Anchor" },
  ];
  return (
    <SvgScene title="EMBER rescue pipeline from observe to anchor" className={className}>
      <path
        d="M50 160 C120 80, 200 240, 260 140 S360 80, 430 160"
        fill="none"
        stroke="var(--g-ember)"
        strokeWidth="2.5"
        data-draw
        filter="var(--f-soft)"
      />
      {steps.map((s, i) => (
        <g key={s.label}>
          <circle
            cx={s.x}
            cy={160}
            r={14}
            fill="#09090b"
            stroke="#ff5c1a"
            strokeWidth="2"
            data-draw
          />
          <circle cx={s.x} cy={160} r={4} fill="#ff5c1a" data-pulse />
          <text
            x={s.x}
            y={210}
            textAnchor="middle"
            fill="#a1a1aa"
            fontSize="11"
            fontFamily="DM Sans, sans-serif"
          >
            {s.label}
          </text>
          {i < steps.length - 1 && (
            <path
              d={`M${s.x + 18} 160 H${steps[i + 1].x - 18}`}
              stroke="rgba(255,92,26,0.35)"
              strokeWidth="1"
              data-draw
            />
          )}
        </g>
      ))}
    </SvgScene>
  );
}

export function SvgProofChain({ className }: { className?: string }) {
  return (
    <SvgScene title="Proof chain from hash to IPFS to on-chain anchor" className={className}>
      {/* hash block */}
      <rect x="40" y="90" width="100" height="120" rx="6" fill="#111113" stroke="#ff5c1a" strokeWidth="1.5" data-draw />
      <path d="M55 120 H125 M55 145 H110 M55 170 H120" stroke="rgba(255,255,255,0.25)" strokeWidth="2" data-draw />
      <text x="90" y="240" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="DM Sans, sans-serif">
        Hash
      </text>
      {/* flow */}
      <path d="M150 150 H200" stroke="#ff5c1a" strokeWidth="2" data-draw />
      {/* IPFS hex */}
      <path
        d="M250 90 L310 120 L310 180 L250 210 L190 180 L190 120 Z"
        fill="none"
        stroke="#60a5fa"
        strokeWidth="1.5"
        data-draw
      />
      <circle cx="250" cy="150" r="8" fill="#60a5fa" data-pulse />
      <text x="250" y="240" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="DM Sans, sans-serif">
        IPFS
      </text>
      <path d="M320 150 H360" stroke="#ff5c1a" strokeWidth="2" data-draw />
      {/* chain */}
      <rect x="360" y="100" width="80" height="100" rx="6" fill="#111113" stroke="rgba(255,255,255,0.2)" data-draw />
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={372}
          y={118 + i * 24}
          width="56"
          height="16"
          rx="2"
          fill="none"
          stroke="#ff5c1a"
          strokeWidth="1"
          data-draw
        />
      ))}
      <text x="400" y="240" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="DM Sans, sans-serif">
        Anchor
      </text>
    </SvgScene>
  );
}

export function SvgArchitecture({ className }: { className?: string }) {
  const nodes = [
    { x: 240, y: 60, label: "Mission" },
    { x: 90, y: 160, label: "PAYDAY" },
    { x: 240, y: 160, label: "Observer" },
    { x: 390, y: 160, label: "Sentinel" },
    { x: 140, y: 260, label: "Replay" },
    { x: 340, y: 260, label: "Proof" },
  ];
  return (
    <SvgScene title="EMBER mission architecture topology" className={className} viewBox="0 0 480 320">
      <circle cx="240" cy="160" r="110" fill="none" stroke="rgba(255,92,26,0.12)" strokeWidth="1" data-draw />
      <circle cx="240" cy="160" r="70" fill="var(--g-glow)" data-pulse />
      {nodes.map((n, i) => (
        <g key={n.label}>
          {i > 0 && (
            <line
              x1={nodes[0].x}
              y1={nodes[0].y}
              x2={n.x}
              y2={n.y}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
              data-draw
            />
          )}
          <circle cx={n.x} cy={n.y} r={22} fill="#111113" stroke="#ff5c1a" strokeWidth="1.5" data-draw />
          <text
            x={n.x}
            y={n.y + 4}
            textAnchor="middle"
            fill="#fafafa"
            fontSize="9"
            fontFamily="JetBrains Mono, monospace"
          >
            {n.label}
          </text>
        </g>
      ))}
    </SvgScene>
  );
}

export function SvgOrbitSignal({ className }: { className?: string }) {
  return (
    <SvgScene title="Orbital continuity signal" className={className} viewBox="0 0 400 400">
      <circle cx="200" cy="200" r="160" fill="none" stroke="rgba(255,92,26,0.15)" strokeWidth="1" data-draw />
      <circle cx="200" cy="200" r="110" fill="none" stroke="rgba(255,92,26,0.25)" strokeWidth="1" strokeDasharray="4 8" data-draw />
      <circle cx="200" cy="200" r="60" fill="none" stroke="#ff5c1a" strokeWidth="1.5" data-draw />
      <circle cx="200" cy="200" r="16" fill="#ff5c1a" data-pulse />
      <circle cx="200" cy="40" r="5" fill="#fafafa" data-pulse />
      <circle cx="360" cy="200" r="5" fill="#60a5fa" data-pulse />
      <circle cx="200" cy="360" r="5" fill="#fafafa" data-pulse />
      <circle cx="40" cy="200" r="5" fill="#60a5fa" data-pulse />
      <path
        d="M200 40 A160 160 0 0 1 360 200"
        fill="none"
        stroke="var(--g-ember)"
        strokeWidth="2"
        data-draw
        filter="var(--f-soft)"
      />
    </SvgScene>
  );
}

export function SvgWalletNet({ className }: { className?: string }) {
  return (
    <SvgScene title="Wallet network Org A Org B Employee Escrow" className={className}>
      {[
        { x: 80, y: 100, label: "Org A" },
        { x: 400, y: 100, label: "Org B" },
        { x: 240, y: 80, label: "Escrow" },
        { x: 240, y: 240, label: "Employee" },
      ].map((n) => (
        <g key={n.label}>
          <rect
            x={n.x - 40}
            y={n.y - 24}
            width="80"
            height="48"
            rx="4"
            fill="#111113"
            stroke="rgba(255,255,255,0.15)"
            data-draw
          />
          <text
            x={n.x}
            y={n.y + 4}
            textAnchor="middle"
            fill="#fafafa"
            fontSize="11"
            fontFamily="DM Sans, sans-serif"
          >
            {n.label}
          </text>
        </g>
      ))}
      <path d="M120 100 H200" stroke="#ff5c1a" strokeWidth="1.5" data-draw />
      <path d="M280 100 H360" stroke="#60a5fa" strokeWidth="1.5" data-draw />
      <path d="M240 104 V216" stroke="#ff5c1a" strokeWidth="1.5" data-draw />
      <path d="M120 120 Q180 200 200 230" stroke="rgba(255,92,26,0.5)" strokeWidth="1" data-draw />
      <path d="M360 120 Q300 200 280 230" stroke="rgba(96,165,250,0.5)" strokeWidth="1" data-draw />
    </SvgScene>
  );
}

export function SvgHealthRadar({ className }: { className?: string }) {
  return (
    <SvgScene title="Mission health radar" className={className} viewBox="0 0 320 320">
      {[40, 80, 120].map((r) => (
        <circle
          key={r}
          cx="160"
          cy="160"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          data-draw
        />
      ))}
      <path
        d="M160 160 L160 40 A120 120 0 0 1 260 120 Z"
        fill="rgba(255,92,26,0.2)"
        stroke="#ff5c1a"
        strokeWidth="1"
        data-draw
      />
      <line x1="160" y1="40" x2="160" y2="280" stroke="rgba(255,255,255,0.1)" data-draw />
      <line x1="40" y1="160" x2="280" y2="160" stroke="rgba(255,255,255,0.1)" data-draw />
      <circle cx="160" cy="160" r="4" fill="#ff5c1a" data-pulse />
    </SvgScene>
  );
}

export function SvgObserver({ className }: { className?: string }) {
  return (
    <SvgScene title="Observer watches mission signals" className={className}>
      <circle cx="240" cy="150" r="70" fill="none" stroke="rgba(96,165,250,0.35)" strokeWidth="1.5" data-draw />
      <circle cx="240" cy="150" r="40" fill="none" stroke="#60a5fa" strokeWidth="1.5" data-draw />
      <circle cx="240" cy="150" r="12" fill="#60a5fa" data-pulse />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = (deg * Math.PI) / 180;
        const x = 240 + Math.cos(r) * 100;
        const y = 150 + Math.sin(r) * 100;
        return (
          <line
            key={deg}
            x1="240"
            y1="150"
            x2={x}
            y2={y}
            stroke="rgba(96,165,250,0.25)"
            strokeWidth="1"
            data-draw
          />
        );
      })}
      <text x="240" y="270" textAnchor="middle" fill="#a1a1aa" fontSize="12" fontFamily="DM Sans, sans-serif">
        Observer
      </text>
    </SvgScene>
  );
}

export function SvgSentinel({ className }: { className?: string }) {
  return (
    <SvgScene title="Sentinel shield guarding continuity" className={className}>
      <path
        d="M240 60 L320 100 V180 C320 230 280 270 240 290 C200 270 160 230 160 180 V100 Z"
        fill="rgba(255,92,26,0.08)"
        stroke="#ff5c1a"
        strokeWidth="2"
        data-draw
        filter="var(--f-soft)"
      />
      <path d="M210 160 L230 180 L275 130" fill="none" stroke="#ff5c1a" strokeWidth="3" strokeLinecap="round" data-draw />
      <circle cx="240" cy="150" r="4" fill="#ff5c1a" data-pulse />
      <text x="240" y="300" textAnchor="middle" fill="#a1a1aa" fontSize="12" fontFamily="DM Sans, sans-serif">
        Sentinel
      </text>
    </SvgScene>
  );
}

export function SvgPayrollStream({ className }: { className?: string }) {
  return (
    <SvgScene title="Payroll stream from Org A to employee" className={className}>
      <rect x="40" y="120" width="90" height="56" rx="4" fill="#111113" stroke="rgba(255,255,255,0.15)" data-draw />
      <text x="85" y="153" textAnchor="middle" fill="#fafafa" fontSize="12" fontFamily="DM Sans, sans-serif">
        Org A
      </text>
      <path
        d="M140 148 C200 80, 280 220, 340 148"
        fill="none"
        stroke="var(--g-ember)"
        strokeWidth="3"
        data-draw
        filter="var(--f-soft)"
      />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={170 + i * 55} cy={140 + (i % 2) * 20} r="5" fill="#ff5c1a" data-pulse />
      ))}
      <rect x="350" y="120" width="90" height="56" rx="4" fill="#111113" stroke="#ff5c1a" data-draw />
      <text x="395" y="153" textAnchor="middle" fill="#fafafa" fontSize="11" fontFamily="DM Sans, sans-serif">
        Employee
      </text>
      <text x="240" y="250" textAnchor="middle" fill="#a1a1aa" fontSize="12" fontFamily="JetBrains Mono, monospace">
        PAYDAY STREAM
      </text>
    </SvgScene>
  );
}

export function SvgEscrow({ className }: { className?: string }) {
  return (
    <SvgScene title="Escrow vault holding mission funds" className={className}>
      <rect x="160" y="80" width="160" height="160" rx="8" fill="#111113" stroke="#ff5c1a" strokeWidth="1.5" data-draw />
      <path d="M180 120 H300 M180 150 H280 M180 180 H290" stroke="rgba(255,255,255,0.2)" strokeWidth="2" data-draw />
      <circle cx="240" cy="220" r="10" fill="#ff5c1a" data-pulse />
      <path d="M200 70 H280 V95 H200 Z" fill="none" stroke="rgba(255,255,255,0.25)" data-draw />
      <text x="240" y="280" textAnchor="middle" fill="#a1a1aa" fontSize="12" fontFamily="DM Sans, sans-serif">
        Escrow
      </text>
    </SvgScene>
  );
}

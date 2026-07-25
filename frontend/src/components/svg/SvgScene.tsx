import { useEffect, useId, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

/** Shared palette so every diagram reads as one family. */
const C = {
  panel: "#121215",
  panelDeep: "#0c0c0f",
  line: "rgba(255,255,255,0.10)",
  lineSoft: "rgba(255,255,255,0.055)",
  text: "#fafafa",
  muted: "#a1a1aa",
  dim: "#71717a",
  ember: "#ff5c1a",
  emberSoft: "rgba(255,92,26,0.16)",
  blue: "#60a5fa",
  green: "#22c55e",
  red: "#ef4444",
};

const F = {
  body: "DM Sans, system-ui, sans-serif",
  mono: "JetBrains Mono, ui-monospace, monospace",
  display: "Syne, system-ui, sans-serif",
};

/* ------------------------------------------------------------------ */
/* Scene wrapper: defs + declarative animation engine                  */
/* ------------------------------------------------------------------ */

type SceneProps = {
  /** Render prop receives the instance id so gradient/filter refs stay unique. */
  children: (uid: string) => React.ReactNode;
  className?: string;
  drawOnScroll?: boolean;
  viewBox?: string;
  title: string;
};

export function SvgScene({
  children,
  className,
  drawOnScroll = true,
  viewBox = "0 0 560 320",
  title,
}: SceneProps) {
  const ref = useRef<SVGSVGElement>(null);
  const reduce = useReducedMotion();
  const raw = useId();
  const uid = raw.replace(/[^a-zA-Z0-9-]/g, "");

  useEffect(() => {
    const svg = ref.current;
    if (!svg || reduce) return;

    const num = (el: Element, attr: string, fallback: number) => {
      const v = el.getAttribute(attr);
      const n = v === null ? NaN : Number(v);
      return Number.isFinite(n) ? n : fallback;
    };

    const ctx = gsap.context(() => {
      /* stroke draw-on ------------------------------------------------ */
      if (drawOnScroll) {
        const drawEls = Array.from(
          svg.querySelectorAll<SVGGeometryElement>("[data-draw]")
        );
        drawEls.forEach((el, i) => {
          let len = 0;
          if (el.tagName === "rect") {
            len =
              2 *
              (num(el, "width", 80) + num(el, "height", 40));
          } else {
            try {
              len = el.getTotalLength();
            } catch {
              len = 0;
            }
          }
          if (!len || !Number.isFinite(len)) len = 280;
          gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
          gsap.to(el, {
            strokeDashoffset: 0,
            duration: 1.05,
            delay: Math.min(i * 0.03, 0.9),
            ease: "power2.out",
            scrollTrigger: { trigger: svg, start: "top bottom", once: true },
          });
        });
      }

      /* soft fade-in for label groups -------------------------------- */
      const fadeEls = svg.querySelectorAll("[data-fade]");
      if (fadeEls.length) {
        gsap.from(fadeEls, {
          opacity: 0,
          y: 10,
          duration: 0.65,
          stagger: 0.05,
          ease: "power2.out",
          scrollTrigger: { trigger: svg, start: "top bottom", once: true },
        });
      }

      /* flowing energy along wires ----------------------------------- */
      svg.querySelectorAll<SVGGeometryElement>("[data-flow]").forEach((el) => {
        const dash = el.getAttribute("data-flow") || "6 12";
        const parts = dash.split(/\s+/).map(Number);
        const period = (parts[0] || 6) + (parts[1] ?? parts[0] ?? 12);
        gsap.set(el, { strokeDasharray: dash });
        gsap.fromTo(
          el,
          { strokeDashoffset: 0 },
          {
            strokeDashoffset: -period * 2,
            duration: num(el, "data-flow-dur", 1.4),
            ease: "none",
            repeat: -1,
          }
        );
      });

      /* orbit / spin -------------------------------------------------- */
      svg.querySelectorAll<SVGElement>("[data-orbit]").forEach((el) => {
        gsap.to(el, {
          rotation: num(el, "data-orbit-dir", 1) < 0 ? -360 : 360,
          duration: num(el, "data-orbit", 12),
          repeat: -1,
          ease: "none",
          svgOrigin: `${num(el, "data-orbit-x", 280)} ${num(el, "data-orbit-y", 160)}`,
        });
      });

      /* travellers riding a named path -------------------------------- */
      svg.querySelectorAll<SVGElement>("[data-travel]").forEach((el) => {
        const name = el.getAttribute("data-travel");
        const path = svg.querySelector<SVGPathElement>(`[data-path="${name}"]`);
        if (!path) return;
        const dur = num(el, "data-travel-dur", 5);
        const offset = num(el, "data-travel-at", 0);
        const fade = el.hasAttribute("data-travel-fade");
        // Travellers ship as opacity 0 so they stay hidden when motion is off.
        gsap.set(el, { opacity: 1 });
        const tl = gsap.timeline({ repeat: -1 });
        tl.to(
          el,
          {
            motionPath: { path, align: path, alignOrigin: [0.5, 0.5] },
            duration: dur,
            ease: "none",
          },
          0
        );
        if (fade) {
          tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: dur * 0.18, ease: "none" }, 0)
            .to(el, { opacity: 0, duration: dur * 0.22, ease: "none" }, dur * 0.78);
        }
        if (offset) tl.progress(offset % 1);
      });

      /* ambient life -------------------------------------------------- */
      const pulse = svg.querySelectorAll("[data-pulse]");
      if (pulse.length) {
        gsap.to(pulse, {
          opacity: 0.3,
          duration: 1.25,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          stagger: 0.14,
        });
      }

      svg.querySelectorAll<SVGElement>("[data-blip]").forEach((el, i) => {
        gsap.fromTo(
          el,
          { scale: 0.65, opacity: 0.9, transformOrigin: "50% 50%" },
          {
            scale: 2.1,
            opacity: 0,
            duration: 2.2,
            delay: i * 0.55,
            repeat: -1,
            ease: "power2.out",
          }
        );
      });

      const float = svg.querySelectorAll("[data-float]");
      if (float.length) {
        gsap.to(float, {
          y: -6,
          duration: 2.4,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          stagger: 0.2,
        });
      }

      /* sequential station highlight ---------------------------------- */
      const seq = Array.from(svg.querySelectorAll<SVGElement>("[data-seq]")).sort(
        (a, b) => num(a, "data-seq", 0) - num(b, "data-seq", 0)
      );
      if (seq.length) {
        gsap.set(seq, { opacity: 0.28 });
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.9 });
        seq.forEach((el, i) => {
          tl.to(el, { opacity: 1, duration: 0.3, ease: "power2.out" }, i * 0.55)
            .to(el, { opacity: 0.28, duration: 0.45, ease: "power1.in" }, i * 0.55 + 0.62);
        });
      }
    }, svg);

    return () => ctx.revert();
  }, [reduce, drawOnScroll]);

  return (
    <svg
      ref={ref}
      viewBox={viewBox}
      className={cn("h-auto w-full overflow-visible", className)}
      role="img"
      aria-labelledby={`${uid}-t`}
    >
      <title id={`${uid}-t`}>{title}</title>
      <defs>
        <linearGradient id={`${uid}-ember`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffb184" />
          <stop offset="45%" stopColor="#ff5c1a" />
          <stop offset="100%" stopColor="rgba(255,92,26,0.15)" />
        </linearGradient>
        <linearGradient id={`${uid}-emberH`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,92,26,0.25)" />
          <stop offset="50%" stopColor="#ff5c1a" />
          <stop offset="100%" stopColor="rgba(255,161,106,0.9)" />
        </linearGradient>
        <linearGradient id={`${uid}-comet`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff5c1a" stopOpacity="0" />
          <stop offset="60%" stopColor="#ff5c1a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffd0b0" stopOpacity="1" />
        </linearGradient>
        <linearGradient id={`${uid}-blue`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(96,165,250,0.2)" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
        <linearGradient id={`${uid}-green`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(34,197,94,0.25)" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff5c1a" stopOpacity="0.42" />
          <stop offset="55%" stopColor="#ff5c1a" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ff5c1a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-glowBlue`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
        </radialGradient>
        <pattern
          id={`${uid}-grid`}
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M24 0H0V24"
            fill="none"
            stroke="rgba(255,255,255,0.045)"
            strokeWidth="1"
          />
        </pattern>
        <filter id={`${uid}-soft`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${uid}-bloom`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <marker
          id={`${uid}-arrow`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M0 1 L9 5 L0 9 z" fill="#ff5c1a" />
        </marker>
        <marker
          id={`${uid}-arrowDim`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M0 1 L9 5 L0 9 z" fill="rgba(255,255,255,0.35)" />
        </marker>
      </defs>
      {children(uid)}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

type LabelProps = {
  x: number;
  y: number;
  children: React.ReactNode;
  size?: number;
  fill?: string;
  font?: string;
  anchor?: "start" | "middle" | "end";
  track?: string;
  weight?: number;
  opacity?: number;
};

function Label({
  x,
  y,
  children,
  size = 11,
  fill = C.muted,
  font = F.body,
  anchor = "middle",
  track,
  weight,
  opacity,
}: LabelProps) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fill={fill}
      fontSize={size}
      fontFamily={font}
      letterSpacing={track}
      fontWeight={weight}
      opacity={opacity}
    >
      {children}
    </text>
  );
}

type CardProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
  accent?: string;
  titleSize?: number;
  titleColor?: string;
  fill?: string;
};

function Card({
  x,
  y,
  w,
  h,
  title,
  sub,
  accent = C.line,
  titleSize = 12,
  titleColor = C.text,
  fill = C.panel,
}: CardProps) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={10}
        fill={fill}
        stroke={accent}
        strokeWidth={1.2}
        data-draw
      />
      <g data-fade>
        <Label
          x={cx}
          y={sub ? cy - 1 : cy + 4}
          size={titleSize}
          fill={titleColor}
          weight={600}
          track="0.06em"
        >
          {title}
        </Label>
        {sub && (
          <Label x={cx} y={cy + 14} size={8.5} fill={C.dim} font={F.mono} track="0.14em">
            {sub}
          </Label>
        )}
      </g>
    </g>
  );
}

/** Faint blueprint grid + vignette behind technical diagrams. */
function Grid({ uid, w, h }: { uid: string; w: number; h: number }) {
  return (
    <g aria-hidden>
      <rect width={w} height={h} fill={`url(#${uid}-grid)`} opacity={0.6} />
      <rect
        width={w}
        height={h}
        fill={`url(#${uid}-glow)`}
        opacity={0.35}
        style={{ mixBlendMode: "screen" }}
      />
    </g>
  );
}

/** Small mono caption used as a diagram slug line. */
function Slug({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <g data-fade>
      <rect x={x} y={y - 11} width={4} height={14} rx={2} fill={C.ember} />
      <Label x={x + 12} y={y} anchor="start" size={9} font={F.mono} track="0.24em" fill={C.dim}>
        {children}
      </Label>
    </g>
  );
}

const pol = (cx: number, cy: number, r: number, deg: number) => ({
  x: cx + r * Math.cos((deg * Math.PI) / 180),
  y: cy + r * Math.sin((deg * Math.PI) / 180),
});

const arc = (cx: number, cy: number, r: number, a1: number, a2: number) => {
  const s = pol(cx, cy, r, a1);
  const e = pol(cx, cy, r, a2);
  const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
  return `M${s.x.toFixed(2)} ${s.y.toFixed(2)} A${r} ${r} 0 ${large} ${
    a2 > a1 ? 1 : 0
  } ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
};

const wedge = (cx: number, cy: number, r: number, a1: number, a2: number) =>
  `${arc(cx, cy, r, a1, a2)} L${cx} ${cy} Z`;

/* ------------------------------------------------------------------ */
/* HERO — the whole idea in one glance                                 */
/* ------------------------------------------------------------------ */

export function SvgHeroLoop({ className }: { className?: string }) {
  const cx = 280;
  const cy = 280;
  const R = 142;

  const stations = [
    { deg: -90, n: "01", t: "PAY", s: "payroll runs", px: 280, py: 64, tone: C.ember },
    { deg: 0, n: "02", t: "MISS", s: "receipt shows gap", px: 504, py: 280, tone: C.red },
    { deg: 90, n: "03", t: "RESTORE", s: "standby org pays", px: 280, py: 496, tone: C.ember },
    { deg: 180, n: "04", t: "PROOF", s: "sealed on base", px: 56, py: 280, tone: C.green },
  ];

  const stars = [
    [64, 96],
    [488, 118],
    [82, 452],
    [498, 438],
    [36, 196],
    [524, 356],
  ];

  return (
    <SvgScene
      title="EMBER continuity loop: payroll runs, a miss is detected, a standby org restores it, and proof is sealed on Base"
      viewBox="0 0 560 560"
      className={className}
    >
      {(uid) => (
        <g>
          {/* ambience */}
          <circle cx={cx} cy={cy} r={232} fill={`url(#${uid}-glow)`} opacity={0.6} />
          {stars.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} fill="#fafafa" opacity={0.5} data-pulse />
          ))}

          {/* dials */}
          <circle
            cx={cx}
            cy={cy}
            r={214}
            fill="none"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth={5}
            strokeDasharray="1 15"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r={192} fill="none" stroke={C.lineSoft} strokeWidth={1} />
          <circle
            cx={cx}
            cy={cy}
            r={176}
            fill="none"
            stroke="rgba(255,92,26,0.10)"
            strokeWidth={1}
            strokeDasharray="3 9"
          />

          {/* the loop */}
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.emberSoft} strokeWidth={1.5} />
          <path
            data-path="ring"
            d={`M${cx} ${cy - R} A${R} ${R} 0 1 1 ${cx} ${cy + R} A${R} ${R} 0 1 1 ${cx} ${cy - R}`}
            fill="none"
            stroke="none"
          />

          {/* rotating comet sweep */}
          <g data-orbit="11" data-orbit-x={cx} data-orbit-y={cy}>
            <path
              d={arc(cx, cy, R, -140, -20)}
              fill="none"
              stroke={`url(#${uid}-comet)`}
              strokeWidth={3}
              strokeLinecap="round"
              filter={`url(#${uid}-bloom)`}
            />
          </g>

          {/* the break, and the healed leg */}
          <path
            d={arc(cx, cy, R, -52, -18)}
            fill="none"
            stroke={C.red}
            strokeWidth={3}
            strokeDasharray="5 6"
            strokeLinecap="round"
            data-pulse
          />
          <path
            d={arc(cx, cy, R, 100, 170)}
            fill="none"
            stroke="rgba(34,197,94,0.5)"
            strokeWidth={2.5}
            strokeLinecap="round"
            data-draw
          />

          {/* spokes */}
          {stations.map((s) => {
            const p = pol(cx, cy, R - 24, s.deg);
            return (
              <line
                key={`sp-${s.n}`}
                x1={cx}
                y1={cy}
                x2={p.x}
                y2={p.y}
                stroke={C.lineSoft}
                strokeWidth={1}
                data-draw
              />
            );
          })}

          {/* value riding the loop */}
          <circle r={3.5} opacity={0} fill={C.ember} data-travel="ring" data-travel-dur="7" data-travel-at="0.35" />
          <circle r={2.5} opacity={0} fill="#ffd0b0" data-travel="ring" data-travel-dur="7" data-travel-at="0.72" />
          <g opacity={0} data-travel="ring" data-travel-dur="7">
            <rect x={-13} y={-9} width={26} height={18} rx={9} fill="#191920" stroke={C.ember} strokeWidth={1} />
            <text
              x={0}
              y={4}
              textAnchor="middle"
              fill="#ffb184"
              fontSize={9}
              fontFamily={F.mono}
            >
              USDC
            </text>
          </g>

          {/* stations */}
          {stations.map((s) => {
            const p = pol(cx, cy, R, s.deg);
            return (
              <g key={s.n}>
                <circle cx={p.x} cy={p.y} r={26} fill={C.panelDeep} />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={18}
                  fill="none"
                  stroke={s.tone}
                  strokeWidth={1.6}
                  data-draw
                />
                <circle cx={p.x} cy={p.y} r={18} fill="none" stroke={s.tone} strokeWidth={1} data-blip />
                <circle cx={p.x} cy={p.y} r={5} fill={s.tone} data-pulse />
                <g data-fade>
                  <rect
                    x={s.px - 52}
                    y={s.py - 17}
                    width={104}
                    height={34}
                    rx={17}
                    fill="rgba(18,18,21,0.92)"
                    stroke={C.line}
                  />
                  <circle cx={s.px - 34} cy={s.py} r={3.5} fill={s.tone} />
                  <Label
                    x={s.px - 22}
                    y={s.py + 4}
                    anchor="start"
                    size={11.5}
                    fill={C.text}
                    weight={600}
                    track="0.12em"
                  >
                    {s.t}
                  </Label>
                  <Label x={s.px} y={s.py + 30} size={9} font={F.mono} fill={C.dim} track="0.1em">
                    {s.s}
                  </Label>
                </g>
              </g>
            );
          })}

          {/* core */}
          <circle cx={cx} cy={cy} r={94} fill={`url(#${uid}-glow)`} opacity={0.9} />
          <circle cx={cx} cy={cy} r={58} fill={C.panelDeep} stroke="rgba(255,92,26,0.35)" strokeWidth={1.4} />
          <circle cx={cx} cy={cy} r={46} fill="none" stroke={C.lineSoft} strokeWidth={1} />
          <circle cx={cx} cy={cy - 30} r={3} fill={C.ember} data-pulse />
          <Label x={cx} y={cy + 2} size={21} font={F.display} fill={C.text} weight={800} track="0.16em">
            EMBER
          </Label>
          <Label x={cx} y={cy + 22} size={8} font={F.mono} fill={C.dim} track="0.28em">
            CONTINUITY
          </Label>
        </g>
      )}
    </SvgScene>
  );
}

/* ------------------------------------------------------------------ */
/* Story: the failure                                                  */
/* ------------------------------------------------------------------ */

export function SvgFail({ className }: { className?: string }) {
  const slots = [
    { y: 44, label: "MAR 01", state: "PAID", tone: C.green },
    { y: 100, label: "MAR 08", state: "PAID", tone: C.green },
    { y: 156, label: "MAR 15", state: "MISSED", tone: C.red },
    { y: 212, label: "MAR 22", state: "MISSED", tone: C.red },
  ];

  return (
    <SvgScene
      title="An agent goes offline and two payroll slots are missed"
      viewBox="0 0 560 300"
      className={className}
    >
      {(uid) => (
        <g>
          <Grid uid={uid} w={560} h={300} />
          <Slug x={10} y={22}>
            AGENT OFFLINE
          </Slug>

          {/* the agent */}
          <g>
            <rect
              x={16}
              y={112}
              width={132}
              height={92}
              rx={12}
              fill={C.panel}
              stroke="rgba(239,68,68,0.55)"
              strokeWidth={1.4}
              data-draw
            />
            <circle cx={82} cy={148} r={20} fill="none" stroke={C.red} strokeWidth={1.6} data-draw />
            <path
              d="M74 140 L90 156 M90 140 L74 156"
              stroke={C.red}
              strokeWidth={2}
              strokeLinecap="round"
              data-draw
            />
            <g data-fade>
              <Label x={82} y={184} size={11} fill={C.text} weight={600} track="0.08em">
                AI AGENT
              </Label>
              <Label x={82} y={198} size={8.5} font={F.mono} fill={C.red} track="0.16em">
                NO HEARTBEAT
              </Label>
            </g>
          </g>

          {/* wires */}
          {slots.map((s, i) => {
            const y = s.y + 22;
            const broken = s.state === "MISSED";
            return broken ? (
              <g key={`w-${i}`}>
                <path
                  d={`M156 158 C230 158, 250 ${y}, 300 ${y}`}
                  fill="none"
                  stroke="rgba(239,68,68,0.45)"
                  strokeWidth={2}
                  strokeDasharray="6 8"
                  data-pulse
                />
                <path
                  d={`M300 ${y} H366`}
                  fill="none"
                  stroke="rgba(239,68,68,0.2)"
                  strokeWidth={2}
                  strokeDasharray="4 8"
                />
                <path
                  d={`M296 ${y - 9} L304 ${y + 9} M292 ${y + 4} L308 ${y - 4}`}
                  stroke={C.red}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  data-draw
                />
              </g>
            ) : (
              <g key={`w-${i}`}>
                <path
                  d={`M156 158 C240 158, 280 ${y}, 366 ${y}`}
                  fill="none"
                  stroke="rgba(34,197,94,0.35)"
                  strokeWidth={1.6}
                  data-draw
                />
                <circle
                  r={3}
                  opacity={0}
                  fill={C.green}
                  data-travel={`ok-${i}`}
                  data-travel-dur="2.6"
                  data-travel-fade=""
                />
                <path
                  data-path={`ok-${i}`}
                  d={`M156 158 C240 158, 280 ${y}, 366 ${y}`}
                  fill="none"
                  stroke="none"
                />
              </g>
            );
          })}

          {/* pay slots */}
          {slots.map((s) => (
            <g key={s.label}>
              <rect
                x={366}
                y={s.y}
                width={178}
                height={44}
                rx={9}
                fill={C.panel}
                stroke={s.state === "MISSED" ? "rgba(239,68,68,0.4)" : C.line}
                strokeWidth={1.1}
                strokeDasharray={s.state === "MISSED" ? "5 5" : undefined}
                data-draw={s.state === "MISSED" ? undefined : ""}
              />
              <g data-fade>
                <circle cx={386} cy={s.y + 22} r={4} fill={s.tone} />
                <Label x={400} y={s.y + 26} anchor="start" size={11} fill={C.text} weight={600}>
                  {s.label}
                </Label>
                <Label
                  x={528}
                  y={s.y + 26}
                  anchor="end"
                  size={9}
                  font={F.mono}
                  fill={s.tone}
                  track="0.14em"
                >
                  {s.state}
                </Label>
              </g>
            </g>
          ))}

          <g data-fade>
            <Label x={16} y={278} anchor="start" size={10} font={F.mono} fill={C.dim} track="0.2em">
              PAYROLL FROZEN · 2 SLOTS UNPAID · TRUST GONE
            </Label>
          </g>
        </g>
      )}
    </SvgScene>
  );
}

/* ------------------------------------------------------------------ */
/* Rescue pipeline                                                     */
/* ------------------------------------------------------------------ */

const RESCUE_STEPS = [
  { t: "OBSERVE", s: "receipts", g: "eye" },
  { t: "LOCK", s: "journal", g: "lock" },
  { t: "REPLAY", s: "standby", g: "replay" },
  { t: "PROOF", s: "ipfs cid", g: "hash" },
  { t: "ANCHOR", s: "base tx", g: "cube" },
] as const;

function Glyph({ kind, x, y }: { kind: string; x: number; y: number }) {
  const s = { stroke: C.ember, strokeWidth: 1.5, fill: "none", strokeLinecap: "round" as const };
  switch (kind) {
    case "eye":
      return (
        <g transform={`translate(${x} ${y})`}>
          <path d="M-9 0 C-5 -6, 5 -6, 9 0 C5 6, -5 6, -9 0 Z" {...s} />
          <circle cx={0} cy={0} r={2.4} fill={C.ember} />
        </g>
      );
    case "lock":
      return (
        <g transform={`translate(${x} ${y})`}>
          <rect x={-7} y={-1} width={14} height={10} rx={2.5} {...s} />
          <path d="M-4 -1 V-4.5 A4 4 0 0 1 4 -4.5 V-1" {...s} />
        </g>
      );
    case "replay":
      return (
        <g transform={`translate(${x} ${y})`}>
          <path d="M8 -1 A8 8 0 1 1 -1 -8" {...s} />
          <path d="M-1 -8 L4 -8 M-1 -8 L-1 -3" {...s} />
        </g>
      );
    case "hash":
      return (
        <g transform={`translate(${x} ${y})`}>
          <path d="M-4 -8 L-6 8 M4 -8 L2 8 M-8 -3 H8 M-8 3 H8" {...s} />
        </g>
      );
    default:
      return (
        <g transform={`translate(${x} ${y})`}>
          <path d="M0 -9 L8 -4.5 V4.5 L0 9 L-8 4.5 V-4.5 Z" {...s} />
          <path d="M-8 -4.5 L0 0 L8 -4.5 M0 0 V9" {...s} strokeWidth={1} />
        </g>
      );
  }
}

export function SvgRescueFlow({ className }: { className?: string }) {
  const xs = [64, 176, 288, 400, 512];
  const y = 108;
  return (
    <SvgScene
      title="Rescue pipeline: observe, lock, replay, proof, anchor"
      viewBox="0 0 576 210"
      className={className}
    >
      {(uid) => (
        <g>
          <Slug x={10} y={24}>
            RESCUE PIPELINE
          </Slug>

          {/* rail */}
          <line x1={64} y1={y} x2={512} y2={y} stroke={C.lineSoft} strokeWidth={6} strokeLinecap="round" />
          <line
            x1={64}
            y1={y}
            x2={512}
            y2={y}
            stroke={`url(#${uid}-emberH)`}
            strokeWidth={1.6}
            strokeLinecap="round"
            data-flow="7 13"
            data-flow-dur="1.5"
          />
          <path data-path="rail" d={`M64 ${y} H512`} fill="none" stroke="none" />
          <circle
            r={4}
            opacity={0}
            fill="#ffd0b0"
            filter={`url(#${uid}-bloom)`}
            data-travel="rail"
            data-travel-dur="3.4"
            data-travel-fade=""
          />

          {xs.map((x, i) => (
            <g key={RESCUE_STEPS[i].t}>
              <circle cx={x} cy={y} r={30} fill={C.panelDeep} />
              <circle
                cx={x}
                cy={y}
                r={23}
                fill={C.panel}
                stroke="rgba(255,92,26,0.45)"
                strokeWidth={1.4}
                data-draw
              />
              <circle
                cx={x}
                cy={y}
                r={30}
                fill="none"
                stroke={C.ember}
                strokeWidth={1}
                data-seq={i}
              />
              <Glyph kind={RESCUE_STEPS[i].g} x={x} y={y} />
              <g data-fade>
                <Label x={x} y={58} size={9} font={F.mono} fill={C.dim} track="0.16em">
                  {String(i + 1).padStart(2, "0")}
                </Label>
                <Label x={x} y={162} size={11.5} fill={C.text} weight={600} track="0.1em">
                  {RESCUE_STEPS[i].t}
                </Label>
                <Label x={x} y={178} size={9} font={F.mono} fill={C.dim} track="0.12em">
                  {RESCUE_STEPS[i].s}
                </Label>
              </g>
            </g>
          ))}

          <g data-fade>
            <Label x={566} y={24} anchor="end" size={9} font={F.mono} fill={C.dim} track="0.2em">
              ONE PASS · NO HUMAN
            </Label>
          </g>
        </g>
      )}
    </SvgScene>
  );
}

/* ------------------------------------------------------------------ */
/* Proof chain                                                         */
/* ------------------------------------------------------------------ */

export function SvgProofChain({ className }: { className?: string }) {
  const stages = [
    { x: 16, t: "RECEIPT", v: "slot #14", g: "doc", tone: C.muted },
    { x: 156, t: "HASH", v: "0x9f4c…c2", g: "hash", tone: C.ember },
    { x: 296, t: "IPFS CID", v: "bafybe…7q", g: "hex", tone: C.blue },
    { x: 436, t: "BASE", v: "tx 0x71a…", g: "chain", tone: C.green },
  ];
  const w = 108;
  const y = 48;
  const h = 104;

  return (
    <SvgScene
      title="Proof chain: receipt hashed, pinned to IPFS, and anchored on Base"
      viewBox="0 0 560 232"
      className={className}
    >
      {(uid) => (
        <g>
          <Grid uid={uid} w={560} h={232} />
          <Slug x={10} y={24}>
            PROOF CHAIN
          </Slug>

          {stages.map((s, i) => (
            <g key={s.t}>
              <rect
                x={s.x}
                y={y}
                width={w}
                height={h}
                rx={12}
                fill={C.panel}
                stroke={i === 0 ? C.line : `rgba(255,255,255,0.14)`}
                strokeWidth={1.2}
                data-draw
              />
              <g data-fade>
                <Label x={s.x + w / 2} y={y + 22} size={9} font={F.mono} fill={C.dim} track="0.18em">
                  {s.t}
                </Label>
              </g>
              <g transform={`translate(${s.x + w / 2} ${y + 54})`}>
                {s.g === "doc" && (
                  <g>
                    <path
                      d="M-15 -18 H8 L15 -11 V18 H-15 Z"
                      fill="none"
                      stroke={C.muted}
                      strokeWidth={1.4}
                      data-draw
                    />
                    <path
                      d="M-8 -6 H8 M-8 1 H8 M-8 8 H2"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth={1.4}
                      strokeLinecap="round"
                      data-draw
                    />
                  </g>
                )}
                {s.g === "hash" && (
                  <g>
                    <path
                      d="M-7 -16 L-11 16 M7 -16 L3 16 M-16 -6 H16 M-16 6 H16"
                      stroke={C.ember}
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      data-draw
                    />
                  </g>
                )}
                {s.g === "hex" && (
                  <g>
                    <path
                      d="M0 -19 L17 -9.5 V9.5 L0 19 L-17 9.5 V-9.5 Z"
                      fill="rgba(96,165,250,0.06)"
                      stroke={C.blue}
                      strokeWidth={1.5}
                      data-draw
                    />
                    <circle cx={0} cy={0} r={4.5} fill={C.blue} data-pulse />
                    <path
                      d="M0 -19 L0 -8 M-17 -9.5 L-6 -3 M17 -9.5 L6 -3 M-8 8 L0 19 L8 8"
                      stroke="rgba(96,165,250,0.4)"
                      strokeWidth={1}
                      data-draw
                    />
                  </g>
                )}
                {s.g === "chain" && (
                  <g>
                    {[-13, 1, 15].map((oy, k) => (
                      <rect
                        key={oy}
                        x={-17}
                        y={oy - 5}
                        width={34}
                        height={10}
                        rx={3}
                        fill="none"
                        stroke={k === 2 ? C.green : "rgba(34,197,94,0.45)"}
                        strokeWidth={1.3}
                        data-draw
                      />
                    ))}
                  </g>
                )}
              </g>
              <g data-fade>
                <Label
                  x={s.x + w / 2}
                  y={y + 92}
                  size={9}
                  font={F.mono}
                  fill={s.tone}
                  track="0.06em"
                >
                  {s.v}
                </Label>
              </g>
              {i < stages.length - 1 && (
                <g>
                  <line
                    x1={s.x + w + 6}
                    y1={y + h / 2}
                    x2={stages[i + 1].x - 6}
                    y2={y + h / 2}
                    stroke={`url(#${uid}-emberH)`}
                    strokeWidth={1.6}
                    markerEnd={`url(#${uid}-arrow)`}
                    data-flow="5 9"
                    data-flow-dur="1.2"
                  />
                </g>
              )}
            </g>
          ))}

          {/* agreement bracket */}
          <path
            d={`M162 ${y + h + 14} V${y + h + 26} H488 V${y + h + 14}`}
            fill="none"
            stroke={C.lineSoft}
            strokeWidth={1.2}
            data-draw
          />
          <g data-fade>
            <circle cx={272} cy={y + h + 44} r={9} fill="rgba(34,197,94,0.12)" stroke={C.green} strokeWidth={1.2} />
            <path
              d={`M268 ${y + h + 44} l3.2 3.4 l6-7`}
              stroke={C.green}
              strokeWidth={1.8}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Label x={288} y={y + h + 48} anchor="start" size={10} fill={C.muted} track="0.12em">
              all three must agree
            </Label>
          </g>
        </g>
      )}
    </SvgScene>
  );
}

/* ------------------------------------------------------------------ */
/* Architecture — layered map                                          */
/* ------------------------------------------------------------------ */

export function SvgArchitecture({ className }: { className?: string }) {
  const L = 72;
  const RIGHT = 548;
  const lanes = [
    { y: 26, h: 44, tag: "SURFACE" },
    { y: 112, h: 48, tag: "ORCHESTRATION" },
    { y: 202, h: 50, tag: "AGENTS" },
    { y: 294, h: 44, tag: "SETTLEMENT" },
  ];

  return (
    <SvgScene
      title="EMBER architecture: console and builder over the KeeperHub runtime, agents beneath, settling on Base and IPFS"
      viewBox="0 0 560 360"
      className={className}
    >
      {(uid) => (
        <g>
          <Grid uid={uid} w={560} h={360} />

          {/* lane rails */}
          {lanes.map((l) => (
            <g key={l.tag}>
              <line
                x1={L - 14}
                y1={l.y}
                x2={L - 14}
                y2={l.y + l.h}
                stroke="rgba(255,92,26,0.35)"
                strokeWidth={1.5}
              />
              <g data-fade>
                <Label
                  x={L - 22}
                  y={l.y + l.h / 2 + 3}
                  anchor="end"
                  size={8}
                  font={F.mono}
                  fill={C.dim}
                  track="0.16em"
                >
                  {l.tag}
                </Label>
              </g>
            </g>
          ))}

          {/* surface */}
          <Card x={L} y={26} w={222} h={44} title="Console" sub="LIVE VIEW" />
          <Card x={326} y={26} w={222} h={44} title="Mission builder" sub="GUIDED SETUP" />

          {/* orchestration */}
          <rect
            x={L}
            y={112}
            width={RIGHT - L}
            height={48}
            rx={12}
            fill="rgba(255,92,26,0.07)"
            stroke="rgba(255,92,26,0.5)"
            strokeWidth={1.3}
            data-draw
          />
          <g data-fade>
            <Label x={280} y={132} size={13} fill={C.text} weight={700} track="0.08em">
              EMBER RUNTIME
            </Label>
            <Label x={280} y={148} size={8.5} font={F.mono} fill="#ffb184" track="0.18em">
              KEEPERHUB WORKFLOWS · HMAC SIGNED
            </Label>
          </g>
          <circle cx={L + 16} cy={136} r={4} fill={C.ember} data-pulse />
          <circle cx={RIGHT - 16} cy={136} r={4} fill={C.ember} data-pulse />

          {/* agents */}
          {[
            { t: "Observer", s: "WATCH" },
            { t: "Sentinel", s: "GUARD" },
            { t: "Replay", s: "PAY" },
            { t: "Proof", s: "SEAL" },
          ].map((a, i) => (
            <Card
              key={a.t}
              x={L + i * 122}
              y={202}
              w={110}
              h={50}
              title={a.t}
              sub={a.s}
              titleSize={11.5}
              accent="rgba(255,255,255,0.14)"
            />
          ))}

          {/* settlement */}
          <Card
            x={L}
            y={294}
            w={222}
            h={44}
            title="Base"
            sub="ONCHAIN ANCHOR"
            accent="rgba(34,197,94,0.4)"
          />
          <Card
            x={326}
            y={294}
            w={222}
            h={44}
            title="IPFS"
            sub="PINNED EVIDENCE"
            accent="rgba(96,165,250,0.4)"
          />

          {/* connectors */}
          {[L + 111, 326 + 111].map((x) => (
            <line
              key={`c1-${x}`}
              x1={x}
              y1={70}
              x2={x}
              y2={112}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={1.2}
              markerEnd={`url(#${uid}-arrowDim)`}
              data-flow="4 7"
              data-flow-dur="1.6"
            />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <line
              key={`c2-${i}`}
              x1={L + 55 + i * 122}
              y1={160}
              x2={L + 55 + i * 122}
              y2={202}
              stroke="rgba(255,92,26,0.45)"
              strokeWidth={1.2}
              markerEnd={`url(#${uid}-arrow)`}
              data-flow="4 7"
              data-flow-dur="1.3"
            />
          ))}
          <line
            x1={L + 55}
            y1={252}
            x2={L + 111}
            y2={294}
            stroke="rgba(34,197,94,0.4)"
            strokeWidth={1.2}
            data-flow="4 7"
            data-flow-dur="1.8"
          />
          <line
            x1={L + 299}
            y1={252}
            x2={326 + 111}
            y2={294}
            stroke="rgba(96,165,250,0.4)"
            strokeWidth={1.2}
            data-flow="4 7"
            data-flow-dur="1.8"
          />
        </g>
      )}
    </SvgScene>
  );
}

/* ------------------------------------------------------------------ */
/* Live telemetry orbit                                                */
/* ------------------------------------------------------------------ */

export function SvgOrbitSignal({ className }: { className?: string }) {
  const cx = 200;
  const cy = 200;
  const sats = [
    { r: 152, deg: -70, tone: C.ember, label: "PAYDAY" },
    { r: 152, deg: 40, tone: C.blue, label: "OBSERVER" },
    { r: 108, deg: 150, tone: C.green, label: "SENTINEL" },
    { r: 108, deg: -150, tone: "#fafafa", label: "PROOF" },
  ];

  return (
    <SvgScene
      title="Live mission telemetry orbit"
      viewBox="0 0 400 400"
      className={className}
    >
      {(uid) => (
        <g>
          <circle cx={cx} cy={cy} r={190} fill={`url(#${uid}-glow)`} opacity={0.7} />
          <circle
            cx={cx}
            cy={cy}
            r={178}
            fill="none"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth={4}
            strokeDasharray="1 13"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r={152} fill="none" stroke="rgba(255,92,26,0.16)" strokeWidth={1} />
          <circle
            cx={cx}
            cy={cy}
            r={108}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
            strokeDasharray="4 8"
          />
          <circle cx={cx} cy={cy} r={62} fill="none" stroke="rgba(255,92,26,0.4)" strokeWidth={1.2} />

          <path
            data-path="o1"
            d={`M${cx} ${cy - 152} A152 152 0 1 1 ${cx} ${cy + 152} A152 152 0 1 1 ${cx} ${cy - 152}`}
            fill="none"
            stroke="none"
          />

          {/* sweep */}
          <g data-orbit="14" data-orbit-x={cx} data-orbit-y={cy}>
            <path
              d={arc(cx, cy, 152, -160, -40)}
              fill="none"
              stroke={`url(#${uid}-comet)`}
              strokeWidth={2.5}
              strokeLinecap="round"
              filter={`url(#${uid}-bloom)`}
            />
          </g>
          <g data-orbit="9" data-orbit-dir="-1" data-orbit-x={cx} data-orbit-y={cy}>
            <path
              d={arc(cx, cy, 108, 20, 110)}
              fill="none"
              stroke="rgba(96,165,250,0.75)"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>

          {sats.map((s) => {
            const p = pol(cx, cy, s.r, s.deg);
            const lp = pol(cx, cy, s.r + 26, s.deg);
            return (
              <g key={s.label}>
                <circle cx={p.x} cy={p.y} r={13} fill={C.panelDeep} stroke={s.tone} strokeWidth={1.3} data-draw />
                <circle cx={p.x} cy={p.y} r={4} fill={s.tone} data-pulse />
                <circle cx={p.x} cy={p.y} r={13} fill="none" stroke={s.tone} strokeWidth={1} data-blip />
                <g data-fade>
                  <Label
                    x={lp.x}
                    y={lp.y + (s.deg > 0 ? 16 : -8)}
                    size={12}
                    font={F.mono}
                    fill={C.muted}
                    track="0.14em"
                  >
                    {s.label}
                  </Label>
                </g>
              </g>
            );
          })}

          <circle cx={cx} cy={cy} r={40} fill={C.panelDeep} stroke="rgba(255,92,26,0.3)" strokeWidth={1.2} />
          <circle cx={cx} cy={cy} r={9} fill={C.ember} data-pulse filter={`url(#${uid}-bloom)`} />
          <g data-fade>
            <Label x={cx} y={cy + 28} size={11} font={F.mono} fill={C.muted} track="0.24em">
              LIVE
            </Label>
          </g>
        </g>
      )}
    </SvgScene>
  );
}

/* ------------------------------------------------------------------ */
/* Wallet roles                                                        */
/* ------------------------------------------------------------------ */

export function SvgWalletNet({ className }: { className?: string }) {
  return (
    <SvgScene
      title="Wallet roles: payer, backup payer, escrow, and employee"
      viewBox="0 0 560 280"
      className={className}
    >
      {(uid) => (
        <g>
          <Slug x={10} y={22}>
            WHO HOLDS WHAT
          </Slug>

          {/* flows behind cards */}
          <path
            d="M156 74 C210 74, 200 132, 244 132"
            fill="none"
            stroke={`url(#${uid}-emberH)`}
            strokeWidth={1.8}
            markerEnd={`url(#${uid}-arrow)`}
            data-flow="6 10"
            data-flow-dur="1.4"
          />
          <path
            d="M156 206 C210 206, 200 150, 244 150"
            fill="none"
            stroke="rgba(255,92,26,0.5)"
            strokeWidth={1.8}
            strokeDasharray="5 7"
            markerEnd={`url(#${uid}-arrow)`}
            data-pulse
          />
          <path data-path="pay" d="M398 140 H418" fill="none" stroke="none" />
          <line
            x1={382}
            y1={140}
            x2={430}
            y2={140}
            stroke={`url(#${uid}-green)`}
            strokeWidth={2}
            data-flow="6 10"
            data-flow-dur="1.1"
          />
          <g opacity={0} data-travel="pay" data-travel-dur="2" data-travel-fade="">
            <rect x={-14} y={-8} width={28} height={16} rx={8} fill="#101a12" stroke={C.green} strokeWidth={1} />
            <text x={0} y={4} textAnchor="middle" fill="#86efac" fontSize={8} fontFamily={F.mono}>
              USDC
            </text>
          </g>

          <Card x={20} y={48} w={136} h={52} title="Payer" sub="PRIMARY ORG" accent="rgba(255,92,26,0.45)" />
          <Card x={20} y={180} w={136} h={52} title="Backup payer" sub="STANDBY ORG" accent="rgba(255,255,255,0.16)" titleSize={11} />
          <Card x={244} y={114} w={138} h={52} title="Escrow" sub="MISSION FUNDS" accent="rgba(255,92,26,0.35)" />
          <Card x={434} y={114} w={110} h={52} title="Employee" sub="GETS PAID" accent="rgba(34,197,94,0.45)" titleSize={11} />

          <g data-fade>
            <Label x={88} y={116} size={8.5} font={F.mono} fill={C.dim} track="0.1em">
              0x7a…41c
            </Label>
            <Label x={88} y={248} size={8.5} font={F.mono} fill={C.dim} track="0.1em">
              0x2f…9be
            </Label>
            <Label x={313} y={182} size={8.5} font={F.mono} fill={C.dim} track="0.1em">
              holds runway
            </Label>
            <Label x={489} y={182} size={8.5} font={F.mono} fill={C.dim} track="0.1em">
              0xc4…08d
            </Label>
            <Label x={200} y={106} size={8.5} font={F.mono} fill="#ffb184" track="0.12em">
              funds
            </Label>
            <Label x={200} y={176} size={8.5} font={F.mono} fill={C.dim} track="0.12em">
              takes over
            </Label>
          </g>
        </g>
      )}
    </SvgScene>
  );
}

/* ------------------------------------------------------------------ */
/* Health radar                                                        */
/* ------------------------------------------------------------------ */

export function SvgHealthRadar({ className }: { className?: string }) {
  const cx = 160;
  const cy = 160;
  const blips = [
    { deg: -58, r: 96, tone: C.green },
    { deg: 26, r: 62, tone: C.green },
    { deg: 128, r: 112, tone: C.ember },
    { deg: -142, r: 74, tone: C.green },
  ];

  return (
    <SvgScene title="Mission health radar sweep" viewBox="0 0 320 320" className={className}>
      {(uid) => (
        <g>
          <circle cx={cx} cy={cy} r={130} fill={`url(#${uid}-glow)`} opacity={0.5} />
          {[44, 82, 120].map((r) => (
            <circle
              key={r}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.09)"
              strokeWidth={1}
              data-draw
            />
          ))}
          <circle
            cx={cx}
            cy={cy}
            r={138}
            fill="none"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth={4}
            strokeDasharray="1 11"
            strokeLinecap="round"
          />
          {[0, 45, 90, 135].map((d) => {
            const a = pol(cx, cy, 120, d);
            const b = pol(cx, cy, 120, d + 180);
            return (
              <line
                key={d}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
            );
          })}

          {/* sweep wedge */}
          <g data-orbit="6" data-orbit-x={cx} data-orbit-y={cy}>
            <path d={wedge(cx, cy, 120, -90, -22)} fill="rgba(255,92,26,0.14)" />
            <line
              x1={cx}
              y1={cy}
              x2={pol(cx, cy, 122, -90).x}
              y2={pol(cx, cy, 122, -90).y}
              stroke={C.ember}
              strokeWidth={1.6}
              strokeLinecap="round"
            />
          </g>

          {blips.map((b, i) => {
            const p = pol(cx, cy, b.r, b.deg);
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={4} fill={b.tone} />
                <circle cx={p.x} cy={p.y} r={7} fill="none" stroke={b.tone} strokeWidth={1} data-blip />
              </g>
            );
          })}

          <circle cx={cx} cy={cy} r={5} fill={C.ember} data-pulse />
        </g>
      )}
    </SvgScene>
  );
}

/* ------------------------------------------------------------------ */
/* Observer / Sentinel portraits                                       */
/* ------------------------------------------------------------------ */

export function SvgObserver({ className }: { className?: string }) {
  const cx = 280;
  const cy = 150;
  return (
    <SvgScene title="Observer watches mission receipts" viewBox="0 0 560 300" className={className}>
      {(uid) => (
        <g>
          <circle cx={cx} cy={cy} r={130} fill={`url(#${uid}-glowBlue)`} />
          {[110, 78].map((r) => (
            <circle
              key={r}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="rgba(96,165,250,0.3)"
              strokeWidth={1.3}
              data-draw
            />
          ))}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => {
            const p = pol(cx, cy, 118, d);
            return (
              <line
                key={d}
                x1={pol(cx, cy, 82, d).x}
                y1={pol(cx, cy, 82, d).y}
                x2={p.x}
                y2={p.y}
                stroke="rgba(96,165,250,0.22)"
                strokeWidth={1}
                data-draw
              />
            );
          })}
          <g data-orbit="8" data-orbit-x={cx} data-orbit-y={cy}>
            <path
              d={arc(cx, cy, 110, -120, -30)}
              fill="none"
              stroke={C.blue}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
          <path
            d={`M${cx - 34} ${cy} C${cx - 18} ${cy - 22}, ${cx + 18} ${cy - 22}, ${cx + 34} ${cy} C${
              cx + 18
            } ${cy + 22}, ${cx - 18} ${cy + 22}, ${cx - 34} ${cy} Z`}
            fill="rgba(96,165,250,0.08)"
            stroke={C.blue}
            strokeWidth={1.6}
            data-draw
          />
          <circle cx={cx} cy={cy} r={9} fill={C.blue} data-pulse />
          <g data-fade>
            <Label x={cx} y={272} size={11} fill={C.text} weight={600} track="0.16em">
              OBSERVER
            </Label>
          </g>
        </g>
      )}
    </SvgScene>
  );
}

export function SvgSentinel({ className }: { className?: string }) {
  const cx = 280;
  return (
    <SvgScene title="Sentinel guards continuity" viewBox="0 0 560 300" className={className}>
      {(uid) => (
        <g>
          <circle cx={cx} cy={150} r={130} fill={`url(#${uid}-glow)`} opacity={0.7} />
          <path
            d={`M${cx} 40 L${cx + 76} 78 V158 C${cx + 76} 212, ${cx + 38} 252, ${cx} 268 C${
              cx - 38
            } 252, ${cx - 76} 212, ${cx - 76} 158 V78 Z`}
            fill="rgba(255,92,26,0.07)"
            stroke={C.ember}
            strokeWidth={1.8}
            data-draw
            filter={`url(#${uid}-soft)`}
          />
          <path
            d={`M${cx} 62 L${cx + 58} 91 V157 C${cx + 58} 199, ${cx + 30} 231, ${cx} 245 C${
              cx - 30
            } 231, ${cx - 58} 199, ${cx - 58} 157 V91 Z`}
            fill="none"
            stroke="rgba(255,92,26,0.25)"
            strokeWidth={1}
            data-draw
          />
          <path
            d={`M${cx - 26} 152 L${cx - 6} 172 L${cx + 30} 128`}
            fill="none"
            stroke={C.ember}
            strokeWidth={3.2}
            strokeLinecap="round"
            data-draw
          />
          <g data-fade>
            <Label x={cx} y={292} size={11} fill={C.text} weight={600} track="0.16em">
              SENTINEL
            </Label>
          </g>
        </g>
      )}
    </SvgScene>
  );
}

/* ------------------------------------------------------------------ */
/* Payroll stream                                                      */
/* ------------------------------------------------------------------ */

export function SvgPayrollStream({ className }: { className?: string }) {
  const y = 132;
  const ticks = [
    { x: 214, label: "MAR 01" },
    { x: 278, label: "MAR 08" },
    { x: 342, label: "MAR 15" },
    { x: 406, label: "MAR 22" },
  ];
  return (
    <SvgScene
      title="Payroll stream from the payer to the employee on a fixed cadence"
      viewBox="0 0 560 240"
      className={className}
    >
      {(uid) => (
        <g>
          <Slug x={10} y={24}>
            PAYDAY STREAM
          </Slug>

          <Card x={16} y={y - 30} w={132} h={60} title="Payer" sub="ORG WALLET" accent="rgba(255,92,26,0.45)" />
          <Card
            x={412}
            y={y - 30}
            w={132}
            h={60}
            title="Employee"
            sub="RECEIVES USDC"
            accent="rgba(34,197,94,0.45)"
            titleSize={11.5}
          />

          {/* the stream */}
          <path
            data-path="stream"
            d={`M156 ${y} C230 ${y - 34}, 330 ${y + 34}, 404 ${y}`}
            fill="none"
            stroke="none"
          />
          <path
            d={`M156 ${y} C230 ${y - 34}, 330 ${y + 34}, 404 ${y}`}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={8}
            strokeLinecap="round"
          />
          <path
            d={`M156 ${y} C230 ${y - 34}, 330 ${y + 34}, 404 ${y}`}
            fill="none"
            stroke={`url(#${uid}-emberH)`}
            strokeWidth={2}
            strokeLinecap="round"
            data-flow="8 12"
            data-flow-dur="1.6"
          />
          {[0, 0.33, 0.66].map((at) => (
            <g
              key={at}
              opacity={0}
              data-travel="stream"
              data-travel-dur="3.2"
              data-travel-at={at}
              data-travel-fade=""
            >
              <circle r={9} fill="rgba(255,92,26,0.18)" />
              <circle r={4} fill="#ffd0b0" />
            </g>
          ))}

          {/* cadence ruler */}
          <line x1={200} y1={44} x2={420} y2={44} stroke={C.lineSoft} strokeWidth={1} data-draw />
          {ticks.map((t, i) => (
            <g key={t.label}>
              <line x1={t.x} y1={38} x2={t.x} y2={50} stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
              <line
                x1={t.x}
                y1={68}
                x2={t.x}
                y2={112}
                stroke={i === 2 ? "rgba(255,92,26,0.35)" : "rgba(255,255,255,0.08)"}
                strokeWidth={1}
                strokeDasharray="2 5"
              />
              <circle cx={t.x} cy={62} r={3.5} fill={i === 2 ? C.ember : C.green} data-pulse={i === 2 ? "" : undefined} />
              <g data-fade>
                <Label x={t.x} y={30} size={8} font={F.mono} fill={C.dim} track="0.1em">
                  {t.label}
                </Label>
              </g>
            </g>
          ))}
          <g data-fade>
            <Label x={190} y={48} anchor="end" size={8} font={F.mono} fill={C.dim} track="0.16em">
              CADENCE
            </Label>
            <Label x={280} y={214} size={10} font={F.mono} fill={C.dim} track="0.18em">
              1,000 USDC · EVERY 7 DAYS · AUTOMATIC
            </Label>
          </g>
        </g>
      )}
    </SvgScene>
  );
}

/* ------------------------------------------------------------------ */
/* Escrow vault                                                        */
/* ------------------------------------------------------------------ */

export function SvgEscrow({ className }: { className?: string }) {
  return (
    <SvgScene title="Escrow vault holding mission runway" viewBox="0 0 360 300" className={className}>
      {(uid) => (
        <g>
          <circle cx={180} cy={150} r={140} fill={`url(#${uid}-glow)`} opacity={0.6} />
          <rect
            x={78}
            y={64}
            width={204}
            height={172}
            rx={16}
            fill={C.panel}
            stroke="rgba(255,92,26,0.45)"
            strokeWidth={1.5}
            data-draw
          />
          <rect x={104} y={44} width={152} height={24} rx={8} fill={C.panelDeep} stroke={C.line} data-draw />
          {/* stacked runway */}
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={106}
              y={196 - i * 26}
              width={148 - i * 26}
              height={18}
              rx={4}
              fill={i === 0 ? "rgba(255,92,26,0.22)" : "rgba(255,92,26,0.1)"}
              stroke="rgba(255,92,26,0.4)"
              strokeWidth={1}
              data-draw
            />
          ))}
          {/* lock */}
          <g transform="translate(180 108)">
            <rect x={-18} y={-4} width={36} height={28} rx={7} fill={C.panelDeep} stroke={C.ember} strokeWidth={1.4} data-draw />
            <path
              d="M-10 -4 V-12 A10 10 0 0 1 10 -12 V-4"
              fill="none"
              stroke={C.ember}
              strokeWidth={1.6}
              data-draw
            />
            <circle cx={0} cy={10} r={3} fill={C.ember} data-pulse />
          </g>
          <g data-fade>
            <Label x={180} y={264} size={11} fill={C.text} weight={600} track="0.14em">
              ESCROW
            </Label>
            <Label x={180} y={282} size={9} font={F.mono} fill={C.dim} track="0.16em">
              RUNWAY LOCKED FOR PAYROLL
            </Label>
          </g>
        </g>
      )}
    </SvgScene>
  );
}

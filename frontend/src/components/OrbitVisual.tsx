import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/** CSS + canvas orbital signal field — original EMBER visual, not a copy. */
export function OrbitVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let t = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.52;
      const cy = h * 0.48;
      const rings = 6;

      for (let i = 0; i < rings; i++) {
        const r = 40 + i * 38;
        const rot = t * (0.12 + i * 0.02) * (i % 2 === 0 ? 1 : -1);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255,92,26,${0.08 + i * 0.03})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 10 + i * 2]);
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        // signal nodes
        for (let n = 0; n < 3 + i; n++) {
          const a = (n / (3 + i)) * Math.PI * 2 + rot * 0.5;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          ctx.beginPath();
          ctx.fillStyle = i === rings - 1 ? "#ff5c1a" : "rgba(250,250,250,0.55)";
          ctx.arc(x, y, i === rings - 1 ? 2.5 : 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // core ember
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 48);
      g.addColorStop(0, "rgba(255,92,26,0.55)");
      g.addColorStop(1, "rgba(255,92,26,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 48, 0, Math.PI * 2);
      ctx.fill();

      if (!reduce) {
        t += 0.016;
        raf = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reduce]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#09090b_85%)]" />
    </div>
  );
}

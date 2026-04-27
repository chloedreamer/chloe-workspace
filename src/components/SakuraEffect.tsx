"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";

const PETAL_COUNT = 35;
const PETAL = "🌸";

export default function SakuraEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("sakura-enabled");
    if (stored !== null) setEnabled(stored === "true");
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    interface Petal {
      x: number; y: number; size: number;
      speedY: number; speedX: number;
      rotation: number; rotSpeed: number;
      opacity: number; sway: number; swayOffset: number;
    }

    const petals: Petal[] = [];
    for (let i = 0; i < PETAL_COUNT; i++) {
      petals.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight - window.innerHeight,
        size: Math.random() * 10 + 15,
        speedY: Math.random() * 0.6 + 0.6,
        speedX: Math.random() * 0.4 - 0.2,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.2 + 0.25,
        sway: Math.random() * 0.3,
        swayOffset: Math.random() * Math.PI * 2,
      });
    }

    let frame = 0;
    let raf = 0;
    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      petals.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(frame * 0.01 + p.swayOffset) * p.sway;
        p.rotation += p.rotSpeed;
        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(PETAL, 0, 0);
        ctx.restore();
      });
      raf = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [enabled]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("sakura-enabled", String(next));
  };

  return (
    <>
      {enabled && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-0 opacity-50"
        />
      )}
      <button
        onClick={toggle}
        title={enabled ? "Turn off sakura" : "Turn on sakura"}
        className={`fixed bottom-6 left-6 rounded-full p-3 shadow-lg transition z-40 ${
          enabled
            ? "bg-rose-deep text-white hover:opacity-90"
            : "bg-white text-rose-muted hover:text-rose-deep"
        }`}
      >
        {enabled ? <X className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </button>
    </>
  );
}

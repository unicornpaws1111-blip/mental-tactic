import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  layer: number; // 0: background, 1: midground, 2: foreground
  pulseSpeed: number;
  phase: number;
}

interface WavePoint {
  x: number;
  y: number;
  baseY: number;
  speed: number;
  amplitude: number;
}

export const HeroCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    // Mouse coordinates with smooth lagging
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      active: false,
    };

    // Multi-layer particle system
    const particleCount = width < 768 ? 40 : 70;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const layer = Math.random() > 0.65 ? 2 : Math.random() > 0.35 ? 1 : 0;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (layer === 2 ? 0.35 : layer === 1 ? 0.2 : 0.1),
        vy: (Math.random() - 0.5) * (layer === 2 ? 0.35 : layer === 1 ? 0.2 : 0.1) - 0.05, // gentle upward drift
        size: layer === 2 ? Math.random() * 1.8 + 1.2 : layer === 1 ? Math.random() * 1.2 + 0.8 : 0.75,
        alpha: layer === 2 ? Math.random() * 0.4 + 0.35 : layer === 1 ? Math.random() * 0.3 + 0.2 : 0.15,
        layer,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Abstract subtle wave lines
    const wavePoints: WavePoint[] = [];
    const waveCount = 18;
    for (let i = 0; i <= waveCount; i++) {
      wavePoints.push({
        x: (i / waveCount) * width,
        y: height * 0.6,
        baseY: height * 0.6,
        speed: 0.008 + i * 0.001,
        amplitude: 15 + (i % 3) * 6,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      if (!mouse.active) {
        mouse.x = width / 2;
        mouse.y = height / 2;
        mouse.targetX = width / 2;
        mouse.targetY = height / 2;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isTouchDevice) return;
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.targetX = width / 2;
      mouse.targetY = height / 2;
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    let tick = 0;

    const render = () => {
      tick++;

      // Mouse smooth interpolation
      if (!isTouchDevice && mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.06;
        mouse.y += (mouse.targetY - mouse.y) * 0.06;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Base Layer: Deep dark charcoal in dark mode, crisp off-white in light mode
      const isDark = document.documentElement.classList.contains('dark');
      const baseGrad = ctx.createRadialGradient(
        width / 2,
        height * 0.45,
        40,
        width / 2,
        height * 0.5,
        Math.max(width, height) * 0.7
      );
      if (isDark) {
        baseGrad.addColorStop(0, '#0c0406');
        baseGrad.addColorStop(0.35, '#050203');
        baseGrad.addColorStop(0.8, '#010101');
        baseGrad.addColorStop(1, '#000000');
      } else {
        baseGrad.addColorStop(0, '#fff5f5');
        baseGrad.addColorStop(0.35, '#fcfbfb');
        baseGrad.addColorStop(0.8, '#f7f7f7');
        baseGrad.addColorStop(1, '#ffffff');
      }
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Layer: Soft Interactive Mouse Glow (Subtle crimson spotlight)
      if (!isTouchDevice && mouse.active) {
        const mouseGlow = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          Math.min(width, height) * 0.42
        );
        mouseGlow.addColorStop(0, 'rgba(220, 38, 38, 0.14)');
        mouseGlow.addColorStop(0.4, 'rgba(185, 28, 28, 0.05)');
        mouseGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = mouseGlow;
        ctx.fillRect(0, 0, width, height);
      }

      // 3. Central Ambient Breathing Pulse (Psychological intelligence core)
      const pulse = Math.sin(tick * 0.015) * 0.02 + 0.09;
      const coreGrad = ctx.createRadialGradient(
        width / 2,
        height * 0.46,
        0,
        width / 2,
        height * 0.46,
        Math.min(width, height) * 0.4
      );
      coreGrad.addColorStop(0, `rgba(220, 38, 38, ${pulse})`);
      coreGrad.addColorStop(0.5, 'rgba(153, 27, 27, 0.02)');
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coreGrad;
      ctx.fillRect(0, 0, width, height);

      // 4. Subtle flowing abstract cognitive wave in midground
      if (!prefersReducedMotion) {
        ctx.beginPath();
        for (let i = 0; i < wavePoints.length; i++) {
          const pt = wavePoints[i];
          const wy = pt.baseY + Math.sin(tick * pt.speed + i * 0.4) * pt.amplitude;
          if (i === 0) {
            ctx.moveTo(pt.x, wy);
          } else {
            const prev = wavePoints[i - 1];
            const prevY = prev.baseY + Math.sin(tick * prev.speed + (i - 1) * 0.4) * prev.amplitude;
            const cpx = (prev.x + pt.x) / 2;
            const cpy = (prevY + wy) / 2;
            ctx.quadraticCurveTo(prev.x, prevY, cpx, cpy);
          }
        }
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.05)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 5. Connective Neural-Network Synapses
      const maxConnectDistance = width < 768 ? 75 : 105;
      const mouseInfluenceRadius = 140;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          // Mouse gentle repulsion & parallax shift
          if (!isTouchDevice && mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < mouseInfluenceRadius && dist > 0) {
              const force = (1 - dist / mouseInfluenceRadius) * (p.layer === 2 ? 0.7 : 0.35);
              p.x += (dx / dist) * force;
              p.y += (dy / dist) * force;
            }
          }

          // Wrap edges
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;
        }

        // Draw connections to nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          // Only connect if in similar layers for depth realism
          if (Math.abs(p.layer - p2.layer) <= 1) {
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < maxConnectDistance) {
              const lineAlpha = (1 - dist / maxConnectDistance) * (p.layer === 2 ? 0.16 : 0.08);
              ctx.beginPath();
              ctx.strokeStyle = `rgba(239, 68, 68, ${lineAlpha})`;
              ctx.lineWidth = 0.65;
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }

        // Draw glowing particle node
        const glowPulse = Math.sin(tick * p.pulseSpeed + p.phase) * 0.25 + 0.75;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.layer === 2 ? glowPulse : 1), 0, Math.PI * 2);

        if (p.layer === 2) {
          ctx.fillStyle = `rgba(248, 113, 113, ${p.alpha * glowPulse})`;
        } else if (p.layer === 1) {
          ctx.fillStyle = `rgba(220, 38, 38, ${p.alpha * glowPulse})`;
        } else {
          ctx.fillStyle = `rgba(185, 28, 28, ${p.alpha})`;
        }
        ctx.fill();
      }

      // 6. Geometric architectural ring (subtle precision line)
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.beginPath();
      ctx.arc(width / 2, height * 0.46, Math.min(width, height) * 0.26, 0, Math.PI * 2);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ touchAction: 'pan-y' }}
    />
  );
};

/**
 * High-performance lightweight Canvas Confetti engine.
 * Self-contained, zero external dependencies, renders directly to DOM canvas.
 */

interface Particle {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  tilt: number;
  tiltSpeed: number;
  shape: 'rect' | 'circle' | 'ribbon';
  opacity: number;
  decay: number;
}

const COLORS = [
  '#FF3B30', // Vibrant Red
  '#FF9500', // Orange
  '#FFCC00', // Gold/Yellow
  '#34C759', // Green
  '#00C7BE', // Teal
  '#32ADE6', // Sky
  '#007AFF', // Blue
  '#5856D6', // Indigo
  '#AF52DE', // Purple
  '#FF2D55', // Pink
];

export function launchConfetti(canvas: HTMLCanvasElement, durationMs: number = 3200) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Sync canvas size with screen
  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const particles: Particle[] = [];
  const particleCount = 140;

  // Create bursts from both sides and center bottom
  for (let i = 0; i < particleCount; i++) {
    // 3 origin points: left cannon (20%), center (50%), right cannon (80%)
    const originCluster = i % 3;
    let startX = width * 0.5;
    let startY = height * 0.7;
    let baseAngle = -Math.PI / 2;

    if (originCluster === 0) {
      startX = width * 0.15;
      startY = height * 0.85;
      baseAngle = -Math.PI / 3; // angled right-up
    } else if (originCluster === 1) {
      startX = width * 0.85;
      startY = height * 0.85;
      baseAngle = (-2 * Math.PI) / 3; // angled left-up
    }

    const angle = baseAngle + (Math.random() - 0.5) * 0.8;
    const speed = 12 + Math.random() * 22;

    const shapes: ('rect' | 'circle' | 'ribbon')[] = ['rect', 'circle', 'ribbon'];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    particles.push({
      x: startX,
      y: startY,
      w: shape === 'ribbon' ? 4 : 8 + Math.random() * 6,
      h: shape === 'ribbon' ? 16 + Math.random() * 10 : 8 + Math.random() * 6,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
      tilt: Math.random() * 10,
      tiltSpeed: 0.08 + Math.random() * 0.1,
      shape,
      opacity: 1,
      decay: 0.003 + Math.random() * 0.005,
    });
  }

  const startTime = performance.now();
  let animationId: number;

  function render(currentTime: number) {
    if (!ctx) return;
    const elapsed = currentTime - startTime;

    ctx.clearRect(0, 0, width, height);

    let activeCount = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Gravity and air resistance
      p.vy += 0.42;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;

      p.rotation += p.rotationSpeed;
      p.tilt += p.tiltSpeed;

      // Fade out near end of duration
      if (elapsed > durationMs - 1000) {
        p.opacity -= p.decay * 3;
      }

      if (p.opacity > 0 && p.y < height + 50) {
        activeCount++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.scale(Math.sin(p.tilt), 1);

        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }

        ctx.restore();
      }
    }

    if (activeCount > 0 && elapsed < durationMs) {
      animationId = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, width, height);
      cancelAnimationFrame(animationId);
    }
  }

  animationId = requestAnimationFrame(render);
}

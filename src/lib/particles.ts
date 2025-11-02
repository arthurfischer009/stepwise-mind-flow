export const createParticleBurst = (x: number, y: number, color: string) => {
  const particleCount = 30;
  const particles: HTMLDivElement[] = [];

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.width = '8px';
    particle.style.height = '8px';
    particle.style.borderRadius = '50%';
    particle.style.backgroundColor = color;
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '9999';
    particle.style.boxShadow = `0 0 8px ${color}`;
    
    document.body.appendChild(particle);
    particles.push(particle);

    const angle = (Math.PI * 2 * i) / particleCount;
    const velocity = 2 + Math.random() * 3;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;
    
    let px = x;
    let py = y;
    let opacity = 1;
    let scale = 1;

    const animate = () => {
      px += vx;
      py += vy + 0.5; // gravity
      opacity -= 0.02;
      scale -= 0.02;

      if (opacity <= 0) {
        particle.remove();
        return;
      }

      particle.style.left = `${px}px`;
      particle.style.top = `${py}px`;
      particle.style.opacity = `${opacity}`;
      particle.style.transform = `scale(${scale})`;

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  // Cleanup after animation
  setTimeout(() => {
    particles.forEach(p => p.remove());
  }, 2000);
};

export const screenShake = (duration: number = 300, intensity: number = 5) => {
  const app = document.body;
  const originalTransform = app.style.transform;
  
  let startTime: number | null = null;

  const shake = (timestamp: number) => {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    
    if (elapsed < duration) {
      const progress = elapsed / duration;
      const currentIntensity = intensity * (1 - progress);
      const x = (Math.random() - 0.5) * currentIntensity * 2;
      const y = (Math.random() - 0.5) * currentIntensity * 2;
      
      app.style.transform = `translate(${x}px, ${y}px)`;
      requestAnimationFrame(shake);
    } else {
      app.style.transform = originalTransform;
    }
  };

  requestAnimationFrame(shake);
};

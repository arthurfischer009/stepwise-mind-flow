import confetti from 'canvas-confetti';

export const triggerConfetti = (options?: {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
}) => {
  const defaults = {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#10b981', '#3b82f6', '#f97316', '#eab308', '#ec4899', '#8b5cf6'],
  };

  confetti({
    ...defaults,
    ...options,
  });
};

export const triggerLevelUpConfetti = () => {
  const duration = 2000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#10b981', '#3b82f6', '#f97316'],
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#eab308', '#ec4899', '#8b5cf6'],
    });
  }, 250);
};

export const triggerAchievementConfetti = (color: string) => {
  confetti({
    particleCount: 150,
    spread: 100,
    origin: { x: 1, y: 0.5 },
    colors: [color],
    angle: 150,
    startVelocity: 45,
  });
};

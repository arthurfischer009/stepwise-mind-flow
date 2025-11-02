// Sound Manager using Web Audio API for instant, lightweight audio feedback

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialize on first user interaction
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private ensureContext() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  // Play a simple beep with customizable frequency and duration
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (!this.enabled || !this.audioContext) return;
    
    this.ensureContext();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Level Complete - Uplifting ascending sound
  playLevelComplete() {
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.25), i * 80);
    });
  }

  // Achievement Unlocked - Triumphant fanfare
  playAchievementUnlock(rarity: string = 'common') {
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    let notes: number[] = [];
    
    switch (rarity) {
      case 'legendary':
        notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // Extra epic!
        break;
      case 'epic':
        notes = [523.25, 659.25, 880.00, 1046.50];
        break;
      case 'rare':
        notes = [440.00, 554.37, 659.25, 880.00];
        break;
      default:
        notes = [523.25, 659.25, 783.99];
    }
    
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, 'triangle', 0.3);
      }, i * 100);
    });
  }

  // Task Added - Quick positive feedback
  playTaskAdded() {
    if (!this.audioContext) return;
    
    this.playTone(659.25, 0.1, 'sine', 0.2); // E5
    setTimeout(() => this.playTone(783.99, 0.1, 'sine', 0.2), 50); // G5
  }

  // Task Deleted - Soft whoosh
  playTaskDeleted() {
    if (!this.audioContext) return;
    
    this.playTone(440.00, 0.12, 'sawtooth', 0.15); // A4, softer
  }

  // Streak Milestone - Special celebratory sound
  playStreakMilestone(days: number) {
    if (!this.audioContext) return;
    
    // More impressive sound for longer streaks
    const intensity = Math.min(days / 7, 3); // Scale up to 3x for 21+ days
    const notes = [
      523.25, 659.25, 783.99, // C5, E5, G5
      1046.50, 1318.51, 1567.98 // C6, E6, G6
    ].slice(0, 3 + Math.floor(intensity));
    
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.18, 'triangle', 0.28);
      }, i * 70);
    });
  }

  // Button Click - Subtle feedback
  playClick() {
    if (!this.audioContext) return;
    
    this.playTone(800, 0.05, 'square', 0.1);
  }

  // XP Gained - Coin-like sound
  playXPGain() {
    if (!this.audioContext) return;
    
    this.playTone(987.77, 0.08, 'sine', 0.2); // B5
    setTimeout(() => this.playTone(1318.51, 0.1, 'sine', 0.25), 60); // E6
  }

  // Combo/Fast completion - Exciting rapid sound
  playCombo(comboCount: number) {
    if (!this.audioContext) return;
    
    const baseFreq = 659.25;
    const freq = baseFreq * (1 + comboCount * 0.1); // Pitch increases with combo
    this.playTone(freq, 0.08, 'square', 0.22);
  }

  // Error/Undo - Gentle negative feedback
  playError() {
    if (!this.audioContext) return;
    
    this.playTone(200, 0.2, 'sawtooth', 0.15);
  }

  // Power Up - Ascending whoosh
  playPowerUp() {
    if (!this.audioContext) return;

    const startFreq = 200;
    const endFreq = 800;
    const duration = 0.3;

    this.ensureContext();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    const now = this.audioContext.currentTime;
    
    oscillator.frequency.setValueAtTime(startFreq, now);
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.25, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
  }
}

// Singleton instance
export const soundManager = new SoundManager();

// Convenience functions
export const playLevelComplete = () => soundManager.playLevelComplete();
export const playAchievementUnlock = (rarity?: string) => soundManager.playAchievementUnlock(rarity);
export const playTaskAdded = () => soundManager.playTaskAdded();
export const playTaskDeleted = () => soundManager.playTaskDeleted();
export const playStreakMilestone = (days: number) => soundManager.playStreakMilestone(days);
export const playClick = () => soundManager.playClick();
export const playXPGain = () => soundManager.playXPGain();
export const playCombo = (comboCount: number) => soundManager.playCombo(comboCount);
export const playError = () => soundManager.playError();
export const playPowerUp = () => soundManager.playPowerUp();
export const setSoundsEnabled = (enabled: boolean) => soundManager.setEnabled(enabled);

import { useState, useCallback, useRef } from "react";
import { playCombo } from "@/lib/sounds";

interface ComboState {
  count: number;
  multiplier: number;
  lastCompletionTime: number;
}

export const useComboSystem = () => {
  const [combo, setCombo] = useState<ComboState>({
    count: 0,
    multiplier: 1,
    lastCompletionTime: 0,
  });
  
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addCombo = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCompletion = now - combo.lastCompletionTime;
    
    // Reset combo if more than 5 seconds have passed
    if (timeSinceLastCompletion > 5000 && combo.count > 0) {
      setCombo({ count: 1, multiplier: 1, lastCompletionTime: now });
      playCombo(1);
      return 1;
    }

    const newCount = combo.count + 1;
    let newMultiplier = 1;

    // Calculate multiplier based on combo
    if (newCount >= 10) {
      newMultiplier = 2.0; // 2x at 10 combo
    } else if (newCount >= 7) {
      newMultiplier = 1.75; // 1.75x at 7 combo
    } else if (newCount >= 5) {
      newMultiplier = 1.5; // 1.5x at 5 combo
    } else if (newCount >= 3) {
      newMultiplier = 1.25; // 1.25x at 3 combo
    }

    setCombo({
      count: newCount,
      multiplier: newMultiplier,
      lastCompletionTime: now,
    });

    playCombo(newCount);
    
    return newMultiplier;
  }, [combo]);

  const resetCombo = useCallback(() => {
    setCombo({ count: 0, multiplier: 1, lastCompletionTime: 0 });
  }, []);

  return {
    combo: combo.count,
    multiplier: combo.multiplier,
    addCombo,
    resetCombo,
  };
};

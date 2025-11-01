import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

interface MotivationalMessageProps {
  level: number;
  completedToday: number;
  currentStreak: number;
}

const MOTIVATIONAL_MESSAGES = {
  morning: [
    "Start your day with purpose! 🌅",
    "Every task completed is a step forward! 💪",
    "Make today count! ✨",
    "You've got this! Let's make progress! 🚀",
  ],
  afternoon: [
    "Keep the momentum going! 🔥",
    "You're doing great! Keep pushing! 💫",
    "Halfway there! Don't stop now! ⚡",
    "Your dedication is inspiring! 🌟",
  ],
  evening: [
    "Finish strong! You're almost there! 🎯",
    "End the day on a high note! 🌙",
    "One more push! You can do it! 💪",
    "Make every moment count! ✨",
  ],
  streak: [
    "🔥 Amazing streak! You're unstoppable!",
    "🌟 Consistency is your superpower!",
    "💫 Your dedication is paying off!",
    "⚡ You're building an incredible habit!",
  ],
  completed: [
    "🎉 You're crushing it today!",
    "🏆 Productivity champion!",
    "✨ Look at you go!",
    "🚀 You're on fire!",
  ],
};

export const MotivationalMessage = ({ level, completedToday, currentStreak }: MotivationalMessageProps) => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    generateMessage();
  }, [level, completedToday, currentStreak]);

  const generateMessage = () => {
    const hour = new Date().getHours();
    let messagePool: string[];

    if (currentStreak >= 7) {
      messagePool = MOTIVATIONAL_MESSAGES.streak;
    } else if (completedToday >= 5) {
      messagePool = MOTIVATIONAL_MESSAGES.completed;
    } else if (hour < 12) {
      messagePool = MOTIVATIONAL_MESSAGES.morning;
    } else if (hour < 18) {
      messagePool = MOTIVATIONAL_MESSAGES.afternoon;
    } else {
      messagePool = MOTIVATIONAL_MESSAGES.evening;
    }

    const randomMessage = messagePool[Math.floor(Math.random() * messagePool.length)];
    setMessage(randomMessage);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 border border-primary/30 p-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-primary animate-pulse" />
        <p className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
          {message}
        </p>
      </div>
    </div>
  );
};

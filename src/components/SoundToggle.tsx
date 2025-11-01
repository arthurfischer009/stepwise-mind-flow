import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { setSoundsEnabled, playClick } from "@/lib/sounds";

export const SoundToggle = () => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEnabled');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('soundEnabled', soundEnabled.toString());
    setSoundsEnabled(soundEnabled);
  }, [soundEnabled]);

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    if (newState) {
      playClick();
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleSound}
      className="gap-2"
      title={soundEnabled ? "Mute sounds" : "Enable sounds"}
    >
      {soundEnabled ? (
        <Volume2 className="w-4 h-4" />
      ) : (
        <VolumeX className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">
        {soundEnabled ? "Sounds On" : "Sounds Off"}
      </span>
    </Button>
  );
};

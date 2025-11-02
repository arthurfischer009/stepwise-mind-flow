import { Target, BarChart3, Star, Trophy, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SoundToggle } from "./SoundToggle";
import { LogOut } from "lucide-react";

interface MobileBottomNavProps {
  onCategoriesClick: () => void;
  onAnalyticsClick: () => void;
  onMorningClick: () => void;
  onAchievementsClick: () => void;
  onSignOut: () => void;
}

export const MobileBottomNav = ({
  onCategoriesClick,
  onAnalyticsClick,
  onMorningClick,
  onAchievementsClick,
  onSignOut,
}: MobileBottomNavProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around px-2 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCategoriesClick}
          className="flex flex-col items-center gap-1 h-auto py-2 px-3"
        >
          <Target className="w-5 h-5" />
          <span className="text-xs">Categories</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onAnalyticsClick}
          className="flex flex-col items-center gap-1 h-auto py-2 px-3"
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-xs">Analytics</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onMorningClick}
          className="flex flex-col items-center gap-1 h-auto py-2 px-3"
        >
          <Star className="w-5 h-5" />
          <span className="text-xs">Morning</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onAchievementsClick}
          className="flex flex-col items-center gap-1 h-auto py-2 px-3"
        >
          <Trophy className="w-5 h-5" />
          <span className="text-xs">Awards</span>
        </Button>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center gap-1 h-auto py-2 px-3"
            >
              <Menu className="w-5 h-5" />
              <span className="text-xs">More</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <span className="font-medium">Sound Effects</span>
                <SoundToggle />
              </div>
              <Button
                variant="outline"
                onClick={onSignOut}
                className="w-full gap-2 justify-start"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

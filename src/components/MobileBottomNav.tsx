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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        <Button
          variant="ghost"
          size="touch"
          onClick={onCategoriesClick}
          className="flex flex-col items-center gap-1 h-auto min-h-[56px] py-2 px-4 active:scale-95 transition-transform"
        >
          <Target className="w-6 h-6" />
          <span className="text-xs font-medium">Categories</span>
        </Button>

        <Button
          variant="ghost"
          size="touch"
          onClick={onAnalyticsClick}
          className="flex flex-col items-center gap-1 h-auto min-h-[56px] py-2 px-4 active:scale-95 transition-transform"
        >
          <BarChart3 className="w-6 h-6" />
          <span className="text-xs font-medium">Analytics</span>
        </Button>

        <Button
          variant="ghost"
          size="touch"
          onClick={onMorningClick}
          className="flex flex-col items-center gap-1 h-auto min-h-[56px] py-2 px-4 active:scale-95 transition-transform"
        >
          <Star className="w-6 h-6" />
          <span className="text-xs font-medium">Morning</span>
        </Button>

        <Button
          variant="ghost"
          size="touch"
          onClick={onAchievementsClick}
          className="flex flex-col items-center gap-1 h-auto min-h-[56px] py-2 px-4 active:scale-95 transition-transform"
        >
          <Trophy className="w-6 h-6" />
          <span className="text-xs font-medium">Awards</span>
        </Button>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="touch"
              className="flex flex-col items-center gap-1 h-auto min-h-[56px] py-2 px-4 active:scale-95 transition-transform"
            >
              <Menu className="w-6 h-6" />
              <span className="text-xs font-medium">More</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-3 mt-4 pb-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted min-h-[56px]">
                <span className="font-medium">Sound Effects</span>
                <SoundToggle />
              </div>
              <Button
                variant="outline"
                size="touch"
                onClick={onSignOut}
                className="w-full gap-2 justify-start"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

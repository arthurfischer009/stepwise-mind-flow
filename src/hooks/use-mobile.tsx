import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const getIsMobile = React.useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  }, []);

  // Initialize with the correct value on first render to avoid flicker on mobile
  const [isMobile, setIsMobile] = React.useState<boolean>(getIsMobile);

  React.useEffect(() => {
    const onResize = () => setIsMobile(getIsMobile());
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    // MatchMedia as an additional source of truth
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      mql.removeEventListener("change", onChange);
    };
  }, [getIsMobile]);

  return isMobile;
}

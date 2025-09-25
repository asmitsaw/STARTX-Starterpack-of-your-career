import React, { useEffect, useRef } from "react";

function usePrefersReducedMotion() {
  const [prefers, setPrefers] = React.useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setPrefers(mediaQuery.matches);
    handler();
    mediaQuery.addEventListener?.("change", handler);
    return () => mediaQuery.removeEventListener?.("change", handler);
  }, []);
  return prefers;
}

export function Marquee({ children, reverse = false, pauseOnHover = false, className = "" }) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const duration = getComputedStyle(container).getPropertyValue("--duration") || "20s";
    content.style.setProperty("--duration", duration.trim());
  }, [prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`${className} relative w-full overflow-hidden`}
      style={{
        "--duration": "20s",
      }}
    >
      <div
        ref={contentRef}
        className={`flex gap-4 items-stretch [animation-duration:var(--duration)] ${
          reverse ? "[animation-direction:reverse]" : ""
        } ${pauseOnHover ? "hover:[animation-play-state:paused]" : ""}`}
        style={{
          animationName: "marquee-scroll",
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
        }}
      >
        {children}
        {children}
      </div>

      <style>{`
@keyframes marquee-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
`}</style>
    </div>
  );
}

export default Marquee;



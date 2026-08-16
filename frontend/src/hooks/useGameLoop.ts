import { useEffect, useRef } from "react";

/**
 * Calls `cb(dtMs)` roughly every animation frame while `active` is true.
 * dtMs is clamped so a backgrounded tab / slow frame never fires a huge jump.
 */
export function useGameLoop(active: boolean, cb: (dtMs: number) => void) {
  const cbRef = useRef(cb);
  cbRef.current = cb;

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = Date.now();
    let mounted = true;

    const loop = () => {
      if (!mounted) return;
      const now = Date.now();
      const dt = Math.min(now - last, 48); // clamp to ~3 frames
      last = now;
      cbRef.current(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
    };
  }, [active]);
}

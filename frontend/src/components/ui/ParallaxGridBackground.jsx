import { useEffect, useRef } from 'react';

export default function ParallaxGridBackground() {
  const backgroundRef = useRef(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches) return undefined;

    let animationFrame = 0;
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;

    const updateBackground = () => {
      animationFrame = 0;
      if (!backgroundRef.current) return;

      const horizontalOffset = (pointerX - window.innerWidth / 2) * 0.008;
      const pointerOffset = (pointerY - window.innerHeight / 2) * 0.008;
      const scrollOffset = -Math.min(window.scrollY, 1200) * 0.035;
      backgroundRef.current.style.transform =
        `translate3d(${horizontalOffset}px, ${pointerOffset + scrollOffset}px, 0)`;
    };

    const scheduleUpdate = () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(updateBackground);
      }
    };

    const handlePointerMove = (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      scheduleUpdate();
    };

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    scheduleUpdate();

    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('pointermove', handlePointerMove);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return <div ref={backgroundRef} className="parallax-grid-background" aria-hidden="true" />;
}

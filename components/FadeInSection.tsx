"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Wrapper qui rend son contenu invisible jusqu'à ce qu'il entre dans le
 * viewport (IntersectionObserver). Le mount-guard évite tout flash SSR :
 * avant hydratation l'élément est rendu normalement (visible), puis JS
 * prend la main et gère l'animation.
 */
export function FadeInSection({ children, className = "", delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={
        mounted
          ? {
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0px)" : "translateY(28px)",
              transition: `opacity 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

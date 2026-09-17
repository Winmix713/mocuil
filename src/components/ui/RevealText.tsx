import { useEffect, useRef, useState } from 'react';

type RevealTextProps = {
  children: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p';
  delay?: number;
};

export function RevealText({ children, className = '', as: Tag = 'h2', delay = 0 }: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => setVisible(true), delay * 1000);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const words = children.trim().split(/\s+/);

  return (
    <Tag
      ref={ref as React.RefObject<any>}
      className={className}
      aria-label={children}
    >
      {words.map((word, i) => (
        <span key={i} className="text-reveal-mask" style={{ animationDelay: `${(i * 0.09 + delay) * 1000}ms` }}>
          <span
            className="text-reveal-inner"
            style={{
              animationPlayState: visible ? 'running' : 'paused',
              animationDelay: `${(i * 0.09 + delay) * 1000}ms`,
            }}
          >
            {word}
          </span>
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </Tag>
  );
}

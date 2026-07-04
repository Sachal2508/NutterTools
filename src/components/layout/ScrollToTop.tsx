import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      // Calculate scroll progress percentage (0 to 100)
      if (docHeight > 0) {
        setScrollProgress((scrollTop / docHeight) * 100);
      } else {
        setScrollProgress(0);
      }

      // Show button after scrolling down 250px
      setVisible(scrollTop > 250);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Trigger once on mount to handle initial load/refresh scroll state
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // SVG parameters for circular progress
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-surface border border-border shadow-lg
        flex items-center justify-center transition-all duration-300 btn-press focus:outline-none focus:ring-2 focus:ring-accent/40
        ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-75 pointer-events-none'}`}
    >
      {/* Circular Progress Ring */}
      <svg className="absolute w-full h-full -rotate-90 transform" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={radius}
          className="stroke-border/40 fill-none"
          strokeWidth="2.5"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          className="stroke-accent fill-none transition-all duration-75"
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>

      {/* Arrow Icon */}
      <ArrowUp size={16} className="text-ink hover:text-accent transition-colors relative z-10" />
    </button>
  );
};

export default ScrollToTop;

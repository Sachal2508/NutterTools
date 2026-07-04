import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQ {
  q: string;
  a: string;
}

interface FAQBlockProps {
  faqs: FAQ[];
}

export const FAQBlock: React.FC<FAQBlockProps> = ({ faqs }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="w-full pt-2 font-sans">
      <h2 className="flex items-center gap-2 font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-4">
        <HelpCircle size={13} className="text-accent" />
        Frequently Asked Questions
      </h2>

      <div className="flex flex-col gap-2">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                isOpen ? 'border-accent/40 bg-surface shadow-card' : 'border-border bg-surface hover:border-border-strong'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left focus:outline-none group"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-semibold text-ink leading-snug">{faq.q}</span>
                <ChevronDown
                  size={16}
                  className={`text-ink-muted shrink-0 transition-transform duration-250 ${isOpen ? 'rotate-180 text-accent' : ''}`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-4 pt-0 text-sm text-ink-muted leading-relaxed border-t border-border/50 animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FAQBlock;

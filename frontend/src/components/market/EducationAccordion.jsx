import { useState, useEffect } from 'react';
import { ChevronDown, Lightbulb } from 'lucide-react';
import { api } from '../../utils/api';

function AccordionItem({ card, isOpen, onToggle }) {
  const categoryColor = {
    'Timing': 'bg-accent/10 text-accent',
    'Execution': 'bg-amber/10 text-amber',
    'Analysis': 'bg-purple-500/10 text-purple-400',
    'Fundamentals': 'bg-blue-500/10 text-blue-400',
    'Events': 'bg-orange-500/10 text-orange-400',
    'Risk Management': 'bg-danger/10 text-danger',
  };

  return (
    <div className="card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className={`text-xs font-medium px-3 py-1 rounded-lg ${categoryColor[card.category] || 'bg-white/[0.04] text-text-secondary'}`}>
            {card.category}
          </span>
          <h4 className="text-base font-medium text-text-primary">{card.title}</h4>
        </div>
        <ChevronDown className={`w-5 h-5 text-text-muted shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {!isOpen && (
        <div className="px-6 pb-5 -mt-1">
          <p className="text-sm text-text-secondary leading-relaxed ml-[calc(3rem+1rem)]">{card.summary}</p>
        </div>
      )}

      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-7 border-t border-border pt-6">
          <p className="text-sm text-text-secondary mb-4 italic">{card.summary}</p>
          <p className="text-[15px] text-text-primary leading-[1.8] whitespace-pre-line">{card.details}</p>
        </div>
      </div>
    </div>
  );
}

export default function EducationAccordion() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    api.getEducation()
      .then(setCards)
      .catch((e) => console.error('Failed to load education:', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-7">
            <div className="h-5 shimmer rounded-lg w-3/4" />
            <div className="h-4 shimmer rounded-lg w-full mt-4" />
          </div>
        ))}
      </div>
    );
  }

  const tipIndex = new Date().getDate() % Math.max(cards.length, 1);
  const tipCard = cards[tipIndex];

  return (
    <div>
      {tipCard && (
        <div className="relative overflow-hidden rounded-lg border border-electric/10 bg-gradient-to-r from-electric/[0.06] to-transparent p-7 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-accent font-medium mb-2">Tip of the Day</p>
              <p className="text-base font-medium text-text-primary mb-2">{tipCard.title}</p>
              <p className="text-sm text-text-secondary leading-relaxed">{tipCard.summary}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {cards.map((card) => (
          <AccordionItem
            key={card.id}
            card={card}
            isOpen={openId === card.id}
            onToggle={() => setOpenId(openId === card.id ? null : card.id)}
          />
        ))}
      </div>
    </div>
  );
}

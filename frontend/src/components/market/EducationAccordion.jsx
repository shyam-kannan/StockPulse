import { useState, useEffect } from 'react';
import { ChevronDown, BookOpen, Lightbulb } from 'lucide-react';
import { api } from '../../utils/api';

function AccordionItem({ card, isOpen, onToggle }) {
  const categoryColor = {
    'Timing': 'bg-electric/10 text-electric',
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
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-lg ${categoryColor[card.category] || 'bg-white/[0.04] text-text-secondary'}`}>
            {card.category}
          </span>
          <h4 className="text-sm font-medium text-text-primary">{card.title}</h4>
        </div>
        <ChevronDown className={`w-4 h-4 text-text-muted shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {!isOpen && (
        <div className="px-4 pb-3 -mt-1">
          <p className="text-xs text-text-secondary leading-relaxed">{card.summary}</p>
        </div>
      )}

      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-5 border-t border-border pt-4">
          <p className="text-xs text-text-secondary mb-3 italic">{card.summary}</p>
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">{card.details}</p>
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
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 mb-5">
          <BookOpen className="w-5 h-5 text-electric" />
          <h3 className="text-lg font-semibold text-text-primary">Learn the Basics</h3>
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5">
            <div className="h-4 shimmer rounded-lg w-3/4" />
            <div className="h-3 shimmer rounded-lg w-full mt-3" />
          </div>
        ))}
      </div>
    );
  }

  const tipIndex = new Date().getDate() % cards.length;
  const tipCard = cards[tipIndex];

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-5">
        <BookOpen className="w-5 h-5 text-electric" />
        <h3 className="text-lg font-semibold text-text-primary">Learn the Basics</h3>
      </div>

      {tipCard && (
        <div className="relative overflow-hidden rounded-2xl border border-electric/10 bg-gradient-to-r from-electric/[0.06] to-transparent p-5 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-electric/15 flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4 text-electric" />
            </div>
            <div>
              <p className="text-xs text-electric font-medium mb-1">Tip of the Day</p>
              <p className="text-sm font-medium text-text-primary mb-1">{tipCard.title}</p>
              <p className="text-xs text-text-secondary leading-relaxed">{tipCard.summary}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2.5">
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

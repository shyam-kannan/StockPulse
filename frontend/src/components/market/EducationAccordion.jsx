import { useState, useEffect } from 'react';
import { ChevronDown, BookOpen } from 'lucide-react';
import { api } from '../../utils/api';

function AccordionItem({ card, isOpen, onToggle }) {
  const categoryColor = {
    'Timing': 'bg-electric/10 text-electric',
    'Execution': 'bg-amber/10 text-amber',
    'Analysis': 'bg-purple-900/50 text-purple-300',
    'Fundamentals': 'bg-blue-900/50 text-blue-300',
    'Events': 'bg-orange-900/50 text-orange-300',
    'Risk Management': 'bg-danger/10 text-danger',
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-navy-800">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-navy-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${categoryColor[card.category] || 'bg-navy-700 text-text-secondary'}`}>
            {card.category}
          </span>
          <h4 className="text-sm font-medium text-text-primary">{card.title}</h4>
        </div>
        <ChevronDown className={`w-4 h-4 text-text-muted shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {!isOpen && (
        <div className="px-4 pb-3 -mt-1">
          <p className="text-xs text-text-secondary">{card.summary}</p>
        </div>
      )}

      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 border-t border-border/50 pt-3">
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
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-electric" />
          <h3 className="text-lg font-semibold text-text-primary">Learn the Basics</h3>
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-navy-800 border border-border rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-navy-700 rounded w-3/4" />
            <div className="h-3 bg-navy-700 rounded w-full mt-2" />
          </div>
        ))}
      </div>
    );
  }

  // Tip of the day
  const tipIndex = new Date().getDate() % cards.length;
  const tipCard = cards[tipIndex];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-electric" />
        <h3 className="text-lg font-semibold text-text-primary">Learn the Basics</h3>
      </div>

      {/* Tip of the Day */}
      {tipCard && (
        <div className="bg-electric/5 border border-electric/20 rounded-xl p-4 mb-4">
          <p className="text-xs text-electric font-medium mb-1">Tip of the Day</p>
          <p className="text-sm font-medium text-text-primary mb-1">{tipCard.title}</p>
          <p className="text-xs text-text-secondary">{tipCard.summary}</p>
        </div>
      )}

      <div className="space-y-2">
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

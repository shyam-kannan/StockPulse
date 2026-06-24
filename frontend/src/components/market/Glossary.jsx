import { useState } from 'react';
import { Search } from 'lucide-react';

const glossaryTerms = [
  { term: 'Bullish', definition: 'A positive outlook on a stock or the market. A bullish investor expects prices to rise. "I\'m bullish on NVDA" means the person believes NVDA will go up.' },
  { term: 'Bearish', definition: 'A negative outlook on a stock or the market. A bearish investor expects prices to fall. Bear markets are defined as a 20%+ decline from recent highs.' },
  { term: 'Bull Market', definition: 'A prolonged period where stock prices are rising or expected to rise, typically defined as a 20%+ gain from a recent low. The current bull market began in October 2022.' },
  { term: 'Bear Market', definition: 'A prolonged period where stock prices are falling, typically defined as a 20%+ decline from a recent high. Bear markets can last months to years.' },
  { term: 'DD (Due Diligence)', definition: 'Research and analysis done before making an investment. On Reddit, "DD" posts are deep dives into why a stock is a good or bad investment.' },
  { term: 'HODL', definition: 'Originally a typo for "hold," now means holding onto a position through volatility instead of selling. Common in crypto and meme stock communities.' },
  { term: 'Diamond Hands', definition: 'An investor who holds through extreme volatility without selling. The opposite of "paper hands" (someone who sells at the first sign of a dip).' },
  { term: 'Paper Hands', definition: 'An investor who sells their position at the first sign of a price drop. Opposite of diamond hands. Often used as an insult on Reddit forums.' },
  { term: 'Short Squeeze', definition: 'When a heavily shorted stock rises sharply, forcing short sellers to buy shares to cover their positions, which pushes the price even higher. GameStop (GME) in 2021 was the most famous example.' },
  { term: 'Short Selling', definition: 'Borrowing shares and selling them, hoping to buy them back cheaper later. If the stock drops, you profit. If it rises, your losses are theoretically unlimited.' },
  { term: 'Short Interest', definition: 'The percentage of a company\'s shares that are currently sold short. High short interest (>20%) can signal potential for a short squeeze.' },
  { term: 'P/E Ratio', definition: 'Price-to-Earnings ratio. Divides the stock price by earnings per share. A P/E of 20 means investors pay $20 for every $1 of annual earnings. Lower P/E may indicate undervaluation; higher may indicate growth expectations.' },
  { term: 'Forward P/E', definition: 'P/E ratio calculated using estimated future earnings instead of trailing earnings. Useful for comparing growth companies whose earnings are expected to increase significantly.' },
  { term: 'EPS (Earnings Per Share)', definition: 'A company\'s total profit divided by its number of outstanding shares. Higher EPS generally means the company is more profitable on a per-share basis.' },
  { term: 'Market Cap', definition: 'The total value of a company\'s outstanding shares (price × shares). Categories: Mega-cap ($200B+), Large-cap ($10B-$200B), Mid-cap ($2B-$10B), Small-cap ($300M-$2B), Micro-cap (<$300M).' },
  { term: 'ETF', definition: 'Exchange-Traded Fund. A basket of stocks that trades like a single stock. SPY tracks the S&P 500, QQQ tracks the Nasdaq-100, and SMH tracks semiconductors.' },
  { term: 'Dividend', definition: 'A portion of a company\'s profits paid to shareholders, usually quarterly. Dividend yield is the annual dividend divided by the stock price (e.g., 2% yield).' },
  { term: 'Volatility', definition: 'How much a stock\'s price fluctuates. High volatility means bigger price swings. The VIX index measures expected market volatility — above 20 is considered elevated.' },
  { term: 'Support Level', definition: 'A price level where a stock tends to stop falling and bounce back up, because buyers step in. If a stock "breaks" support, it may fall further.' },
  { term: 'Resistance Level', definition: 'A price level where a stock tends to stop rising and pull back, because sellers step in. Breaking above resistance is considered a bullish signal.' },
  { term: 'Volume', definition: 'The number of shares traded during a given period. High volume confirms price movements. Low volume moves are less reliable. Average volume is the 30-day average.' },
  { term: 'Momentum', definition: 'The rate at which a stock\'s price is accelerating. Momentum investors buy stocks that are trending up and sell those trending down. "The trend is your friend."' },
  { term: 'RSI (Relative Strength Index)', definition: 'A momentum indicator from 0-100. Above 70 = potentially overbought (may pull back). Below 30 = potentially oversold (may bounce). Most useful when combined with other signals.' },
  { term: 'MACD', definition: 'Moving Average Convergence Divergence. A trend-following indicator that shows the relationship between two moving averages. A MACD crossover can signal a buy or sell.' },
  { term: 'Moving Average', definition: 'The average price over a period (e.g., 50-day or 200-day). When the 50-day crosses above the 200-day, it\'s a "golden cross" (bullish). The reverse is a "death cross" (bearish).' },
  { term: 'Options', definition: 'Contracts giving the right (not obligation) to buy or sell a stock at a set price by a set date. Calls profit when stocks go up. Puts profit when stocks go down.' },
  { term: 'Call Option', definition: 'The right to BUY a stock at a specific price (strike price) before expiration. You buy calls when you think a stock will go up. Max loss is the premium paid.' },
  { term: 'Put Option', definition: 'The right to SELL a stock at a specific price (strike price) before expiration. You buy puts when you think a stock will go down. Acts like insurance.' },
  { term: 'IV (Implied Volatility)', definition: 'The market\'s expectation of how much a stock will move, priced into options. High IV = expensive options. IV tends to spike before earnings and drop after ("IV crush").' },
  { term: 'Bag Holder', definition: 'An investor left holding a stock that has dropped significantly from their purchase price. "Don\'t be a bag holder" means take losses early rather than holding a losing position indefinitely.' },
  { term: 'FOMO', definition: 'Fear Of Missing Out. The anxiety of watching a stock rally without being in it, often leading to buying at the top. One of the most common emotional mistakes in investing.' },
  { term: 'FUD', definition: 'Fear, Uncertainty, and Doubt. Negative sentiment or misinformation spread about a stock, sometimes deliberately to drive the price down.' },
  { term: 'Dip', definition: 'A temporary decline in a stock\'s price. "Buying the dip" means purchasing after a pullback, betting the price will recover. Not every dip is a buying opportunity.' },
  { term: 'Rally', definition: 'A sustained increase in stock prices. Can last days, weeks, or months. A "relief rally" occurs after a period of selling pressure.' },
  { term: 'Correction', definition: 'A decline of 10-20% from recent highs. Corrections are normal and healthy — the market historically has one every 1-2 years. Not the same as a bear market.' },
  { term: 'Penny Stock', definition: 'Stocks trading under $5 per share, often from small or speculative companies. Higher risk of fraud and manipulation. Popular on Reddit forums like r/pennystocks.' },
  { term: 'Blue Chip', definition: 'Large, well-established companies with a history of stable earnings and dividends. Examples: Apple, Microsoft, Johnson & Johnson. Considered safer, lower-risk investments.' },
  { term: 'Sector Rotation', definition: 'When investors move money from one sector to another based on economic cycles. E.g., moving from tech to energy during inflation, or from cyclicals to defensives during slowdowns.' },
  { term: 'Hedge', definition: 'An investment made to reduce risk. E.g., buying puts on a stock you own to protect against downside. Professional investors hedge to manage portfolio risk.' },
  { term: 'Catalyst', definition: 'An event that causes a significant price move. Examples: earnings reports, FDA approvals, management changes, analyst upgrades, or macro events like Fed decisions.' },
  { term: 'Float', definition: 'The number of shares available for public trading. Low float stocks (<10M shares) can be extremely volatile because a small amount of buying can move the price dramatically.' },
  { term: 'Gap Up / Gap Down', definition: 'When a stock opens significantly higher (gap up) or lower (gap down) than the previous close, usually due to after-hours news. Gaps often get "filled" — the price returns to close the gap.' },
  { term: 'After Hours / Pre-Market', definition: 'Trading sessions outside regular market hours (9:30 AM - 4:00 PM ET). Pre-market is 4-9:30 AM, after hours is 4-8 PM. Lower volume means wider spreads and more volatility.' },
  { term: 'Spread', definition: 'The difference between the bid (what buyers will pay) and the ask (what sellers want). Tight spreads indicate high liquidity. Wide spreads mean lower liquidity and higher trading costs.' },
];

export default function Glossary() {
  const [search, setSearch] = useState('');

  const filtered = glossaryTerms.filter(
    (item) =>
      item.term.toLowerCase().includes(search.toLowerCase()) ||
      item.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Search */}
      <div className="relative max-w-lg mx-auto mb-10">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search terms..."
          className="w-full pl-14 pr-6 py-4 bg-white/[0.03] border border-border rounded-lg text-base text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent/25 transition-colors"
        />
      </div>

      {/* Terms grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
        {filtered.map((item) => (
          <div
            key={item.term}
            className="card p-7 hover:border-accent/15 transition-colors"
          >
            <h4 className="text-base font-semibold text-accent mb-3 tracking-tight">
              {item.term}
            </h4>
            <p className="text-[15px] text-text-secondary leading-[1.8]">
              {item.definition}
            </p>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-text-muted text-lg">No terms match "{search}"</p>
        </div>
      )}
    </div>
  );
}

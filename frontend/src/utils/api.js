const BASE_URL = import.meta.env.VITE_API_URL || '';

async function fetchApi(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getTrending: () => fetchApi('/api/trending'),
  getStock: (ticker) => fetchApi(`/api/stock/${encodeURIComponent(ticker)}`),
  getFeed: () => fetchApi('/api/feed'),
  getMarketStatus: () => fetchApi('/api/market-status'),
  getEducation: () => fetchApi('/api/education'),
  getDailyBriefing: () => fetchApi('/api/daily-briefing'),
  getRedditActivity: () => fetchApi('/api/reddit-activity'),
  searchTickers: (q) => fetchApi(`/api/tickers/search?q=${encodeURIComponent(q)}`),
  triggerScrape: () => fetchApi('/api/scrape', { method: 'POST' }),
};

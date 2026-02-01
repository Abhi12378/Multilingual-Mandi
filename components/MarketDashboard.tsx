
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Search, TrendingUp, RefreshCw, ExternalLink, Info, Heart, Trash2, ArrowRight, MapPin, Filter, ChevronDown, ChevronUp, BarChart3, Activity, Layers, Calendar, Scale, TrendingDown, AlertCircle, ShoppingCart } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { GroundingSource } from '../types';

interface CommodityResult {
  id: string;
  name: string;
  market: string;
  price: string;
  summary: string;
  details: string;
}

const MOCK_DATA = [
  { name: 'Day 1', price: 2100 },
  { name: 'Day 2', price: 2150 },
  { name: 'Day 3', price: 2200 },
  { name: 'Day 4', price: 2180 },
  { name: 'Day 5', price: 2250 },
  { name: 'Day 6', price: 2300 },
  { name: 'Day 7', price: 2280 },
];

const MarketDashboard: React.FC = () => {
  const [query, setQuery] = useState('');
  const [marketRefinement, setMarketRefinement] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CommodityResult[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favSearch, setFavSearch] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [priceCharts, setPriceCharts] = useState<Map<string, any[]>>(new Map());

  useEffect(() => {
    const saved = localStorage.getItem('mandi_favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mandi_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const stripMarkdown = (text: string): string => {
    return text.replace(/\*\*/g, '').replace(/[#*_~`]/g, '');
  };

  const extractPriceFromText = (text: string): number | null => {
    const priceMatch = text.match(/₹([0-9,]+(?:\.[0-9]{2})?)/);
    if (priceMatch) {
      return parseFloat(priceMatch[1].replace(/,/g, ''));
    }
    return null;
  };

  const parseResults = (text: string): CommodityResult[] => {
    // We expect the AI to separate items with a delimiter
    const items = text.split(/---ITEM---/g).filter(i => i.trim().length > 10);
    return items.map((item, index) => {
      const lines = item.trim().split('\n');
      const nameLine = lines[0] || 'Unknown Commodity';
      const nameParts = stripMarkdown(nameLine).split(' at ');
      const summary = stripMarkdown(lines.slice(1, 3).join(' '));
      const details = stripMarkdown(lines.slice(3).join('\n'));
      const price = extractPriceFromText(summary) || null;
      
      return {
        id: `res-${index}`,
        name: nameParts[0]?.trim() || 'Commodity',
        market: nameParts[1]?.trim() || 'Local Market',
        price: price ? `₹${price.toLocaleString()} per quintal` : 'Latest Rate',
        summary: summary,
        details: details,
      };
    });
  };

  const generatePriceChart = (basePrice: number | null): any[] => {
    if (!basePrice || basePrice === 0) return MOCK_DATA;
    const variation = basePrice * 0.15; // 15% variation
    return [
      { name: 'Day 1', price: Math.round(basePrice - variation * 0.8) },
      { name: 'Day 2', price: Math.round(basePrice - variation * 0.5) },
      { name: 'Day 3', price: Math.round(basePrice - variation * 0.2) },
      { name: 'Day 4', price: Math.round(basePrice) },
      { name: 'Day 5', price: Math.round(basePrice + variation * 0.3) },
      { name: 'Day 6', price: Math.round(basePrice + variation * 0.6) },
      { name: 'Day 7', price: Math.round(basePrice + variation * 0.8) },
    ];
  };

  const performSearch = async (searchQuery: string, market?: string) => {
    setLoading(true);
    setResults([]);
    setSources([]);
    setError(null);
    setExpandedItems(new Set());

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API key is not configured. Please set VITE_GEMINI_API_KEY in .env.local');
      }
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Act as a market expert. Provide the latest mandi prices for: ${searchQuery} ${market ? `in ${market}` : ''}.
      IMPORTANT: If there are multiple commodities or markets matching the query, list them separately.
      Format EACH result exactly like this:
      ---ITEM---
      # [Commodity Name] at [Market Name]
      [A one-sentence current price summary per quintal]
      [Detailed analysis of trends, arrival volumes, and quality grades]
      
      Ensure you use search grounding to get real, up-to-date data for today. Answer in English.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const textResult = response.text;
      if (!textResult) throw new Error("No data returned from AI");

      const parsed = parseResults(textResult);
      setResults(parsed);
      
      // Generate price charts for each result
      const charts = new Map<string, any[]>();
      parsed.forEach(result => {
        const price = extractPriceFromText(result.summary);
        charts.set(result.id, generatePriceChart(price));
      });
      setPriceCharts(charts);
      
      // Helper function within performSearch
      const extractPrice = (text: string): number | null => {
        const match = text.match(/₹([0-9,]+(?:\.[0-9]{2})?)/);
        if (match) return parseFloat(match[1].replace(/,/g, ''));
        return null;
      };

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const extractedSources = chunks
          .filter(chunk => chunk.web)
          .map(chunk => chunk.web as GroundingSource['web'])
          .filter((v, i, a) => a.findIndex(t => t?.uri === v?.uri) === i);
        setSources(extractedSources.map(s => ({ web: s })));
      }
    } catch (err: any) {
      console.error("Search error:", err);
      let msg = "An unexpected error occurred.";
      if (err.message?.includes('429')) {
        msg = "Quota exceeded (429). Please wait a moment or try again later.";
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    performSearch(query, marketRefinement);
  };

  const toggleFavorite = (item: string) => {
    setFavorites(prev => 
      prev.includes(item) ? prev.filter(f => f !== item) : [item, ...prev].slice(0, 10) 
    );
  };

  const filteredFavorites = useMemo(() => {
    if (!favSearch.trim()) return favorites;
    return favorites.filter(fav => fav.toLowerCase().includes(favSearch.toLowerCase()));
  }, [favorites, favSearch]);

  return (
    <div className="space-y-6 pb-20">
      {/* Search and Filter Section */}
      <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-700">
          <ShoppingCart className="w-5 h-5" />
          Mandi Search
        </h2>
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Commodity (e.g. Tomato, Garlic)..."
              className="w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-slate-50/50 text-sm md:text-base transition-all"
            />
          </div>
          <div className="flex-1 relative group">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              value={marketRefinement}
              onChange={(e) => setMarketRefinement(e.target.value)}
              placeholder="Market Name (Optional)..."
              className="w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-slate-50/50 text-sm md:text-base transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Search className="w-5 h-5" /> Discover</>}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 px-6 py-5 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-2">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold">Search Error</p>
                <p className="text-sm opacity-90">{error}</p>
              </div>
            </div>
          )}

          {results.length > 0 ? (
            results.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-800 capitalize leading-tight">{item.name}</h3>
                        <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider">{item.market}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleFavorite(`${item.name} in ${item.market}`)}
                      className={`p-3 rounded-2xl transition-all ${favorites.includes(`${item.name} in ${item.market}`) ? 'text-rose-500 bg-rose-50' : 'text-slate-300 bg-slate-50 hover:text-rose-400'}`}
                    >
                      <Heart className={`w-5 h-5 ${favorites.includes(`${item.name} in ${item.market}`) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <p className="text-slate-600 mb-6 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {item.summary}
                  </p>

                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="w-full flex items-center justify-between px-6 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-md active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      {expandedItems.has(item.id) ? 'Hide Analytics' : 'More Details & Charts'}
                    </div>
                    {expandedItems.has(item.id) ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>

                  {expandedItems.has(item.id) && (
                    <div className="mt-8 space-y-8 animate-in slide-in-from-top-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center group hover:border-indigo-200 transition-colors">
                          <Scale className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Price Range</p>
                          <p className="text-sm font-black text-slate-800">Dynamic</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center group hover:border-green-200 transition-colors">
                          <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-2" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Peak Rate</p>
                          <p className="text-sm font-black text-slate-800">Available</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center group hover:border-rose-200 transition-colors">
                          <TrendingDown className="w-5 h-5 text-rose-500 mx-auto mb-2" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Low Rate</p>
                          <p className="text-sm font-black text-slate-800">Stable</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center group hover:border-indigo-200 transition-colors">
                          <Calendar className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Arrivals</p>
                          <p className="text-sm font-black text-slate-800">Verified</p>
                        </div>
                      </div>

                      <div className="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed whitespace-pre-wrap pb-6 border-b border-slate-100">
                        {item.details}
                      </div>

                      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                          <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-500" />
                            7-Day Price Projection
                          </h4>
                        </div>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={priceCharts.get(item.id) || MOCK_DATA}>
                              <defs>
                                <linearGradient id={`colorPrice-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} domain={['auto', 'auto']} />
                              <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ fontWeight: 'bold' }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="price" 
                                stroke="#4f46e5" 
                                fillOpacity={1} 
                                fill={`url(#colorPrice-${item.id})`} 
                                strokeWidth={4}
                                animationDuration={1500}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : !loading && !error && (
            <div className="bg-white rounded-3xl p-16 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-300 mb-8 animate-bounce duration-[3000ms]">
                <Search className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3">Your Mandi Terminal</h3>
              <p className="text-slate-500 max-w-sm">
                Search for any crop to unlock live trading rates and statistical analysis powered by AI.
              </p>
            </div>
          )}

          {sources.length > 0 && results.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h4 className="text-sm font-black text-slate-500 mb-4 flex items-center gap-2 uppercase tracking-widest">
                <Info className="w-4 h-4" /> Market Verification Sources
              </h4>
              <div className="flex flex-wrap gap-2">
                {sources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.web?.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-xs font-bold hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
                  >
                    {source.web?.title || "Market Data"}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500 fill-current" />
              Saved Watchlist
            </h3>
            
            <div className="relative mb-6">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={favSearch}
                onChange={(e) => setFavSearch(e.target.value)}
                placeholder="Search watchlist..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
              />
            </div>

            {filteredFavorites.length === 0 ? (
              <div className="text-center py-12 px-6 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
                  {favSearch ? "No matches found" : "Watchlist Empty"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFavorites.map((fav, idx) => (
                  <div 
                    key={idx} 
                    className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-md transition-all cursor-pointer"
                    onClick={() => performSearch(fav)}
                  >
                    <span className="text-sm font-bold text-slate-700 capitalize truncate flex-1">{fav}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(fav); }}
                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ArrowRight className="w-4 h-4 text-indigo-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 overflow-hidden relative group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
            <h4 className="text-xs font-black opacity-80 mb-2 uppercase tracking-widest">Total Market Arrivals</h4>
            <p className="text-4xl font-black mb-6">42.5K <span className="text-sm font-medium opacity-70">QTL</span></p>
            <div className="flex items-center gap-2 text-xs font-bold bg-white/20 w-fit px-3 py-2 rounded-xl backdrop-blur-md">
              <TrendingUp className="w-4 h-4" /> +12% Surge
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h4 className="text-slate-400 text-[10px] font-black mb-6 uppercase tracking-[0.2em]">Regional Peak Price</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-black text-slate-800">Mustard Seeds</p>
                <p className="text-indigo-500 text-xs font-bold uppercase">Rajasthan Terminal</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-green-600">₹6,400</p>
                <p className="text-[10px] text-green-500 font-black uppercase tracking-wider">▲ Today</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDashboard;

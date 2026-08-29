import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  Sparkles,
  Zap,
  Tag,
  MapPin,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  HardHat,
  Truck,
  Car,
  Phone,
  MessageSquare,
  Building2,
  CheckCircle2,
  Eye,
  ArrowUpDown,
  History,
  TrendingUp,
  Hash,
  ShieldCheck,
  RotateCcw,
  Layers,
  ArrowRight,
  Trash2,
  Heart
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  executeSearchEngine,
  POPULAR_SEARCH_TERMS,
  POPULAR_MAKES,
  SearchResultItem,
  SearchOptions
} from '../lib/searchEngine';
import { InventoryItem, CategoryType, PartCondition, SAProvince } from '../types';
import { PROVINCES_LIST, SUBCATEGORIES } from '../data/initialData';
import { CATEGORY_VISUALS } from '../data/categoryImages';
import { ListingDetailModal } from './ListingDetailModal';
import { generateWhatsappInquiryUrl } from '../lib/whatsapp';
import { SellerContactModal } from './SellerContactModal';

interface SearchEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onOpenSellerPortal?: () => void;
}

export const SearchEngineModal: React.FC<SearchEngineModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  onOpenSellerPortal
}) => {
  const { inventory, sellers, setFilter, isOwnerAdminLoggedIn, deleteInventoryItem, favorites, isFavorite, toggleFavorite } = useApp();

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<SAProvince | 'all'>('all');
  const [selectedCondition, setSelectedCondition] = useState<PartCondition | 'all'>('all');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [onlyWithPartNumber, setOnlyWithPartNumber] = useState<boolean>(false);
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [expandSynonyms, setExpandSynonyms] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<SearchOptions['sortBy']>('relevance');
  const [itemPendingDeleteId, setItemPendingDeleteId] = useState<string | null>(null);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('partsmart_recent_searches');
      return saved ? JSON.parse(saved) : ['CAT 320D Pump', 'Scania R500 Gearbox', 'Hilux GD-6 Engine'];
    } catch {
      return ['CAT 320D Pump', 'Scania R500 Gearbox', 'Hilux GD-6 Engine'];
    }
  });

  const [selectedItemForDetail, setSelectedItemForDetail] = useState<InventoryItem | null>(null);
  const [contactItem, setContactItem] = useState<InventoryItem | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initial query when opened
  useEffect(() => {
    if (isOpen) {
      if (initialQuery) setQuery(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialQuery]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Execute Search Engine algorithm with live ranking
  const searchResults: SearchResultItem[] = useMemo(() => {
    return executeSearchEngine(inventory, {
      query,
      category: selectedCategory,
      subcategory: selectedSubcategory,
      condition: selectedCondition,
      province: selectedProvince,
      make: selectedMake,
      minPrice,
      maxPrice,
      onlyWithPartNumber,
      onlyFavorites,
      favoriteIds: favorites,
      sortBy,
      expandSynonyms
    });
  }, [
    inventory,
    query,
    selectedCategory,
    selectedSubcategory,
    selectedCondition,
    selectedProvince,
    selectedMake,
    minPrice,
    maxPrice,
    onlyWithPartNumber,
    onlyFavorites,
    favorites,
    sortBy,
    expandSynonyms
  ]);

  // Add query to recent searches
  const handleSelectQuery = (term: string) => {
    setQuery(term);
    setRecentSearches(prev => {
      const updated = [term, ...prev.filter(t => t.toLowerCase() !== term.toLowerCase())].slice(0, 6);
      try {
        localStorage.setItem('partsmart_recent_searches', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleApplyToMainFeed = () => {
    setFilter({
      searchQuery: query,
      category: selectedCategory,
      subcategory: selectedSubcategory,
      condition: selectedCondition,
      province: selectedProvince,
      make: selectedMake
    });
    onClose();
  };

  const handleResetFilters = () => {
    setQuery('');
    setSelectedCategory('all');
    setSelectedSubcategory('All');
    setSelectedMake('');
    setSelectedProvince('all');
    setSelectedCondition('all');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setOnlyWithPartNumber(false);
    setSortBy('relevance');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const highlightText = (text: string, highlightQuery: string) => {
    if (!highlightQuery.trim()) return text;
    const parts = text.split(new RegExp(`(${highlightQuery.replace(/[^a-zA-Z0-9]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === highlightQuery.toLowerCase() ? (
            <span key={i} className="text-amber-400 font-extrabold bg-amber-500/20 px-1 rounded">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl text-white overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Search Engine Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 backdrop-blur space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                <Search className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>Part-Smart Smart Search Engine</span>
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Heavy Duty Algorithm
                  </span>
                </h2>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Multi-field indexing • OEM Part # Cross-matching • Automotive Synonyms • Province Geo-routing
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApplyToMainFeed}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                title="Apply these search filters to the main inventory page"
              >
                <span>Apply to Main Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
                title="Close Search Engine (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Primary Search Bar Input with Synonyms Toggle */}
          <div className="relative">
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-950 rounded-2xl border-2 border-amber-500/50 focus-within:border-amber-400 shadow-inner">
              <Search className="w-5 h-5 text-amber-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any part, OEM #, equipment make, model, or description (e.g. 'CAT 320D pump', 'diff', 'Hilux GD-6')..."
                className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 text-slate-400 hover:text-white rounded-full bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Helper Badges under search */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-300 hover:text-amber-400">
                  <input
                    type="checkbox"
                    checked={expandSynonyms}
                    onChange={(e) => setExpandSynonyms(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Auto-expand Synonyms (diff, gearbox, bakkie, hyd)
                  </span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-300 hover:text-amber-400">
                  <input
                    type="checkbox"
                    checked={onlyWithPartNumber}
                    onChange={(e) => setOnlyWithPartNumber(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3 text-amber-400" />
                    OEM Part # Only
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                    showAdvancedFilters
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  <SlidersHorizontal className="w-3 h-3 text-amber-400" />
                  <span>{showAdvancedFilters ? 'Hide Advanced Filters' : 'More Filters'}</span>
                </button>

                {(query || selectedCategory !== 'all' || selectedMake || selectedProvince !== 'all' || minPrice || maxPrice) && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="flex items-center gap-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSubcategory('All');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Categories
            </button>

            {/* Heavy Equipment */}
            <button
              onClick={() => {
                setSelectedCategory('heavy_equipment');
                setSelectedSubcategory('All');
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                selectedCategory === 'heavy_equipment'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <img
                src={CATEGORY_VISUALS.heavy_equipment.image}
                alt="Heavy Plant"
                referrerPolicy="no-referrer"
                className="w-4 h-4 rounded-full object-cover shrink-0 border border-slate-700"
              />
              <span>Heavy Equipment</span>
            </button>

            {/* Trucks */}
            <button
              onClick={() => {
                setSelectedCategory('trucks');
                setSelectedSubcategory('All');
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                selectedCategory === 'trucks'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <img
                src={CATEGORY_VISUALS.trucks.image}
                alt="Trucks"
                referrerPolicy="no-referrer"
                className="w-4 h-4 rounded-full object-cover shrink-0 border border-slate-700"
              />
              <span>Commercial Trucks</span>
            </button>

            {/* Cars & Bakkies */}
            <button
              onClick={() => {
                setSelectedCategory('cars');
                setSelectedSubcategory('All');
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                selectedCategory === 'cars'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <img
                src={CATEGORY_VISUALS.cars.image}
                alt="Bakkies"
                referrerPolicy="no-referrer"
                className="w-4 h-4 rounded-full object-cover shrink-0 border border-slate-700"
              />
              <span>Cars, Bakkies & SUVs</span>
            </button>
          </div>

          {/* Advanced Filters Expandable Drawer */}
          {showAdvancedFilters && (
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs animate-in fade-in duration-150">
              {/* Province */}
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400" /> Location / Province
                </label>
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value as SAProvince | 'all')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All 9 SA Provinces</option>
                  {PROVINCES_LIST.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Condition */}
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold flex items-center gap-1">
                  <Tag className="w-3 h-3 text-amber-400" /> Part Condition
                </label>
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value as PartCondition | 'all')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="all">Any Condition</option>
                  <option value="reconditioned">Reconditioned / Reman</option>
                  <option value="used">Good Used</option>
                  <option value="stripping_spares">Stripping for Spares</option>
                  <option value="new">Brand New</option>
                </select>
              </div>

              {/* Min & Max Price */}
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Min Price (ZAR)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={minPrice ?? ''}
                  onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Max Price (ZAR)</label>
                <input
                  type="number"
                  placeholder="e.g. 150000"
                  value={maxPrice ?? ''}
                  onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* Popular Makes & Saved Quick Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {/* Saved Items Filter Pill */}
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                onlyFavorites
                  ? 'bg-rose-600 border-rose-500 text-white shadow-sm'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
              }`}
              title="Show only locally saved parts"
            >
              <Heart className={`w-3.5 h-3.5 ${onlyFavorites || favorites.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-slate-400'} ${onlyFavorites ? 'fill-white text-white' : ''}`} />
              <span>Saved ({favorites.length})</span>
            </button>

            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mx-1">
              Top Makes:
            </span>
            {POPULAR_MAKES.map((m) => {
              const isSelected = selectedMake.toLowerCase() === m.toLowerCase();
              return (
                <button
                  key={m}
                  onClick={() => setSelectedMake(isSelected ? '' : m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Results Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Results Summary Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 px-4 py-2.5 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {searchResults.length} {searchResults.length === 1 ? 'result' : 'matching parts'} found
              </span>
              {query && (
                <span className="text-xs text-amber-400 font-medium">
                  for "{query}"
                </span>
              )}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SearchOptions['sortBy'])}
                className="bg-slate-900 border border-slate-800 text-slate-200 px-2.5 py-1 rounded-lg font-semibold focus:outline-none cursor-pointer"
              >
                <option value="relevance">Highest Relevance Score</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="newest">Newest Listed</option>
                <option value="views">Most Viewed</option>
              </select>
            </div>
          </div>

          {/* Popular Search Suggestions (when search is empty or small) */}
          {!query && (
            <div className="space-y-3 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Trending Spares Searches in South Africa</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCH_TERMS.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSelectQuery(term)}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-400 border border-slate-800 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Search className="w-3 h-3 text-amber-400" />
                    <span>{term}</span>
                  </button>
                ))}
              </div>

              {recentSearches.length > 0 && (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <History className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Recent Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSelectQuery(term)}
                        className="px-2.5 py-1 bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results List */}
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map(({ item, score, matchedFields }) => {
                const seller = sellers.find(s => s.id === item.sellerId);
                const isSellerActive = seller?.subscriptionStatus === 'active';

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItemForDetail(item)}
                    className="group bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-md hover:shadow-xl relative"
                  >
                    {/* Top Row: Photo + Main Info */}
                    <div className="flex items-start gap-3.5">
                      {/* Image Thumbnail */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-900 overflow-hidden border border-slate-800 shrink-0 relative">
                        {item.images && item.images.length > 0 ? (
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <HardHat className="w-6 h-6" />
                          </div>
                        )}
                        {item.isFeatured && (
                          <div className="absolute top-1 left-1 bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded shadow">
                            FEATURED
                          </div>
                        )}
                      </div>

                      {/* Content details */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400">
                          <span className="text-amber-400 font-bold uppercase tracking-wider truncate">
                            {item.make} • {item.subcategory}
                          </span>
                          {item.partNumber && (
                            <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-300">
                              #{item.partNumber}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                          {highlightText(item.title, query)}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{item.city}, {item.province}</span>
                        </div>

                        {/* Matched Tags */}
                        {query && matchedFields.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {matchedFields.map((f) => (
                              <span
                                key={f}
                                className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-1.5 py-0.2 rounded font-semibold"
                              >
                                ✓ {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Price & Actions */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Asking Price</span>
                        <div className="text-base sm:text-lg font-black text-amber-400">
                          {formatCurrency(item.priceZar)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Heart Favorite Toggle */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.id);
                          }}
                          className={`p-1.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                            isFavorite(item.id)
                              ? 'bg-rose-600 border-rose-500 text-white shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 border-slate-700/70 text-slate-400 hover:text-rose-400'
                          }`}
                          title={isFavorite(item.id) ? 'Remove from Saved Parts' : 'Save to Favorites'}
                          aria-label={isFavorite(item.id) ? 'Remove from Saved Parts' : 'Save to Favorites'}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFavorite(item.id) ? 'fill-white text-white' : 'text-slate-300'}`} />
                        </button>

                        {isOwnerAdminLoggedIn && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (itemPendingDeleteId !== item.id) {
                                setItemPendingDeleteId(item.id);
                                setTimeout(() => setItemPendingDeleteId(null), 4000);
                                return;
                              }
                              deleteInventoryItem(item.id);
                              setItemPendingDeleteId(null);
                            }}
                            className={`px-2 py-1.5 ${
                              itemPendingDeleteId === item.id
                                ? 'bg-rose-500 text-white animate-pulse'
                                : 'bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white'
                            } border border-rose-500/30 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer`}
                            title="Owner Action: Delete this listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {itemPendingDeleteId === item.id && <span className="text-[10px]">Delete?</span>}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setContactItem(item);
                          }}
                          className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                          title="Contact Seller Phone & Email"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Contact</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const waUrl = generateWhatsappInquiryUrl(item, seller);
                            window.open(waUrl, '_blank', 'noopener,noreferrer');
                          }}
                          className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                          title="Direct WhatsApp Inquiry"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-950 p-10 rounded-3xl border border-slate-800 text-center max-w-lg mx-auto space-y-4 my-8">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">No Matching Spares Found</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We couldn't find any listings for "{query}". Try searching with alternative terms like OEM numbers, equipment model (e.g. 320D, R500, GD-6), or expand your province selection.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Reset All Filters
                </button>
                {onOpenSellerPortal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSellerPortal();
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Advertise This Part As Seller
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Search Engine Footer Info */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Search Engine indexing {inventory.length} heavy equipment, truck & automotive listings across South Africa</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Press <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300 font-mono text-[10px]">Esc</kbd> to close</span>
          </div>
        </div>

      </div>

      {/* Sub-modals */}
      {selectedItemForDetail && (
        <ListingDetailModal
          item={selectedItemForDetail}
          onClose={() => setSelectedItemForDetail(null)}
          onOpenSellerPortal={onOpenSellerPortal}
        />
      )}

      {contactItem && (
        <SellerContactModal
          item={contactItem}
          seller={sellers.find(s => s.id === contactItem.sellerId)}
          onClose={() => setContactItem(null)}
        />
      )}
    </div>
  );
};

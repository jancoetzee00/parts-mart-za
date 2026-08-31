import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  MapPin,
  HardHat,
  Truck,
  Car,
  Bus,
  ShieldCheck,
  CreditCard,
  Zap,
  Sparkles,
  ChevronRight,
  Globe,
  SlidersHorizontal,
  Hash,
  Layers,
  ArrowRight,
  Check,
  Flame,
  Trophy,
  Monitor,
  X,
  Download
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PROVINCES_LIST } from '../data/initialData';
import { CATEGORY_VISUALS } from '../data/categoryImages';
import { CategoryType, SAProvince } from '../types';
import { getLiveSearchSuggestions, POPULAR_SEARCH_TERMS } from '../lib/searchEngine';
import { isLocalAppEnvironment } from '../lib/env';

interface HeroBannerProps {
  onOpenSellerPortal: () => void;
  onOpenSellersDirectory: () => void;
  onOpenSearchEngine: (initialQuery?: string) => void;
  onOpenVisibilityCenter: () => void;
  onOpenSpecialsCompetitions: () => void;
  onOpenDesktopShortcut: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onOpenSellerPortal,
  onOpenSellersDirectory,
  onOpenSearchEngine,
  onOpenVisibilityCenter,
  onOpenSpecialsCompetitions,
  onOpenDesktopShortcut
}) => {
  const { filter, setFilter, inventory, sellers, specials, competitions, isOwnerAdminLoggedIn } = useApp();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const showSellersDirectory = isLocalAppEnvironment() || isOwnerAdminLoggedIn;

  const totalParts = inventory.length;
  const activeSellers = sellers.filter(s => s.subscriptionStatus === 'active').length;

  const categoryCounts = {
    heavy_equipment: inventory.filter(i => i.category === 'heavy_equipment').length,
    trucks: inventory.filter(i => i.category === 'trucks').length,
    minibus_taxis: inventory.filter(i => i.category === 'minibus_taxis').length,
    cars: inventory.filter(i => i.category === 'cars').length
  };

  const suggestions = getLiveSearchSuggestions(inventory, filter.searchQuery);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDropdownOpen(false);
    onOpenSearchEngine(filter.searchQuery);
  };

  const handleSelectSuggestion = (term: string) => {
    setFilter({ searchQuery: term });
    setIsDropdownOpen(false);
    onOpenSearchEngine(term);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="relative bg-slate-950 text-white overflow-hidden border-b border-slate-800">
      {/* Background Industrial Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-slate-950 to-slate-950 pointer-events-none"></div>
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Hero Copy */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>South Africa's Heavy Duty Spares & Equipment Search Engine</span>
              </div>
              <button
                type="button"
                onClick={onOpenVisibilityCenter}
                className="inline-flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                title="View Search Engine & SEO Visibility Score"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>SEO & Search Visibility</span>
              </button>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              BUY & ADVERTISE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-300">
                CAR, TRUCK & HEAVY EQUIPMENT
              </span>
            </h1>

            <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
              Find excavator pumps, truck gearboxes, and automotive spares with our multi-field search engine. Direct WhatsApp & phone leads with verified scrap yards nationwide.
            </p>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span><strong className="text-white font-bold">{totalParts}+</strong> Listed Inventory</span>
              </div>
              {showSellersDirectory ? (
                <button
                  type="button"
                  onClick={onOpenSellersDirectory}
                  className="flex items-center gap-1.5 bg-indigo-900/40 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span><strong className="text-white font-bold">{activeSellers}</strong> Yards Sorted by Location</span>
                  <ChevronRight className="w-3 h-3 text-indigo-400" />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span><strong className="text-white font-bold">{activeSellers}</strong> Verified Yards</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>Direct WhatsApp & Call Leads</span>
              </div>
            </div>

            {/* Live Search Engine Container */}
            <div ref={dropdownRef} className="relative pt-2">
              <form onSubmit={handleSearchSubmit}>
                <div className="bg-slate-900/95 p-2 rounded-2xl border-2 border-slate-800 focus-within:border-amber-500 shadow-2xl backdrop-blur-md flex flex-col md:flex-row gap-2 transition-all">
                  
                  {/* Search Text Input with Live Autocomplete */}
                  <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-800 focus-within:border-amber-500 transition-colors min-h-[46px]">
                    <Search className="w-4 h-4 text-amber-400 shrink-0" />
                    <input
                      type="text"
                      value={filter.searchQuery}
                      onChange={(e) => {
                        setFilter({ searchQuery: e.target.value });
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      placeholder="Search CAT pump, Scania gearbox, Hilux diff..."
                      className="w-full bg-transparent text-white text-xs md:text-sm placeholder:text-slate-500 focus:outline-none"
                    />
                    {filter.searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilter({ searchQuery: '' });
                          setIsDropdownOpen(false);
                        }}
                        className="p-1 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Province Selector & Submit Group on Mobile */}
                  <div className="flex items-center gap-2">
                    {/* Province Selector */}
                    <div className="flex-1 md:flex-initial flex items-center gap-2 px-3 py-2.5 bg-slate-950 rounded-xl border border-slate-800 shrink-0 min-h-[46px]">
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                      <select
                        value={filter.province}
                        onChange={(e) => setFilter({ province: e.target.value as SAProvince | 'all' })}
                        className="w-full bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
                      >
                        <option value="all" className="bg-slate-900 text-white">All SA Provinces</option>
                        {PROVINCES_LIST.map((prov) => (
                          <option key={prov} value={prov} className="bg-slate-900 text-white">
                            {prov}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Submit Search Button */}
                    <button
                      type="submit"
                      className="flex-1 md:flex-initial px-5 py-2.5 min-h-[46px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95"
                    >
                      <span>Search</span>
                      <span className="hidden sm:inline-block bg-slate-950/20 text-[10px] px-1.5 py-0.5 rounded font-mono">
                        ⌘K
                      </span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Live Autocomplete Suggestions Dropdown */}
              {isDropdownOpen && (suggestions.parts.length > 0 || suggestions.makes.length > 0 || suggestions.oemPartNumbers.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 text-xs space-y-3 backdrop-blur-xl animate-in fade-in duration-150">
                  
                  {/* Matching Parts List */}
                  {suggestions.parts.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Matching Listed Spares
                      </span>
                      <div className="space-y-1">
                        {suggestions.parts.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => handleSelectSuggestion(p.title)}
                            className="p-2 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Search className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="text-white group-hover:text-amber-400 font-semibold truncate">
                                {p.title}
                              </span>
                              {p.partNumber && (
                                <span className="bg-slate-900 text-slate-400 font-mono text-[10px] px-1.5 py-0.2 rounded shrink-0">
                                  #{p.partNumber}
                                </span>
                              )}
                            </div>
                            <span className="text-amber-400 font-extrabold shrink-0">
                              {formatCurrency(p.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Brands / Makes */}
                  {suggestions.makes.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Browse by Manufacturer
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.makes.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleSelectSuggestion(m)}
                            className="px-2.5 py-1 bg-slate-950 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded-lg border border-slate-800 font-bold text-xs transition-colors cursor-pointer"
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching OEM Part Numbers */}
                  {suggestions.oemPartNumbers.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Matching OEM Part Codes
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.oemPartNumbers.map((oem) => (
                          <button
                            key={oem}
                            type="button"
                            onClick={() => handleSelectSuggestion(oem)}
                            className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-amber-300 font-mono rounded-lg border border-slate-800 text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Hash className="w-3 h-3 text-amber-400" />
                            <span>{oem}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Launch Full Search Engine Button */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenSearchEngine(filter.searchQuery);
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Open Advanced Search Engine with Price & OEM Filters</span>
                    </button>
                    <span className="text-[10px] text-slate-500">Press Enter to Search</span>
                  </div>

                </div>
              )}

              {/* Popular Search Quick Chips under search bar */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2.5 text-[11px] text-slate-400">
                <span className="font-bold text-slate-500 uppercase tracking-wider mr-1">Popular:</span>
                {POPULAR_SEARCH_TERMS.slice(0, 4).map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setFilter({ searchQuery: term });
                      onOpenSearchEngine(term);
                    }}
                    className="px-2.5 py-0.5 bg-slate-900/80 hover:bg-slate-850 hover:text-amber-400 text-slate-300 rounded-full border border-slate-800/80 transition-colors cursor-pointer"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category Cards & Seller Banner */}
          <div className="lg:col-span-5 space-y-3.5">
            
            {/* Machinery Category Visual Cards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Machinery Categories & Spares</span>
                </span>
                {filter.category !== 'all' && (
                  <button
                    onClick={() => setFilter({ category: 'all', subcategory: 'All' })}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline"
                  >
                    View All Categories
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                
                {/* Heavy Equipment */}
                <div
                  onClick={() => setFilter({ category: 'heavy_equipment', subcategory: 'All' })}
                  className={`group relative overflow-hidden rounded-2xl border transition-all cursor-pointer p-3 flex flex-col justify-between min-h-[135px] ${
                    filter.category === 'heavy_equipment'
                      ? 'border-amber-500 bg-slate-900 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/10'
                      : 'border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  {/* Category Image with Gradient Overlay */}
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <img
                      src={CATEGORY_VISUALS.heavy_equipment.image}
                      alt={CATEGORY_VISUALS.heavy_equipment.alt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-35 group-hover:opacity-50 group-hover:scale-105 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
                  </div>

                  {/* Top Bar: Icon + Count Badge */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <HardHat className="w-3.5 h-3.5" />
                    </div>
                    <span className="bg-slate-950/80 backdrop-blur-sm border border-amber-500/30 text-amber-400 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                      {categoryCounts.heavy_equipment} Parts
                    </span>
                  </div>

                  {/* Bottom Info: Title & Makes */}
                  <div className="relative z-10 space-y-0.5 pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">
                        Heavy Equipment
                      </h3>
                      {filter.category === 'heavy_equipment' && (
                        <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-300 line-clamp-1 font-medium">
                      CAT • Komatsu • Bell
                    </p>
                  </div>
                </div>

                {/* Commercial Trucks */}
                <div
                  onClick={() => setFilter({ category: 'trucks', subcategory: 'All' })}
                  className={`group relative overflow-hidden rounded-2xl border transition-all cursor-pointer p-3 flex flex-col justify-between min-h-[135px] ${
                    filter.category === 'trucks'
                      ? 'border-blue-500 bg-slate-900 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10'
                      : 'border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  {/* Category Image with Gradient Overlay */}
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <img
                      src={CATEGORY_VISUALS.trucks.image}
                      alt={CATEGORY_VISUALS.trucks.alt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-35 group-hover:opacity-50 group-hover:scale-105 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
                  </div>

                  {/* Top Bar: Icon + Count Badge */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <Truck className="w-3.5 h-3.5" />
                    </div>
                    <span className="bg-slate-950/80 backdrop-blur-sm border border-blue-500/30 text-blue-400 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                      {categoryCounts.trucks} Parts
                    </span>
                  </div>

                  {/* Bottom Info: Title & Makes */}
                  <div className="relative z-10 space-y-0.5 pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-xs text-white group-hover:text-blue-300 transition-colors">
                        Commercial Trucks
                      </h3>
                      {filter.category === 'trucks' && (
                        <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-300 line-clamp-1 font-medium">
                      Scania • Volvo • Isuzu
                    </p>
                  </div>
                </div>

                {/* Minibus / Taxi */}
                <div
                  onClick={() => setFilter({ category: 'minibus_taxis', subcategory: 'All' })}
                  className={`group relative overflow-hidden rounded-2xl border transition-all cursor-pointer p-3 flex flex-col justify-between min-h-[135px] ${
                    filter.category === 'minibus_taxis'
                      ? 'border-cyan-500 bg-slate-900 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-500/10'
                      : 'border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  {/* Category Image with Gradient Overlay */}
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <img
                      src={CATEGORY_VISUALS.minibus_taxis.image}
                      alt={CATEGORY_VISUALS.minibus_taxis.alt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-35 group-hover:opacity-50 group-hover:scale-105 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
                  </div>

                  {/* Top Bar: Icon + Count Badge */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Bus className="w-3.5 h-3.5" />
                    </div>
                    <span className="bg-slate-950/80 backdrop-blur-sm border border-cyan-500/30 text-cyan-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                      {categoryCounts.minibus_taxis} Parts
                    </span>
                  </div>

                  {/* Bottom Info: Title & Makes */}
                  <div className="relative z-10 space-y-0.5 pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors">
                        Minibus / Taxi
                      </h3>
                      {filter.category === 'minibus_taxis' && (
                        <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-300 line-clamp-1 font-medium">
                      Quantum • HiAce • NV350
                    </p>
                  </div>
                </div>

                {/* Cars & Bakkies */}
                <div
                  onClick={() => setFilter({ category: 'cars', subcategory: 'All' })}
                  className={`group relative overflow-hidden rounded-2xl border transition-all cursor-pointer p-3 flex flex-col justify-between min-h-[135px] ${
                    filter.category === 'cars'
                      ? 'border-emerald-500 bg-slate-900 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                      : 'border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  {/* Category Image with Gradient Overlay */}
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <img
                      src={CATEGORY_VISUALS.cars.image}
                      alt={CATEGORY_VISUALS.cars.alt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-35 group-hover:opacity-50 group-hover:scale-105 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
                  </div>

                  {/* Top Bar: Icon + Count Badge */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Car className="w-3.5 h-3.5" />
                    </div>
                    <span className="bg-slate-950/80 backdrop-blur-sm border border-emerald-500/30 text-emerald-400 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                      {categoryCounts.cars} Parts
                    </span>
                  </div>

                  {/* Bottom Info: Title & Makes */}
                  <div className="relative z-10 space-y-0.5 pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-xs text-white group-hover:text-emerald-300 transition-colors">
                        Cars & Bakkies
                      </h3>
                      {filter.category === 'cars' && (
                        <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-300 line-clamp-1 font-medium">
                      Toyota • Ford • Spares
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick Action Grid (2-column on sm, 1-col on xs) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Specials & Competitions Highlight Card */}
              <div
                onClick={onOpenSpecialsCompetitions}
                className="bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-slate-900 border border-amber-500/30 hover:border-amber-400 p-3 rounded-2xl flex flex-col justify-between gap-2.5 cursor-pointer transition-all shadow-md group hover:scale-[1.01]"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                      <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                      <span>Specials & Deals</span>
                    </div>
                    <span className="bg-amber-400 text-slate-950 text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase">
                      {specials.length} Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Flash clearance deals & yard trophy challenges.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-amber-500/20 text-xs text-amber-400 font-bold group-hover:text-amber-300">
                  <span>Explore Deals</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* App Download / Quick Launcher Card */}
              <div
                onClick={onOpenDesktopShortcut}
                className="bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 hover:border-cyan-400 p-3 rounded-2xl flex flex-col justify-between gap-2.5 cursor-pointer transition-all shadow-md group hover:scale-[1.01]"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Download App</span>
                    </div>
                    <span className="bg-cyan-500/20 text-cyan-300 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase">
                      Mobile & PC
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Install for Android, iPhone, iPad, or Windows/Mac desktop.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-cyan-500/20 text-xs text-cyan-400 font-bold group-hover:text-cyan-300">
                  <span>Get App Launcher</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Search Engine Shortcut Card */}
              <div
                onClick={() => onOpenSearchEngine()}
                className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-850 border border-slate-800 hover:border-amber-500/50 p-3 rounded-2xl flex flex-col justify-between gap-2.5 cursor-pointer transition-all shadow-md group hover:scale-[1.01]"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Engine</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    OEM part codes, synonyms & price filters.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs text-slate-300 font-bold group-hover:text-amber-400">
                  <span>Open ⌘K Engine</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Seller Subscription CTA Box */}
              <div
                onClick={onOpenSellerPortal}
                className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-slate-800 hover:border-amber-500/40 p-3 rounded-2xl flex flex-col justify-between gap-2.5 cursor-pointer transition-all shadow-md group hover:scale-[1.01]"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                      <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                      <span>Yard Sellers</span>
                    </div>
                    <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1.5 py-0.2 rounded font-bold">
                      From R450/m
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    List heavy spares & get direct WhatsApp leads.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs text-amber-400 font-bold group-hover:text-amber-300">
                  <span>Join as Seller</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

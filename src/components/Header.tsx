import React, { useState } from 'react';
import {
  Wrench,
  Truck,
  Car,
  Bus,
  HardHat,
  Lock,
  Building2,
  Search,
  Menu,
  X,
  Globe,
  Sparkles,
  Heart,
  Flame,
  Monitor,
  ChevronRight,
  Download,
  Smartphone,
  Zap,
  Tag,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryType } from '../types';
import { isLocalAppEnvironment } from '../lib/env';

interface HeaderProps {
  onOpenSellerPortal: () => void;
  onOpenOwnerAdmin: () => void;
  onOpenAiAssistant: () => void;
  onOpenSellersDirectory: () => void;
  onOpenSearchEngine: () => void;
  onOpenVisibilityCenter: () => void;
  onOpenSpecialsCompetitions: () => void;
  onOpenDesktopShortcut: () => void;
  onOpenFavoritesModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSellerPortal,
  onOpenOwnerAdmin,
  onOpenAiAssistant,
  onOpenSellersDirectory,
  onOpenSearchEngine,
  onOpenVisibilityCenter,
  onOpenSpecialsCompetitions,
  onOpenDesktopShortcut,
  onOpenFavoritesModal
}) => {
  const { filter, setFilter, activeSeller, isOwnerAdminLoggedIn, sellers, favorites, specials } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const showOwnerControls = isLocalAppEnvironment() || isOwnerAdminLoggedIn;
  const showSellersDirectory = isLocalAppEnvironment() || isOwnerAdminLoggedIn;

  // Count unpaid sellers
  const unpaidCount = sellers.filter(s => s.subscriptionStatus === 'unpaid' || s.subscriptionStatus === 'pending_verification').length;

  const handleCategorySelect = (cat: CategoryType | 'all') => {
    setFilter({ category: cat, subcategory: 'All', onlyFavorites: false });
  };

  return (
    <header id="main-app-header" className="sticky top-0 z-40 bg-slate-900/98 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      {/* Top Utility Ribbon */}
      <div className="bg-slate-950 text-xs py-1.5 px-3 sm:px-4 text-slate-400 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Left Brand Slogan & Status */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1.5 font-bold text-amber-400 shrink-0">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Part-Smart ZA
            </span>
            <span className="hidden md:inline text-slate-700">|</span>
            <span className="hidden md:inline text-slate-400 text-[11px] truncate">
              South Africa's Heavy Machinery, Truck & Auto Spares Network
            </span>
          </div>

          {/* Right Utility Navigation Items */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Specials & Deals Badge */}
            <button
              id="btn-header-top-specials"
              onClick={onOpenSpecialsCompetitions}
              className="text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-1 font-bold cursor-pointer bg-gradient-to-r from-amber-500/15 to-orange-500/15 hover:from-amber-500/25 hover:to-orange-500/25 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[11px] shrink-0"
              title="View Seller Specials & Yard Competitions"
            >
              <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
              <span>Specials</span>
              {specials.length > 0 && (
                <span className="bg-orange-500 text-slate-950 px-1.5 py-0.1 rounded-full text-[9px] font-black">
                  {specials.length}
                </span>
              )}
            </button>

            {/* Desktop App Shortcut */}
            <button
              id="btn-header-top-desktop"
              onClick={onOpenDesktopShortcut}
              className="text-cyan-400 hover:text-cyan-300 transition-colors hidden sm:flex items-center gap-1 font-semibold cursor-pointer bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 px-2.5 py-0.5 rounded-full text-[11px] shrink-0"
              title="Download Desktop Link or Mobile App"
            >
              <Monitor className="w-3 h-3" />
              <span>Install App</span>
            </button>

            {/* SEO Visibility Center */}
            <button
              id="btn-header-top-seo"
              onClick={onOpenVisibilityCenter}
              className="text-indigo-300 hover:text-indigo-200 transition-colors hidden lg:flex items-center gap-1 font-semibold cursor-pointer bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-500/30 px-2.5 py-0.5 rounded-full text-[11px] shrink-0"
              title="View SEO & Search Engine Rankings"
            >
              <Globe className="w-3 h-3 text-indigo-400" />
              <span>SEO</span>
            </button>

            {/* Sellers Directory */}
            {showSellersDirectory && (
              <button
                id="btn-header-top-directory"
                onClick={onOpenSellersDirectory}
                className="text-slate-300 hover:text-amber-400 transition-colors hidden sm:flex items-center gap-1 font-semibold cursor-pointer bg-slate-900 hover:bg-slate-850 border border-slate-800 px-2.5 py-0.5 rounded-full text-[11px] shrink-0"
              >
                <Building2 className="w-3 h-3" />
                <span>Yards Directory</span>
              </button>
            )}

            {/* AI Assistant Quick Reply */}
            <button
              id="btn-header-top-ai"
              onClick={onOpenAiAssistant}
              className="text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-1 font-bold cursor-pointer bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 px-2.5 py-0.5 rounded-full text-[11px] shrink-0"
              title="Open AI Part Finder & Quick Replies"
            >
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="hidden xs:inline">AI Quick Replies</span>
              <span className="xs:hidden">AI</span>
            </button>

            {/* Owner Quick Status */}
            {showOwnerControls && (
              <button
                id="btn-header-top-owner"
                onClick={onOpenOwnerAdmin}
                className={`flex items-center gap-1 transition-colors px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer shrink-0 ${
                  isOwnerAdminLoggedIn
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                }`}
                title="App Owner Administration"
              >
                <Lock className="w-3 h-3" />
                <span>{isOwnerAdminLoggedIn ? 'Admin' : 'Owner'}</span>
                {unpaidCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 px-1.5 py-0.1 rounded-full font-black text-[9px]">
                    {unpaidCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            id="brand-logo-button"
            onClick={() => handleCategorySelect('all')}
            className="cursor-pointer flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
              <HardHat className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-amber-400 transition-colors leading-none">
                  PART-SMART<span className="text-amber-500">.ZA</span>
                </span>
                <span className="bg-amber-500/15 text-amber-400 text-[9px] font-black px-1.5 py-0.2 rounded border border-amber-500/30">
                  ZA
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none mt-1 hidden sm:block">
                Spares Search Engine & Yard Exchange
              </p>
            </div>
          </div>
        </div>

        {/* Center: Search Engine Shortcut Bar */}
        <div className="flex-1 max-w-xs md:max-w-md lg:max-w-lg min-w-0">
          <button
            id="btn-global-search-shortcut"
            onClick={onOpenSearchEngine}
            className="w-full flex items-center justify-between gap-2 bg-slate-950 hover:bg-slate-850 border border-slate-700/80 hover:border-amber-500/50 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-all cursor-pointer shadow-inner group"
          >
            <div className="flex items-center gap-2 min-w-0 truncate">
              <Search className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="text-slate-400 group-hover:text-slate-200 truncate text-[11px] sm:text-xs">
                Search CAT, Scania, Toyota spares...
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-400 font-mono shrink-0">
              <span>⌘K</span>
            </div>
          </button>
        </div>

        {/* Right: Key Action Button Group (Saved, Specials, Seller Portal) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Saved / Favorites Button */}
          <button
            id="btn-header-saved-parts"
            onClick={onOpenFavoritesModal}
            className={`h-9 px-2.5 sm:px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border ${
              favorites.length > 0
                ? 'bg-rose-950/40 hover:bg-rose-900/50 border-rose-500/40 text-rose-200 hover:text-white'
                : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Open Saved & Favorite Parts"
          >
            <Heart className={`w-3.5 h-3.5 ${favorites.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
            <span className="hidden md:inline">Saved</span>
            {favorites.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.1 rounded-full font-black bg-rose-600 text-white shadow-sm">
                {favorites.length}
              </span>
            )}
          </button>

          {/* Seller Portal / Post Spares CTA */}
          <button
            id="btn-header-seller-portal"
            onClick={onOpenSellerPortal}
            className="h-9 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 sm:gap-2 transition-all shadow-md shadow-amber-500/20 cursor-pointer shrink-0"
            title="Open Seller Portal to Post Inventory or Manage Subscription"
          >
            <Building2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="truncate max-w-[120px] sm:max-w-[160px]">
              {activeSeller ? activeSeller.companyName : 'Seller Portal'}
            </span>
            {activeSeller && (
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  activeSeller.subscriptionStatus === 'active'
                    ? 'bg-slate-950'
                    : 'bg-red-900 animate-ping'
                }`}
              />
            )}
          </button>

          {/* Mobile menu hamburger toggle */}
          <button
            id="btn-mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 cursor-pointer shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Primary Category & Quick Filter Navigation Tabs Bar */}
      <div className="bg-slate-950/90 border-t border-slate-800/80 px-3 sm:px-4 py-1.5 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Machinery & Category Tabs */}
          <nav className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              id="tab-cat-all"
              onClick={() => handleCategorySelect('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                filter.category === 'all' && !filter.onlyFavorites
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Spares & Machinery</span>
            </button>

            <button
              id="tab-cat-heavy"
              onClick={() => handleCategorySelect('heavy_equipment')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                filter.category === 'heavy_equipment' && !filter.onlyFavorites
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <HardHat className="w-3.5 h-3.5 text-amber-400" />
              <span>Heavy Machinery</span>
            </button>

            <button
              id="tab-cat-trucks"
              onClick={() => handleCategorySelect('trucks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                filter.category === 'trucks' && !filter.onlyFavorites
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Trucks & Commercial</span>
            </button>

            <button
              id="tab-cat-minibus"
              onClick={() => handleCategorySelect('minibus_taxis')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                filter.category === 'minibus_taxis' && !filter.onlyFavorites
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Bus className="w-3.5 h-3.5 text-cyan-300" />
              <span>Minibus / Taxi</span>
            </button>

            <button
              id="tab-cat-cars"
              onClick={() => handleCategorySelect('cars')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                filter.category === 'cars' && !filter.onlyFavorites
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Car className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cars & Bakkies</span>
            </button>
          </nav>

          {/* Quick Direct Link Shortcuts on right of tab bar */}
          <div className="hidden lg:flex items-center gap-2 shrink-0 text-xs">
            <button
              onClick={onOpenSpecialsCompetitions}
              className="text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer font-medium px-2 py-1 rounded hover:bg-slate-900"
            >
              <Flame className="w-3 h-3 text-orange-400" />
              <span>Yard Deals</span>
            </button>

            <span className="text-slate-800">|</span>

            <button
              onClick={onOpenDesktopShortcut}
              className="text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer font-medium px-2 py-1 rounded hover:bg-slate-900"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>Install App</span>
            </button>

            <span className="text-slate-800">|</span>

            <button
              onClick={onOpenAiAssistant}
              className="text-slate-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer font-medium px-2 py-1 rounded hover:bg-slate-900"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>AI Part Finder</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900/98 backdrop-blur-xl p-4 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          {/* Mobile Search Engine Launch */}
          <button
            onClick={() => {
              onOpenSearchEngine();
              setIsMobileMenuOpen(false);
            }}
            className="w-full h-11 bg-slate-950 border border-amber-500/50 hover:border-amber-400 text-amber-400 hover:text-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-inner transition-colors"
          >
            <Search className="w-4 h-4 text-amber-400" />
            <span>Launch Smart Search Engine (⌘K)</span>
          </button>

          {/* Category Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={() => {
                handleCategorySelect('all');
                setIsMobileMenuOpen(false);
              }}
              className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                filter.category === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60'
              }`}
            >
              All Spares
            </button>
            <button
              onClick={() => {
                handleCategorySelect('heavy_equipment');
                setIsMobileMenuOpen(false);
              }}
              className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                filter.category === 'heavy_equipment'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" /> Heavy Plant
            </button>
            <button
              onClick={() => {
                handleCategorySelect('trucks');
                setIsMobileMenuOpen(false);
              }}
              className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                filter.category === 'trucks'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60'
              }`}
            >
              <Truck className="w-3.5 h-3.5" /> Trucks
            </button>
            <button
              onClick={() => {
                handleCategorySelect('minibus_taxis');
                setIsMobileMenuOpen(false);
              }}
              className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                filter.category === 'minibus_taxis'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60'
              }`}
            >
              <Bus className="w-3.5 h-3.5" /> Minibus / Taxi
            </button>
            <button
              onClick={() => {
                handleCategorySelect('cars');
                setIsMobileMenuOpen(false);
              }}
              className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors col-span-2 sm:col-span-1 ${
                filter.category === 'cars'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60'
              }`}
            >
              <Car className="w-3.5 h-3.5" /> Cars & Bakkies
            </button>
          </div>

          {/* Action List */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            {/* Specials & Deals */}
            <button
              onClick={() => {
                onOpenSpecialsCompetitions();
                setIsMobileMenuOpen(false);
              }}
              className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl text-xs font-black flex items-center justify-between px-4 cursor-pointer shadow-md shadow-amber-500/20"
            >
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 fill-slate-950" />
                <span>Seller Specials & Competitions</span>
              </div>
              <span className="bg-slate-950 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-black">
                {specials.length} Deals
              </span>
            </button>

            {/* Mobile & Tablet App Download */}
            <button
              onClick={() => {
                onOpenDesktopShortcut();
                setIsMobileMenuOpen(false);
              }}
              className="w-full h-11 bg-slate-800 hover:bg-slate-750 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 rounded-xl text-xs font-bold flex items-center justify-between px-4 cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Download App (Phone, Tablet & PC)</span>
              </div>
              <span className="bg-cyan-500/20 text-cyan-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                Install
              </span>
            </button>

            {/* Saved Parts */}
            <button
              onClick={() => {
                onOpenFavoritesModal();
                setIsMobileMenuOpen(false);
              }}
              className={`w-full h-11 rounded-xl text-xs font-bold flex items-center justify-between px-4 cursor-pointer transition-all border ${
                favorites.length > 0
                  ? 'bg-rose-950/40 border-rose-500/50 text-rose-200 hover:text-white'
                  : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Heart className={`w-4 h-4 ${favorites.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                <span>Saved & Favorite Parts</span>
              </div>
              <span className="bg-rose-600 text-white font-black px-2 py-0.5 rounded-full text-[10px]">
                {favorites.length}
              </span>
            </button>

            {/* Seller Portal */}
            <button
              onClick={() => {
                onOpenSellerPortal();
                setIsMobileMenuOpen(false);
              }}
              className="w-full h-11 bg-slate-800 hover:bg-slate-750 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold flex items-center justify-between px-4 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>Seller Portal & List Inventory</span>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400/80" />
            </button>

            {/* SEO Visibility Center */}
            <button
              onClick={() => {
                onOpenVisibilityCenter();
                setIsMobileMenuOpen(false);
              }}
              className="w-full h-10 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-semibold flex items-center justify-between px-4 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>SEO & Search Visibility Center</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-indigo-400/80" />
            </button>

            {/* Owner Button */}
            {showOwnerControls && (
              <button
                onClick={() => {
                  onOpenOwnerAdmin();
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full h-10 rounded-xl text-xs font-bold flex items-center justify-between px-4 cursor-pointer ${
                  isOwnerAdminLoggedIn
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isOwnerAdminLoggedIn ? 'Owner Admin Console' : 'Owner Banking & Settings'}</span>
                </div>
                {unpaidCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full text-[10px] font-black">
                    {unpaidCount} Pending
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

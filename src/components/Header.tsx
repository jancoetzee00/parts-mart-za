import React, { useState } from 'react';
import {
  Wrench,
  Truck,
  Car,
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
  Zap
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
    setFilter({ category: cat, subcategory: 'All' });
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      {/* Top Utility Bar */}
      <div className="bg-slate-950/90 text-xs py-1 px-4 text-slate-400 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          {/* Left Brand Slogan */}
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 font-bold text-amber-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Part-Smart ZA
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline text-slate-300 text-[11px]">
              Car, Truck & Heavy Machinery Search Engine & Yard Exchange
            </span>
          </div>

          {/* Right Utility Navigation Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-0.5">
            {/* Specials & Deals Badge */}
            <button
              onClick={onOpenSpecialsCompetitions}
              className="text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-1 font-bold cursor-pointer bg-gradient-to-r from-amber-500/15 to-orange-500/15 hover:from-amber-500/25 hover:to-orange-500/25 border border-amber-500/30 px-2 py-0.5 rounded-full text-[11px] shrink-0"
              title="View Seller Specials & Yard Competitions"
            >
              <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
              <span>Specials</span>
              <span className="bg-orange-500 text-slate-950 px-1 py-0.1 rounded-full text-[9px] font-black">
                {specials.length}
              </span>
            </button>

            {/* Desktop App Shortcut */}
            <button
              onClick={onOpenDesktopShortcut}
              className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-semibold cursor-pointer bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 px-2 py-0.5 rounded-full text-[11px] shrink-0"
              title="Download Desktop Link or Install App"
            >
              <Monitor className="w-3 h-3" />
              <span>Desktop App</span>
            </button>

            {/* SEO & Search Visibility */}
            <button
              onClick={onOpenVisibilityCenter}
              className="text-indigo-300 hover:text-indigo-200 transition-colors hidden md:flex items-center gap-1 font-semibold cursor-pointer bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-500/30 px-2 py-0.5 rounded-full text-[11px] shrink-0"
              title="View SEO & Search Engine Rankings"
            >
              <Globe className="w-3 h-3 text-indigo-400" />
              <span>SEO Visibility</span>
            </button>

            {/* Sellers Directory - Local App / Admin Only */}
            {showSellersDirectory && (
              <button
                onClick={onOpenSellersDirectory}
                className="text-slate-300 hover:text-amber-400 transition-colors hidden sm:flex items-center gap-1 font-semibold cursor-pointer bg-slate-900 hover:bg-slate-850 border border-slate-800 px-2 py-0.5 rounded-full text-[11px] shrink-0"
              >
                <Building2 className="w-3 h-3" />
                <span>Yards Directory</span>
              </button>
            )}

            {/* Owner Quick Status - Shown on Local App or when logged in */}
            {showOwnerControls && (
              <button
                onClick={onOpenOwnerAdmin}
                className={`flex items-center gap-1 transition-colors px-2 py-0.5 rounded-full text-[11px] font-bold cursor-pointer shrink-0 ${
                  isOwnerAdminLoggedIn
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                }`}
                title="App Owner Banking & Administration"
              >
                <Lock className="w-3 h-3" />
                <span>{isOwnerAdminLoggedIn ? 'Admin' : 'Owner'}</span>
                {unpaidCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 px-1 py-0.1 rounded-full font-black text-[9px]">
                    {unpaidCount}
                  </span>
                )}
              </button>
            )}

            {/* AI Part Finder & Quick Replies */}
            <button
              onClick={onOpenAiAssistant}
              className="text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-1 font-bold cursor-pointer bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-[11px] shrink-0 shadow-sm"
              title="Open AI Part Assistant & Quick Reply Templates"
            >
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>AI Quick Replies</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            onClick={() => handleCategorySelect('all')}
            className="cursor-pointer flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <HardHat className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-white group-hover:text-amber-400 transition-colors leading-none">
                  PART-SMART<span className="text-amber-500">.ZA</span>
                </span>
                <span className="bg-amber-500/10 text-amber-400 text-[9px] font-black px-1.5 py-0.2 rounded border border-amber-500/30">
                  ZA
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none mt-1 hidden sm:block">
                Spares Search Engine & Yard Exchange
              </p>
            </div>
          </div>
        </div>

        {/* Global Search Engine Shortcut Bar */}
        <button
          onClick={onOpenSearchEngine}
          className="hidden md:flex items-center gap-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-700/80 hover:border-amber-500/50 px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-all cursor-pointer shadow-inner flex-1 max-w-sm lg:max-w-md justify-between group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
            <span className="text-slate-400 group-hover:text-slate-200 truncate">
              Search CAT, Scania, Toyota spares...
            </span>
          </div>
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-400 font-mono shrink-0">
            <span>⌘K</span>
          </div>
        </button>

        {/* Desktop Category Navigation */}
        <nav className="hidden xl:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => handleCategorySelect('all')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              filter.category === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleCategorySelect('heavy_equipment')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              filter.category === 'heavy_equipment'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <HardHat className="w-3.5 h-3.5" />
            Heavy
          </button>
          <button
            onClick={() => handleCategorySelect('trucks')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              filter.category === 'trucks'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Trucks
          </button>
          <button
            onClick={() => handleCategorySelect('cars')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              filter.category === 'cars'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            Cars
          </button>
        </nav>

        {/* Redesigned Clean Action Button Cluster */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          
          {/* Specials & Deals Button */}
          <button
            onClick={onOpenSpecialsCompetitions}
            className="h-9 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 cursor-pointer"
            title="View Seller Specials & Yard Competitions"
          >
            <Flame className="w-3.5 h-3.5 fill-slate-950" />
            <span className="hidden lg:inline">Specials & Deals</span>
            <span className="lg:hidden">Deals</span>
            <span className="bg-slate-950 text-amber-300 text-[10px] px-1.5 py-0.1 rounded-full font-black">
              {specials.length}
            </span>
          </button>

          {/* App Download / Quick Launcher Button */}
          <button
            onClick={onOpenDesktopShortcut}
            className="h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/40 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer group"
            title="Download App for Mobile Phone, Tablet or PC"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="hidden xl:inline">Download App</span>
            <span className="xl:hidden">App</span>
            <span className="hidden 2xl:inline text-[9px] bg-cyan-500/20 text-cyan-300 px-1 rounded font-normal">
              Mobile/PC
            </span>
          </button>

          {/* Saved Parts Button */}
          <button
            onClick={onOpenFavoritesModal}
            className={`h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border ${
              favorites.length > 0
                ? 'bg-rose-950/40 hover:bg-rose-900/50 border-rose-500/40 text-rose-200 hover:text-white'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 hover:text-white'
            }`}
            title="Open Saved & Favorite Parts Modal"
          >
            <Heart className={`w-3.5 h-3.5 ${favorites.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
            <span className="hidden md:inline">Saved</span>
            {favorites.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black bg-rose-600 text-white shadow-sm">
                {favorites.length}
              </span>
            )}
          </button>

          {/* Seller Portal / Post Spares CTA Button */}
          <button
            onClick={onOpenSellerPortal}
            className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-slate-800 to-slate-800 hover:from-amber-500/25 hover:to-slate-750 border border-amber-500/40 hover:border-amber-400 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            title="Seller Subscriptions & Listing Manager"
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <div className="text-left flex items-center gap-1.5">
              <span>{activeSeller ? activeSeller.companyName : 'Seller Portal'}</span>
              {activeSeller && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeSeller.subscriptionStatus === 'active'
                      ? 'bg-emerald-400'
                      : 'bg-amber-400'
                  }`}
                ></span>
              )}
            </div>
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 cursor-pointer"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Redesigned Clean Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-xl p-4 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-200">
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
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                handleCategorySelect('all');
                setIsMobileMenuOpen(false);
              }}
              className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                filter.category === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60'
              }`}
            >
              All Machinery
            </button>
            <button
              onClick={() => {
                handleCategorySelect('heavy_equipment');
                setIsMobileMenuOpen(false);
              }}
              className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                filter.category === 'heavy_equipment'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" /> Heavy Spares
            </button>
            <button
              onClick={() => {
                handleCategorySelect('trucks');
                setIsMobileMenuOpen(false);
              }}
              className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                filter.category === 'trucks'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60'
              }`}
            >
              <Truck className="w-3.5 h-3.5" /> Trucks
            </button>
            <button
              onClick={() => {
                handleCategorySelect('cars');
                setIsMobileMenuOpen(false);
              }}
              className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                filter.category === 'cars'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
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

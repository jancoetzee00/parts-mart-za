import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { InventoryFilter } from './components/InventoryFilter';
import { InventoryGrid } from './components/InventoryGrid';
import { SellerPortalModal } from './components/SellerPortalModal';
import { OwnerAdminModal } from './components/OwnerAdminModal';
import { AiPartAssistantModal } from './components/AiPartAssistantModal';
import { SellersDirectoryModal } from './components/SellersDirectoryModal';
import { SearchEngineModal } from './components/SearchEngineModal';
import { SearchVisibilityModal } from './components/SearchVisibilityModal';
import { SpecialsAndCompetitionsModal } from './components/SpecialsAndCompetitionsModal';
import { DesktopShortcutModal } from './components/DesktopShortcutModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileInstallBanner } from './components/MobileInstallBanner';
import {
  HardHat,
  Truck,
  Car,
  Lock,
  Building2,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  CheckCircle2,
  Heart,
  Search,
  Globe,
  Sparkles,
  Flame,
  Trophy,
  Monitor
} from 'lucide-react';
import { isLocalAppEnvironment } from './lib/env';

const MainContent: React.FC = () => {
  const [isSellerPortalOpen, setIsSellerPortalOpen] = useState(false);
  const [isOwnerAdminOpen, setIsOwnerAdminOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isSellersDirectoryOpen, setIsSellersDirectoryOpen] = useState(false);
  const [isSearchEngineOpen, setIsSearchEngineOpen] = useState(false);
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [isSpecialsCompetitionsOpen, setIsSpecialsCompetitionsOpen] = useState(false);
  const [isDesktopShortcutOpen, setIsDesktopShortcutOpen] = useState(false);
  const [specialsModalTab, setSpecialsModalTab] = useState<'specials' | 'competitions' | 'post_special' | 'enter_competition'>('specials');
  const [searchInitialQuery, setSearchInitialQuery] = useState('');

  const { ownerSettings, inventory, sellers, isOwnerAdminLoggedIn } = useApp();

  const showOwnerControls = isLocalAppEnvironment() || isOwnerAdminLoggedIn;

  // Keyboard Shortcuts:
  // - Cmd+K / Ctrl+K: Open Search Engine
  // - Ctrl+Shift+O / Cmd+Shift+O / Alt+Shift+O: Discrete Owner Admin Console Access
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchEngineOpen(true);
      }
      // Owner Admin discrete keyboard shortcut
      if ((e.metaKey || e.ctrlKey || e.altKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setIsOwnerAdminOpen(true);
      }
    };

    const handleHashChange = () => {
      if (window.location.hash === '#owner' || window.location.hash === '#admin') {
        setIsOwnerAdminOpen(true);
      }
      if (window.location.hash === '#specials') {
        setSpecialsModalTab('specials');
        setIsSpecialsCompetitionsOpen(true);
      }
      if (window.location.hash === '#competitions') {
        setSpecialsModalTab('competitions');
        setIsSpecialsCompetitionsOpen(true);
      }
      if (window.location.hash === '#desktop' || window.location.hash === '#shortcut') {
        setIsDesktopShortcutOpen(true);
      }
    };

    if (window.location.hash === '#owner' || window.location.hash === '#admin') {
      setIsOwnerAdminOpen(true);
    }
    if (window.location.hash === '#specials') {
      setSpecialsModalTab('specials');
      setIsSpecialsCompetitionsOpen(true);
    }
    if (window.location.hash === '#competitions') {
      setSpecialsModalTab('competitions');
      setIsSpecialsCompetitionsOpen(true);
    }
    if (window.location.hash === '#desktop' || window.location.hash === '#shortcut') {
      setIsDesktopShortcutOpen(true);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleOpenSearchEngineWithQuery = (initialQuery?: string) => {
    setSearchInitialQuery(initialQuery || '');
    setIsSearchEngineOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-amber-500 selection:text-slate-950 pb-16 md:pb-0">
      
      {/* Mobile & Tablet App Install Banner */}
      <MobileInstallBanner onOpenDownloadModal={() => setIsDesktopShortcutOpen(true)} />

      {/* Header */}
      <Header
        onOpenSellerPortal={() => setIsSellerPortalOpen(true)}
        onOpenOwnerAdmin={() => setIsOwnerAdminOpen(true)}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        onOpenSellersDirectory={() => setIsSellersDirectoryOpen(true)}
        onOpenSearchEngine={() => handleOpenSearchEngineWithQuery('')}
        onOpenVisibilityCenter={() => setIsVisibilityModalOpen(true)}
        onOpenSpecialsCompetitions={() => {
          setSpecialsModalTab('specials');
          setIsSpecialsCompetitionsOpen(true);
        }}
        onOpenDesktopShortcut={() => setIsDesktopShortcutOpen(true)}
      />

      {/* Hero Banner */}
      <HeroBanner
        onOpenSellerPortal={() => setIsSellerPortalOpen(true)}
        onOpenSellersDirectory={() => setIsSellersDirectoryOpen(true)}
        onOpenSearchEngine={handleOpenSearchEngineWithQuery}
        onOpenVisibilityCenter={() => setIsVisibilityModalOpen(true)}
        onOpenSpecialsCompetitions={() => {
          setSpecialsModalTab('specials');
          setIsSpecialsCompetitionsOpen(true);
        }}
        onOpenDesktopShortcut={() => setIsDesktopShortcutOpen(true)}
      />

      {/* Filter Toolbar */}
      <InventoryFilter />

      {/* Main Inventory Directory Grid */}
      <main className="flex-1">
        <InventoryGrid
          onOpenSellerPortal={() => setIsSellerPortalOpen(true)}
          onOpenSearchEngine={() => handleOpenSearchEngineWithQuery('')}
        />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-12 px-4 mt-12 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black">
                <HardHat className="w-5 h-5" />
              </div>
              <span className="font-black text-white text-base tracking-tight">
                PART-SMART<span className="text-amber-500">.ZA</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              South Africa's dedicated search engine and advertising network for Car, Truck, and Heavy Equipment inventory. Connecting buyers with verified yards nationwide.
            </p>
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Johannesburg • Cape Town • Durban • Polokwane</span>
            </div>
            <div className="pt-1">
              <button
                onClick={() => setIsVisibilityModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Search Engine & SEO Visibility Score</span>
              </button>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-amber-400">
              Marketplace Categories
            </h4>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-center gap-1.5"><HardHat className="w-3 h-3 text-amber-400" /> Earthmoving & Heavy Equipment</li>
              <li className="flex items-center gap-1.5"><Truck className="w-3 h-3 text-amber-400" /> Commercial Trucks & Trailer Parts</li>
              <li className="flex items-center gap-1.5"><Car className="w-3 h-3 text-amber-400" /> Passenger Cars, SUVs & Bakkies</li>
              <li>Reconditioned Hydraulics & Pumps</li>
              <li>Stripping Vehicles for Spares</li>
            </ul>
          </div>

          {/* Col 3: Seller Subscriptions */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-amber-400">
              Seller Advertising Subscriptions
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Automotive scrap yards, truck breakers, and heavy equipment dealers can subscribe monthly to advertise inventory with top search engine visibility.
            </p>
            <button
              onClick={() => setIsSellerPortalOpen(true)}
              className="mt-1 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-bold rounded-lg transition-colors cursor-pointer"
            >
              Seller Portal & Subscription Plans
            </button>
          </div>

          {/* Col 4: Banking Summary */}
          <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" /> EFT Banking Information
              </h4>
              {showOwnerControls && (
                <button
                  onClick={() => setIsOwnerAdminOpen(true)}
                  className={`p-1 cursor-pointer transition-colors ${
                    isOwnerAdminLoggedIn ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400 hover:text-amber-300'
                  }`}
                  title="App Owner Banking Details & Settings"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="text-[11px] text-slate-300 space-y-1">
              <div>Bank: <strong>{ownerSettings.bankingDetails.bankName}</strong></div>
              <div>Account: <strong className="font-mono text-amber-400">{ownerSettings.bankingDetails.accountNumber}</strong></div>
              <div>Branch Code: <strong className="font-mono text-slate-200">{ownerSettings.bankingDetails.branchCode}</strong></div>
            </div>
            <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
              Official banking details for verified advertiser subscriptions.
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-slate-800/80 flex flex-wrap justify-between items-center gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} Part-Smart-ZA. All rights reserved. South Africa's Heavy Duty Spares Search Engine & Ad Network.</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleOpenSearchEngineWithQuery('')}
              className="hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Search className="w-3 h-3" />
              <span>Search Engine (⌘K)</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsDesktopShortcutOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-semibold cursor-pointer"
              title="Download Desktop Link or Install App"
            >
              <Monitor className="w-3 h-3" />
              <span>Desktop App / Shortcut</span>
            </button>
            <span>•</span>
            <button onClick={() => setIsSellerPortalOpen(true)} className="hover:text-amber-400 transition-colors cursor-pointer">
              Seller Portal
            </button>
            {showOwnerControls && (
              <>
                <span>•</span>
                <button
                  onClick={() => setIsOwnerAdminOpen(true)}
                  className={`transition-colors cursor-pointer flex items-center gap-1 font-semibold ${
                    isOwnerAdminLoggedIn ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400/90 hover:text-amber-400'
                  }`}
                  title="App Owner Banking & Administration"
                >
                  <Lock className="w-3 h-3" />
                  <span>{isOwnerAdminLoggedIn ? 'Owner Admin' : 'Owner Settings'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Sticky Navigation Bar */}
      <MobileBottomNav
        onOpenSearchEngine={() => handleOpenSearchEngineWithQuery('')}
        onOpenSpecials={() => {
          setSpecialsModalTab('specials');
          setIsSpecialsCompetitionsOpen(true);
        }}
        onOpenSellerPortal={() => setIsSellerPortalOpen(true)}
        onOpenDesktopShortcut={() => setIsDesktopShortcutOpen(true)}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
      />

      {/* Search Engine Modal */}
      <SearchEngineModal
        isOpen={isSearchEngineOpen}
        onClose={() => setIsSearchEngineOpen(false)}
        initialQuery={searchInitialQuery}
        onOpenSellerPortal={() => setIsSellerPortalOpen(true)}
      />

      {/* Search Engine Visibility & SEO Modal */}
      <SearchVisibilityModal
        isOpen={isVisibilityModalOpen}
        onClose={() => setIsVisibilityModalOpen(false)}
        onOpenSearchEngine={() => {
          setIsVisibilityModalOpen(false);
          setIsSearchEngineOpen(true);
        }}
      />

      {/* Seller Portal Modal */}
      {isSellerPortalOpen && (
        <SellerPortalModal
          onClose={() => setIsSellerPortalOpen(false)}
          onOpenOwnerAdmin={() => {
            setIsSellerPortalOpen(false);
            setIsOwnerAdminOpen(true);
          }}
          onOpenSpecialsCompetitions={() => {
            setIsSellerPortalOpen(false);
            setSpecialsModalTab('post_special');
            setIsSpecialsCompetitionsOpen(true);
          }}
        />
      )}

      {/* Specials & Competitions Modal */}
      {isSpecialsCompetitionsOpen && (
        <SpecialsAndCompetitionsModal
          isOpen={isSpecialsCompetitionsOpen}
          onClose={() => setIsSpecialsCompetitionsOpen(false)}
          initialTab={specialsModalTab}
          onOpenSellerPortal={() => {
            setIsSpecialsCompetitionsOpen(false);
            setIsSellerPortalOpen(true);
          }}
        />
      )}

      {/* Owner Admin Modal */}
      {isOwnerAdminOpen && (
        <OwnerAdminModal
          onClose={() => setIsOwnerAdminOpen(false)}
        />
      )}

      {/* AI Assistant Modal */}
      {isAiAssistantOpen && (
        <AiPartAssistantModal
          onClose={() => setIsAiAssistantOpen(false)}
        />
      )}

      {/* Desktop Link & App Shortcut Modal */}
      {isDesktopShortcutOpen && (
        <DesktopShortcutModal
          isOpen={isDesktopShortcutOpen}
          onClose={() => setIsDesktopShortcutOpen(false)}
        />
      )}

      {/* Sellers Directory Modal - Local App / Admin Only */}
      {isSellersDirectoryOpen && showOwnerControls && (
        <SellersDirectoryModal
          onClose={() => setIsSellersDirectoryOpen(false)}
          onOpenSellerPortal={() => {
            setIsSellersDirectoryOpen(false);
            setIsSellerPortalOpen(true);
          }}
        />
      )}

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

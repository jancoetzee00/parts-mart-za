import React from 'react';
import { 
  Search, 
  Flame, 
  Heart, 
  Building2, 
  Layers, 
  Sparkles,
  Wrench,
  Monitor
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface MobileBottomNavProps {
  onOpenSearchEngine: () => void;
  onOpenSpecials: () => void;
  onOpenSellerPortal: () => void;
  onOpenDesktopShortcut: () => void;
  onOpenAiAssistant: () => void;
  onOpenFavoritesModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenSearchEngine,
  onOpenSpecials,
  onOpenSellerPortal,
  onOpenDesktopShortcut,
  onOpenAiAssistant,
  onOpenFavoritesModal
}) => {
  const { filter, setFilter, favorites, specials } = useApp();

  const handleHomeClick = () => {
    if (filter.onlyFavorites) {
      setFilter({ onlyFavorites: false });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSavedClick = () => {
    onOpenFavoritesModal();
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 shadow-2xl px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-slate-400">
      <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto">
        
        {/* Tab 1: Browse / All Inventory */}
        <button
          onClick={handleHomeClick}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            !filter.onlyFavorites && filter.category === 'all' && !filter.searchQuery
              ? 'text-amber-400 font-bold bg-amber-500/10'
              : 'hover:text-slate-200 active:scale-95'
          }`}
          aria-label="Browse Inventory"
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Browse</span>
        </button>

        {/* Tab 2: Smart Search Engine */}
        <button
          onClick={onOpenSearchEngine}
          className="flex flex-col items-center justify-center py-1 rounded-xl hover:text-slate-200 active:scale-95 transition-all text-amber-400"
          aria-label="Search Engine"
        >
          <div className="relative">
            <Search className="w-5 h-5 mb-0.5 text-amber-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          </div>
          <span className="text-[10px] font-bold text-amber-400 tracking-tight">Search</span>
        </button>

        {/* Tab 3: Specials & Yard Deals */}
        <button
          onClick={onOpenSpecials}
          className="flex flex-col items-center justify-center py-1 rounded-xl hover:text-orange-300 active:scale-95 transition-all text-orange-400 relative"
          aria-label="Specials and Deals"
        >
          <div className="relative">
            <Flame className="w-5 h-5 mb-0.5 fill-orange-500 text-orange-500 animate-pulse" />
            {specials.length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-orange-500 text-slate-950 text-[9px] font-black px-1 rounded-full leading-tight">
                {specials.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight">Deals</span>
        </button>

        {/* Tab 4: Saved / Favorites */}
        <button
          onClick={handleSavedClick}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all relative ${
            filter.onlyFavorites
              ? 'text-rose-400 font-bold bg-rose-500/10'
              : 'hover:text-slate-200 active:scale-95'
          }`}
          aria-label="Saved Parts"
        >
          <div className="relative">
            <Heart
              className={`w-5 h-5 mb-0.5 ${
                filter.onlyFavorites || favorites.length > 0
                  ? 'fill-rose-500 text-rose-500'
                  : 'text-slate-400'
              }`}
            />
            {favorites.length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-rose-600 text-white text-[9px] font-black px-1 rounded-full leading-tight">
                {favorites.length}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Saved</span>
        </button>

        {/* Tab 5: Seller Portal */}
        <button
          onClick={onOpenSellerPortal}
          className="flex flex-col items-center justify-center py-1 rounded-xl hover:text-amber-300 active:scale-95 transition-all text-slate-300"
          aria-label="Seller Portal"
        >
          <Building2 className="w-5 h-5 mb-0.5 text-amber-400" />
          <span className="text-[10px] tracking-tight">Seller</span>
        </button>

      </div>
    </div>
  );
};

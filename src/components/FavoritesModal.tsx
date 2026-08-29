import React, { useState, useMemo } from 'react';
import {
  Heart,
  X,
  Trash2,
  Share2,
  Check,
  MessageSquare,
  Phone,
  MapPin,
  HardHat,
  Truck,
  Car,
  ExternalLink,
  Search,
  ArrowUpDown,
  Filter,
  Sparkles,
  Building2,
  CheckCircle2,
  Copy,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InventoryItem, CategoryType, SAProvince } from '../types';
import { CATEGORY_VISUALS } from '../data/categoryImages';
import { generateWhatsappInquiryUrl } from '../lib/whatsapp';
import { PROVINCES_LIST } from '../data/initialData';
import { ListingDetailModal } from './ListingDetailModal';
import { SellerContactModal } from './SellerContactModal';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (item: InventoryItem) => void;
  onOpenSellerPortal?: () => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  onSelectItem,
  onOpenSellerPortal
}) => {
  const {
    inventory,
    sellers,
    favorites,
    toggleFavorite,
    clearFavorites,
    setFilter,
    incrementViews
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [selectedProvince, setSelectedProvince] = useState<SAProvince | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'title'>('newest');
  const [copiedShare, setCopiedShare] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<InventoryItem | null>(null);
  const [contactItem, setContactItem] = useState<InventoryItem | null>(null);

  // Retrieve actual item objects for all stored favorite IDs
  const savedItems = useMemo(() => {
    // Preserve the order of saved items (reverse so newest saved is first)
    const reversedFavs = [...favorites].reverse();
    return reversedFavs
      .map(id => inventory.find(item => item.id === id))
      .filter((item): item is InventoryItem => Boolean(item));
  }, [inventory, favorites]);

  // Filter and sort saved items
  const filteredItems = useMemo(() => {
    return savedItems.filter(item => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Province filter
      if (selectedProvince !== 'all' && item.province !== selectedProvince) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(q);
        const makeMatch = item.make.toLowerCase().includes(q);
        const subMatch = item.subcategory.toLowerCase().includes(q);
        const partNoMatch = item.partNumber ? item.partNumber.toLowerCase().includes(q) : false;
        const cityMatch = item.city.toLowerCase().includes(q);
        const descMatch = item.description ? item.description.toLowerCase().includes(q) : false;
        if (!titleMatch && !makeMatch && !subMatch && !partNoMatch && !cityMatch && !descMatch) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_low') return a.priceZar - b.priceZar;
      if (sortBy === 'price_high') return b.priceZar - a.priceZar;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      // 'newest' default
      return 0;
    });
  }, [savedItems, selectedCategory, selectedProvince, searchQuery, sortBy]);

  // Combined value calculation
  const totalValueZar = useMemo(() => {
    return savedItems.reduce((acc, curr) => acc + (curr.priceZar || 0), 0);
  }, [savedItems]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'heavy_equipment':
        return <HardHat className="w-3.5 h-3.5 text-amber-500" />;
      case 'trucks':
        return <Truck className="w-3.5 h-3.5 text-blue-500" />;
      case 'cars':
        return <Car className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <HardHat className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  const handleShareFavorites = async () => {
    if (savedItems.length === 0) return;

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://partsmart.co.za';
    let text = `📋 *Part-Smart ZA Saved Spares Wishlist (${savedItems.length} items)*\n\n`;

    savedItems.forEach((item, index) => {
      text += `${index + 1}. *${item.title}* - ${formatCurrency(item.priceZar)}\n`;
      text += `   📍 ${item.city}, ${item.province} | Make: ${item.make}\n`;
      if (item.partNumber) text += `   🔢 Part #: ${item.partNumber}\n`;
      text += `\n`;
    });

    text += `Total Value: ${formatCurrency(totalValueZar)}\n`;
    text += `Explore South Africa's Heavy Spares at ${origin}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Part-Smart ZA Saved Spares (${savedItems.length})`,
          text: text,
          url: origin
        });
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 3000);
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
    }
  };

  const handleClearAll = () => {
    if (!isConfirmingClear) {
      setIsConfirmingClear(true);
      setTimeout(() => setIsConfirmingClear(false), 4000);
      return;
    }
    clearFavorites();
    setIsConfirmingClear(false);
  };

  const handleQuickExploreCategory = (cat: CategoryType) => {
    setFilter({ category: cat, onlyFavorites: false });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="favorite-items-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl my-4 sm:my-8 relative text-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950/40 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-inner shrink-0">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Saved & Favorite Parts
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-sm">
                  {savedItems.length} {savedItems.length === 1 ? 'Part' : 'Parts'} Saved
                </span>
                <span className="text-[10px] text-slate-400 hidden md:inline font-medium">
                  Stored in local browser storage
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Quickly compare listings, inquire directly with scrap yards, or share your wishlist.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Close"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          
          {/* Top Overview & Action Bar (when there are saved items) */}
          {savedItems.length > 0 && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total Saved Inventory Value
                </span>
                <div className="text-xl sm:text-2xl font-black text-amber-400 flex items-center gap-2">
                  <span>{formatCurrency(totalValueZar)}</span>
                  <span className="text-xs text-slate-400 font-normal">
                    ({savedItems.length} {savedItems.length === 1 ? 'spare listing' : 'spare listings'})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <button
                  onClick={handleShareFavorites}
                  className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Share or copy saved items summary"
                >
                  {copiedShare ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Wishlist Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Share Wishlist</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleClearAll}
                  className={`flex-1 sm:flex-initial px-3.5 py-2 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    isConfirmingClear
                      ? 'bg-rose-600 border-rose-500 text-white animate-pulse shadow-md shadow-rose-950/40'
                      : 'bg-slate-800 hover:bg-slate-750 text-rose-300 border-slate-700 hover:border-rose-500/40'
                  }`}
                  title="Clear all saved parts from this browser"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isConfirmingClear ? 'Confirm Clear All?' : 'Clear All'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Search, Filter and Sort Controls */}
          {savedItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              {/* Search Bar */}
              <div className="sm:col-span-5 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by part, make, or part #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="sm:col-span-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as CategoryType | 'all')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="heavy_equipment">Heavy Equipment</option>
                  <option value="trucks">Commercial Trucks</option>
                  <option value="cars">Bakkies & Cars</option>
                </select>
              </div>

              {/* Province Filter */}
              <div className="sm:col-span-2">
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value as SAProvince | 'all')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">All Provinces</option>
                  {PROVINCES_LIST.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="sm:col-span-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="newest">Recently Saved</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="title">Title: A - Z</option>
                </select>
              </div>
            </div>
          )}

          {/* Results Grid / List */}
          {savedItems.length > 0 ? (
            filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredItems.map((item) => {
                  const seller = sellers.find(s => s.id === item.sellerId);
                  const waUrl = generateWhatsappInquiryUrl(item, seller);

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        incrementViews(item.id);
                        setSelectedItemForDetail(item);
                      }}
                      className="group bg-slate-950/90 p-3.5 rounded-2xl border border-slate-800 hover:border-amber-500/60 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-md hover:shadow-xl hover:shadow-amber-500/5 relative"
                    >
                      {/* Top section: Photo + Info */}
                      <div className="flex items-start gap-3">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-900 overflow-hidden border border-slate-800 shrink-0 relative">
                          <img
                            src={
                              item.images && item.images.length > 0 && item.images[0]
                                ? item.images[0]
                                : (CATEGORY_VISUALS[item.category]?.image || CATEGORY_VISUALS.heavy_equipment.image)
                            }
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const fallback = CATEGORY_VISUALS[item.category]?.image || CATEGORY_VISUALS.heavy_equipment.image;
                              if (e.currentTarget.src !== fallback) {
                                e.currentTarget.src = fallback;
                              }
                            }}
                          />
                          {item.isFeatured && (
                            <div className="absolute top-1 left-1 bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 py-0.2 rounded shadow">
                              FEATURED
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1 truncate">
                              {getCategoryIcon(item.category)}
                              <span>{item.make} • {item.subcategory}</span>
                            </span>
                            {item.partNumber && (
                              <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.2 rounded font-mono text-[9px] text-slate-300">
                                #{item.partNumber}
                              </span>
                            )}
                          </div>

                          <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                            {item.title}
                          </h3>

                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">{item.city}, {item.province}</span>
                          </div>

                          {seller && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                              <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate text-slate-300 font-medium">{seller.companyName}</span>
                              {seller.subscriptionStatus === 'active' && (
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Row: Price & Actions */}
                      <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase font-bold">Asking Price</span>
                          <div className="text-sm sm:text-base font-black text-amber-400">
                            {formatCurrency(item.priceZar)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Direct WhatsApp CTA */}
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.stopPropagation();
                              incrementViews(item.id);
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                            title="Chat with Scrap Yard on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </a>

                          {/* Direct Phone Call */}
                          <a
                            href={`tel:${item.sellerPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer"
                            title={`Call ${item.sellerPhone}`}
                          >
                            <Phone className="w-3.5 h-3.5 text-cyan-400" />
                          </a>

                          {/* Remove from Favorites Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(item.id);
                            }}
                            className="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/40 rounded-xl transition-colors cursor-pointer"
                            title="Remove from saved list"
                            aria-label="Remove from saved list"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                <Search className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-300">
                  No saved items match your filter criteria
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try clearing the search query or adjusting the category/province filters.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedProvince('all');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )
          ) : (
            /* Empty State */
            <div className="bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 text-center space-y-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto shadow-inner">
                <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-rose-500" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-base sm:text-lg font-black text-white">
                  No Saved Spares Yet
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Click the <span className="text-rose-400 font-bold">Heart icon</span> on any earthmoving machinery, commercial truck, or car part card to save it here.
                </p>
                <p className="text-[11px] text-slate-500">
                  Your saved items persist locally in your browser so you can compare prices, check part numbers, and contact scrap yards at your convenience.
                </p>
              </div>

              <div className="pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  Explore Popular Categories:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto">
                  <button
                    onClick={() => handleQuickExploreCategory('heavy_equipment')}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 border border-amber-500/30 hover:border-amber-400 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <HardHat className="w-3.5 h-3.5 text-amber-400" />
                    <span>Heavy Equipment Spares</span>
                  </button>

                  <button
                    onClick={() => handleQuickExploreCategory('trucks')}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 border border-blue-500/30 hover:border-blue-400 text-blue-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5 text-blue-400" />
                    <span>Commercial Truck Parts</span>
                  </button>

                  <button
                    onClick={() => handleQuickExploreCategory('cars')}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Car className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Bakkies & Cars</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Local Storage Active</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Sub-modals for details & contact */}
      {selectedItemForDetail && (
        <ListingDetailModal
          item={selectedItemForDetail}
          onClose={() => setSelectedItemForDetail(null)}
          onOpenSellerPortal={onOpenSellerPortal || (() => {})}
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

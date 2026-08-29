import React, { useState } from 'react';
import {
  MapPin,
  Eye,
  CheckCircle2,
  HardHat,
  Truck,
  Car,
  MessageSquare,
  Sparkles,
  AlertCircle,
  PhoneCall,
  Trash2,
  Heart
} from 'lucide-react';
import { InventoryItem } from '../types';
import { useApp } from '../context/AppContext';
import { CATEGORY_VISUALS } from '../data/categoryImages';
import { SellerContactModal } from './SellerContactModal';
import { generateWhatsappInquiryUrl } from '../lib/whatsapp';

interface InventoryCardProps {
  item: InventoryItem;
  onSelect: (item: InventoryItem) => void;
}

export const InventoryCard: React.FC<InventoryCardProps> = ({ item, onSelect }) => {
  const { sellers, incrementViews, isOwnerAdminLoggedIn, deleteInventoryItem, isFavorite, toggleFavorite } = useApp();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isFav = isFavorite(item.id);
  const seller = sellers.find(s => s.id === item.sellerId);
  const isSellerActive = seller?.subscriptionStatus === 'active';

  const handleDeleteByOwner = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      setTimeout(() => setIsConfirmingDelete(false), 4000);
      return;
    }
    deleteInventoryItem(item.id);
  };

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

  const getConditionBadge = (cond: string) => {
    switch (cond) {
      case 'new':
        return (
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
            NEW
          </span>
        );
      case 'reconditioned':
        return (
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
            RECONDITIONED
          </span>
        );
      case 'used':
        return (
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
            USED
          </span>
        );
      case 'stripping_spares':
        return (
          <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
            STRIPPING FOR SPARES
          </span>
        );
      default:
        return null;
    }
  };

  const handleCardClick = () => {
    incrementViews(item.id);
    onSelect(item);
  };

  const handleOpenContactModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsContactModalOpen(true);
  };

  const handleWhatsappClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    incrementViews(item.id);
    const waUrl = generateWhatsappInquiryUrl(item, seller);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group bg-slate-900 rounded-2xl border border-slate-800 hover:border-amber-500/50 shadow-md hover:shadow-2xl hover:shadow-amber-500/5 transition-all cursor-pointer flex flex-col overflow-hidden text-white relative"
      >
        {/* Photo Container */}
        <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
          <img
            src={item.images && item.images.length > 0 && item.images[0] ? item.images[0] : (CATEGORY_VISUALS[item.category]?.image || CATEGORY_VISUALS.heavy_equipment.image)}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const fallback = CATEGORY_VISUALS[item.category]?.image || CATEGORY_VISUALS.heavy_equipment.image;
              if (e.currentTarget.src !== fallback) {
                e.currentTarget.src = fallback;
              }
            }}
          />

          {/* Top Left: Heart Favorite Toggle & Featured Badge */}
          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(item.id);
              }}
              className={`p-1.5 rounded-full transition-all duration-200 cursor-pointer backdrop-blur-md flex items-center justify-center ${
                isFav
                  ? 'bg-rose-600 text-white border border-rose-400 shadow-md shadow-rose-950/60 scale-105 hover:bg-rose-500'
                  : 'bg-slate-950/75 hover:bg-slate-900 text-slate-300 hover:text-rose-400 border border-slate-700/60 shadow-sm hover:scale-110 active:scale-95'
              }`}
              title={isFav ? 'Remove from Favorites' : 'Save to Favorites'}
              aria-label={isFav ? 'Remove from Favorites' : 'Save to Favorites'}
            >
              <Heart className={`w-3.5 h-3.5 transition-all ${isFav ? 'fill-white text-white' : 'text-slate-200'}`} />
            </button>

            {item.isFeatured && (
              <div className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md shadow flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-slate-950" />
                FEATURED
              </div>
            )}
          </div>

          {/* Condition Badge & Owner Delete Button */}
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
            {isOwnerAdminLoggedIn && (
              <button
                type="button"
                onClick={handleDeleteByOwner}
                className={`${
                  isConfirmingDelete
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-rose-600/90 hover:bg-rose-600 text-white'
                } p-1 rounded-md shadow-lg border border-rose-400/50 flex items-center gap-1 text-[10px] font-bold px-1.5 cursor-pointer transition-all hover:scale-105`}
                title="Owner Action: Delete this listing from Part-Smart-ZA"
              >
                <Trash2 className="w-3 h-3" />
                <span>{isConfirmingDelete ? 'Confirm Delete?' : 'Delete (Owner)'}</span>
              </button>
            )}
            {getConditionBadge(item.condition)}
          </div>

          {/* Price Tag Overlay */}
          <div className="absolute bottom-2.5 left-2.5 bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-800 text-amber-400 font-black text-sm md:text-base shadow-lg z-10">
            {formatCurrency(item.priceZar)}
          </div>

          {/* Floating WhatsApp Quick Action on image */}
          <button
            type="button"
            onClick={handleWhatsappClick}
            className="absolute bottom-2.5 right-2.5 z-20 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-full shadow-xl shadow-emerald-950/50 border border-emerald-400/40 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Chat directly on WhatsApp"
          >
            <MessageSquare className="w-3.5 h-3.5 fill-white text-emerald-600" />
            <span>WhatsApp</span>
          </button>
        </div>

        {/* Card Content */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            {/* Category & Subcategory line */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                {getCategoryIcon(item.category)}
                <span className="capitalize">{item.subcategory}</span>
              </div>
              {item.partNumber && (
                <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono text-[10px]">
                  #{item.partNumber}
                </span>
              )}
            </div>

            {/* Item Title */}
            <h3 className="font-bold text-sm md:text-base text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
              {item.title}
            </h3>

            {/* Make & Model pill */}
            <div className="mt-2 text-xs text-slate-300 font-medium">
              <span className="text-amber-400 font-bold">{item.make}</span> {item.model} {item.year ? `(${item.year})` : ''}
            </div>
          </div>

          {/* Location & Seller Footer */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1 text-slate-300 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{item.city}, {item.province}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0">
                <Eye className="w-3 h-3" />
                <span>{item.views}</span>
              </div>
            </div>

            {/* Seller Name and Verification */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                {isSellerActive ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                <span className="font-semibold text-slate-300 truncate">
                  {item.sellerName}
                </span>
              </div>
            </div>

            {/* Action Buttons: WhatsApp Inquiry (Primary) + Phone/Details (Secondary) */}
            <div className="grid grid-cols-12 gap-2 pt-1">
              <button
                type="button"
                onClick={handleWhatsappClick}
                className="col-span-8 sm:col-span-9 min-h-[44px] py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-950/40 border border-emerald-400/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                title="Send pre-filled WhatsApp inquiry to seller"
              >
                <MessageSquare className="w-4 h-4 fill-white text-emerald-600 shrink-0" />
                <span className="truncate">WhatsApp Inquiry</span>
              </button>

              <button
                type="button"
                onClick={handleOpenContactModal}
                className="col-span-4 sm:col-span-3 min-h-[44px] py-2.5 px-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-[0.98]"
                title="View full seller phone and contact details"
              >
                <PhoneCall className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-semibold">Call</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Seller Contact Modal */}
      {isContactModalOpen && (
        <SellerContactModal
          item={item}
          seller={seller}
          onClose={() => setIsContactModalOpen(false)}
        />
      )}
    </>
  );
};

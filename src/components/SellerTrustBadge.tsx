import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Crown,
  Sparkles,
  Shield,
  Info
} from 'lucide-react';
import { InventoryItem, Seller } from '../types';
import { getSellerTrustInfo } from '../lib/trustBadges';
import { SellerTrustModal } from './SellerTrustModal';

export type TrustBadgeVariant = 'card-overlay' | 'card-pill' | 'card-footer' | 'inline' | 'detailed';

interface SellerTrustBadgeProps {
  seller?: Seller | null;
  item?: InventoryItem;
  variant?: TrustBadgeVariant;
  showModalOnClick?: boolean;
  className?: string;
  onBadgeClick?: (e: React.MouseEvent) => void;
}

export const SellerTrustBadge: React.FC<SellerTrustBadgeProps> = ({
  seller,
  item,
  variant = 'card-pill',
  showModalOnClick = true,
  className = '',
  onBadgeClick
}) => {
  const [isTrustModalOpen, setIsTrustModalOpen] = useState(false);

  const trustInfo = getSellerTrustInfo(seller, {
    sellerName: item?.sellerName,
    subscriptionStatus: seller?.subscriptionStatus,
    planId: seller?.planId
  });

  const renderIcon = (sizeClass = 'w-3 h-3') => {
    switch (trustInfo.iconName) {
      case 'crown':
        return <Crown className={`${sizeClass} text-amber-400 fill-amber-400/40 shrink-0`} />;
      case 'shield-check':
        return <ShieldCheck className={`${sizeClass} text-blue-400 shrink-0`} />;
      case 'check':
        return <CheckCircle2 className={`${sizeClass} text-emerald-400 shrink-0`} />;
      case 'clock':
        return <Clock className={`${sizeClass} text-amber-400 shrink-0`} />;
      default:
        return <AlertTriangle className={`${sizeClass} text-slate-400 shrink-0`} />;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBadgeClick) {
      onBadgeClick(e);
    }
    if (showModalOnClick) {
      setIsTrustModalOpen(true);
    }
  };

  // 1. Top Card Image Overlay Badge
  if (variant === 'card-overlay') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          title={`Trust Level: ${trustInfo.badgeTitle} - Click for verification details`}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider backdrop-blur-md border shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer z-10 ${
            trustInfo.tier === 'enterprise'
              ? 'bg-slate-950/90 text-amber-300 border-amber-400/60 shadow-amber-950/60 ring-1 ring-amber-400/30 hover:border-amber-300 hover:text-amber-200'
              : trustInfo.tier === 'pro'
              ? 'bg-slate-950/90 text-blue-300 border-blue-400/60 shadow-blue-950/60 ring-1 ring-blue-400/30 hover:border-blue-300 hover:text-blue-200'
              : trustInfo.tier === 'verified'
              ? 'bg-slate-950/90 text-emerald-300 border-emerald-500/50 shadow-emerald-950/50 ring-1 ring-emerald-500/25 hover:border-emerald-400 hover:text-emerald-200'
              : trustInfo.tier === 'pending'
              ? 'bg-slate-950/90 text-amber-300 border-amber-500/40'
              : 'bg-slate-950/85 text-slate-400 border-slate-700/60'
          } ${className}`}
        >
          {renderIcon('w-3.5 h-3.5')}
          <span className="truncate font-black">{trustInfo.badgeLabel}</span>
        </button>

        {isTrustModalOpen && (
          <SellerTrustModal
            seller={seller}
            item={item}
            onClose={() => setIsTrustModalOpen(false)}
          />
        )}
      </>
    );
  }

  // 2. Compact Pill for Seller Row in Cards
  if (variant === 'card-pill') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          title={`${trustInfo.badgeTitle}: Click to view yard verification`}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all hover:opacity-90 active:scale-95 cursor-pointer ${
            trustInfo.tier === 'enterprise'
              ? 'bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-yellow-500/20 text-amber-300 border-amber-400/50 hover:border-amber-300 shadow-xs'
              : trustInfo.tier === 'pro'
              ? 'bg-gradient-to-r from-blue-500/20 via-indigo-500/15 to-blue-500/20 text-blue-300 border-blue-400/50 hover:border-blue-300 shadow-xs'
              : trustInfo.tier === 'verified'
              ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:border-emerald-400 shadow-xs'
              : trustInfo.tier === 'pending'
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          } ${className}`}
        >
          {renderIcon('w-3 h-3')}
          <span className="truncate font-bold">{trustInfo.shortBadgeLabel}</span>
        </button>

        {isTrustModalOpen && (
          <SellerTrustModal
            seller={seller}
            item={item}
            onClose={() => setIsTrustModalOpen(false)}
          />
        )}
      </>
    );
  }

  // 3. Full Seller Row Component for Inventory Card Footer
  if (variant === 'card-footer') {
    const companyName = seller?.companyName || item?.sellerName || 'Scrap Yard';

    return (
      <>
        <div className={`flex items-center justify-between gap-2 text-xs pt-0.5 ${className}`}>
          {/* Left: Seller Logo / Avatar + Name */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Logo or Icon Avatar */}
            <div className="relative shrink-0">
              {seller?.logoUrl ? (
                <div className="w-6 h-6 rounded-lg bg-white p-0.5 border border-slate-700 flex items-center justify-center overflow-hidden">
                  <img
                    src={seller.logoUrl}
                    alt={companyName}
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                  {companyName.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Verified Mini Tick Badge on Avatar */}
              {trustInfo.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-slate-900 flex items-center justify-center">
                  <div className={`w-2 h-2 rounded-full ${trustInfo.tier === 'enterprise' || trustInfo.tier === 'pro' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                </div>
              )}
            </div>

            {/* Seller Company Name */}
            <span className="font-semibold text-slate-300 truncate text-xs">
              {companyName}
            </span>
          </div>

          {/* Right: Clickable Visual Trust Badge */}
          <button
            type="button"
            onClick={handleClick}
            title={`${trustInfo.badgeTitle} • Click for Trust Guarantee`}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 ${
              trustInfo.tier === 'enterprise'
                ? 'bg-amber-500/15 text-amber-300 border-amber-400/50 hover:border-amber-300 shadow-xs'
                : trustInfo.tier === 'pro'
                ? 'bg-blue-500/15 text-blue-300 border-blue-400/50 hover:border-blue-300 shadow-xs'
                : trustInfo.tier === 'verified'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/45 hover:border-emerald-400 shadow-xs'
                : trustInfo.tier === 'pending'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {renderIcon('w-3 h-3')}
            <span>{trustInfo.badgeLabel}</span>
          </button>
        </div>

        {isTrustModalOpen && (
          <SellerTrustModal
            seller={seller}
            item={item}
            onClose={() => setIsTrustModalOpen(false)}
          />
        )}
      </>
    );
  }

  // 4. Inline Minimal Badge
  return (
    <>
      <span
        onClick={handleClick}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
          trustInfo.tier === 'enterprise'
            ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
            : trustInfo.tier === 'pro'
            ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
            : trustInfo.tier === 'verified'
            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
            : 'bg-slate-800 text-slate-400 border-slate-700'
        } ${className}`}
      >
        {renderIcon('w-3 h-3')}
        <span>{trustInfo.badgeLabel}</span>
      </span>

      {isTrustModalOpen && (
        <SellerTrustModal
          seller={seller}
          item={item}
          onClose={() => setIsTrustModalOpen(false)}
        />
      )}
    </>
  );
};

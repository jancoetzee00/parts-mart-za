import React from 'react';
import {
  X,
  ShieldCheck,
  Building2,
  MapPin,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Crown,
  Sparkles,
  ExternalLink,
  Info,
  Check,
  Shield
} from 'lucide-react';
import { InventoryItem, Seller } from '../types';
import { getSellerTrustInfo } from '../lib/trustBadges';
import { generateWhatsappInquiryUrl } from '../lib/whatsapp';

interface SellerTrustModalProps {
  seller?: Seller | null;
  item?: InventoryItem;
  onClose: () => void;
}

export const SellerTrustModal: React.FC<SellerTrustModalProps> = ({
  seller,
  item,
  onClose
}) => {
  const trustInfo = getSellerTrustInfo(seller, {
    sellerName: item?.sellerName,
    subscriptionStatus: seller?.subscriptionStatus,
    planId: seller?.planId
  });

  const companyName = seller?.companyName || item?.sellerName || 'Scrap Yard';
  const city = seller?.city || item?.city || 'South Africa';
  const province = seller?.province || item?.province || 'Gauteng';
  const address = seller?.address || 'Direct Yard Premises';
  const phone = seller?.phone || item?.sellerPhone || '';
  const whatsapp = seller?.whatsapp || item?.sellerWhatsapp || '';

  const renderIcon = (sizeClass = 'w-5 h-5') => {
    switch (trustInfo.iconName) {
      case 'crown':
        return <Crown className={`${sizeClass} text-amber-400 fill-amber-400/30`} />;
      case 'shield-check':
        return <ShieldCheck className={`${sizeClass} text-blue-400`} />;
      case 'check':
        return <CheckCircle2 className={`${sizeClass} text-emerald-400`} />;
      case 'clock':
        return <Clock className={`${sizeClass} text-amber-400`} />;
      default:
        return <AlertTriangle className={`${sizeClass} text-slate-400`} />;
    }
  };

  const handleWhatsapp = () => {
    if (item) {
      const waUrl = generateWhatsappInquiryUrl(item, seller);
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } else if (whatsapp) {
      window.open(`https://wa.me/${whatsapp.replace(/\+/g, '')}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCall = () => {
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  };

  return (
    <div
      className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl text-white my-auto flex flex-col animate-fadeIn">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${trustInfo.themeColor.pillBg} flex items-center justify-center`}>
              {renderIcon('w-5 h-5')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Yard Trust & Verification</h3>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${trustInfo.themeColor.pillBg}`}>
                  {trustInfo.badgeLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400">{companyName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Main Yard Banner Card */}
          <div className={`p-5 rounded-2xl border ${trustInfo.themeColor.border} bg-slate-950 flex flex-col sm:flex-row items-start sm:items-center gap-4 relative overflow-hidden`}>
            {/* Background Glow */}
            <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${trustInfo.themeColor.bg}`} />
            
            {/* Yard Logo or Icon */}
            <div className="w-16 h-16 rounded-2xl bg-white p-1 border-2 border-slate-700 shadow-md flex items-center justify-center overflow-hidden shrink-0">
              {seller?.logoUrl ? (
                <img
                  src={seller.logoUrl}
                  alt={companyName}
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Building2 className="w-8 h-8 text-slate-800" />
              )}
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-lg font-black text-white">{companyName}</h4>
                {trustInfo.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                    <Check className="w-3 h-3" /> Verified Status
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {trustInfo.tagline}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{city}, {province}</span>
              </div>
            </div>
          </div>

          {/* Trust Tier Description */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Verification & Trust Breakdown
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {trustInfo.description}
            </p>
            {trustInfo.responseTime && (
              <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Response Speed: <strong className="text-white">{trustInfo.responseTime}</strong></span>
              </div>
            )}
          </div>

          {/* Verified Credentials Checklist */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Verified Yard Credentials
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {trustInfo.trustPerks.map((perk, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Buyer Safety Guarantee Note */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>Part-Smart ZA Direct Yard Guarantee</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {trustInfo.guaranteeNotice} Always confirm the part number, engine/gearbox code, and photos via direct WhatsApp chat before payment or courier dispatch.
            </p>
          </div>

          {/* Contact Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleWhatsapp}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 fill-white text-emerald-600" />
              <span>WhatsApp Direct Line</span>
            </button>

            {phone && (
              <button
                onClick={handleCall}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-850 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Phone className="w-4 h-4 text-amber-400" />
                <span>Call Yard: {phone}</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

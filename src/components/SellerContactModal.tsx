import React, { useState } from 'react';
import {
  X,
  Phone,
  Mail,
  MessageSquare,
  Copy,
  Check,
  Building2,
  MapPin,
  Send,
  User,
  ShieldCheck,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { InventoryItem, Seller } from '../types';
import { generateWhatsappInquiryUrl } from '../lib/whatsapp';

interface SellerContactModalProps {
  item: InventoryItem;
  seller?: Seller;
  onClose: () => void;
}

export const SellerContactModal: React.FC<SellerContactModalProps> = ({
  item,
  seller,
  onClose
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  // Pre-filled values
  const sellerPhone = seller?.phone || item.sellerPhone || '+27 82 000 0000';
  const sellerEmail = seller?.email || `sales@${(seller?.companyName || item.sellerName).toLowerCase().replace(/[^a-z0-9]/g, '')}.co.za`;
  const sellerWhatsapp = seller?.whatsapp || item.sellerWhatsapp || sellerPhone.replace(/\+/g, '');
  const contactName = seller?.contactName || 'Sales Desk';
  const companyName = seller?.companyName || item.sellerName;

  const [buyerName, setBuyerName] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [inquiryText, setInquiryText] = useState(
    `Hello ${contactName},\n\nI am interested in your listing "${item.title}" (R${new Intl.NumberFormat('en-ZA').format(item.priceZar)}) listed on Part-Smart-ZA.\nPart No: ${item.partNumber || 'N/A'}\n\nPlease let me know if this item is currently available and if delivery or collection can be arranged.\n\nThank you!`
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleCopy = (text: string, type: 'phone' | 'email' | 'message') => {
    navigator.clipboard.writeText(text);
    if (type === 'phone') {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } else if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else if (type === 'message') {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    }
  };

  const handleCall = () => {
    window.open(`tel:${sellerPhone}`, '_self');
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Inquiry: ${item.title} (Part-Smart-ZA)`);
    const bodyText = `${inquiryText}\n\nSender Name: ${buyerName || 'Interested Buyer'}\nSender Contact: ${buyerContact || 'Not provided'}`;
    const mailtoUrl = `mailto:${sellerEmail}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
    window.open(mailtoUrl, '_blank');
    setEmailSentSuccess(true);
  };

  const handleWhatsapp = () => {
    const waUrl = generateWhatsappInquiryUrl(item, seller);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-white my-auto flex flex-col">
        
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">{companyName}</h3>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified Yard
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" /> {item.city}, {item.province} | Attn: <span className="text-slate-200 font-semibold">{contactName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Target Inventory Item Preview Box */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
            {item.images && item.images.length > 0 ? (
              <img
                src={item.images[0]}
                alt={item.title}
                className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Inquiring About Item</span>
              <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <span className="font-extrabold text-amber-400">{formatCurrency(item.priceZar)}</span>
                {item.partNumber && <span>Part #{item.partNumber}</span>}
                <span className="capitalize">{item.condition.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Quick Pre-filled Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Phone Card */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-400" /> Pre-filled Phone
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(sellerPhone, 'phone')}
                  className="text-[11px] font-semibold text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedPhone ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Copied
                    </span>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </>
                  )}
                </button>
              </div>

              <div className="text-base font-extrabold text-white font-mono tracking-wide">
                {sellerPhone}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCall}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Now
                </button>
                <button
                  type="button"
                  onClick={handleWhatsapp}
                  className="py-2 px-3 bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-emerald-500/30 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                </button>
              </div>
            </div>

            {/* Email Card */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-blue-400" /> Pre-filled Email
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(sellerEmail, 'email')}
                  className="text-[11px] font-semibold text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedEmail ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Copied
                    </span>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs font-bold text-blue-300 font-mono truncate tracking-tight">
                {sellerEmail}
              </div>

              <a
                href={`mailto:${sellerEmail}?subject=${encodeURIComponent(`Inquiry: ${item.title}`)}&body=${encodeURIComponent(inquiryText)}`}
                className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors w-full text-center block"
              >
                <Mail className="w-3.5 h-3.5" /> Open Email Client
              </a>
            </div>

          </div>

          {/* Pre-filled Direct Message/Email Composer */}
          <form onSubmit={handleSendEmail} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Send className="w-4 h-4" /> Send Email Inquiry
              </h4>
              <button
                type="button"
                onClick={() => handleCopy(inquiryText, 'message')}
                className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedMessage ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <Check className="w-3.5 h-3.5" /> Message Copied
                  </span>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Message Text
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" /> Your Name
                </label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="e.g. Mike Henderson"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" /> Your Phone / Email
                </label>
                <input
                  type="text"
                  value={buyerContact}
                  onChange={(e) => setBuyerContact(e.target.value)}
                  placeholder="e.g. +27 83 555 1234 or mike@work.co.za"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-slate-400 font-semibold">Pre-filled Message Text</label>
              <textarea
                rows={4}
                value={inquiryText}
                onChange={(e) => setInquiryText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500/50 leading-relaxed"
              />
            </div>

            {emailSentSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>Email client opened! If your default mail application didn't open, copy the email address or message above.</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Send Pre-filled Email to {companyName}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};

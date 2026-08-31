import React, { useState, useMemo } from 'react';
import {
  X,
  Flame,
  Trophy,
  Tag,
  PlusCircle,
  Clock,
  Sparkles,
  MessageCircle,
  Phone,
  CheckCircle2,
  Calendar,
  Share2,
  Filter,
  Search,
  Award,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Building2,
  Gift,
  ExternalLink,
  Info,
  Check,
  Trash2,
  Eye
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryType, SAProvince, SellerSpecial, SellerCompetition } from '../types';
import { PROVINCES_LIST } from '../data/initialData';
import { generateWhatsappSpecialInquiryUrl, formatWhatsappPhoneNumber } from '../lib/whatsapp';

interface SpecialsAndCompetitionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSellerPortal?: () => void;
  initialTab?: 'specials' | 'competitions' | 'post_special' | 'enter_competition';
  selectedCompetitionId?: string;
}

export const SpecialsAndCompetitionsModal: React.FC<SpecialsAndCompetitionsModalProps> = ({
  isOpen,
  onClose,
  onOpenSellerPortal,
  initialTab = 'specials',
  selectedCompetitionId
}) => {
  const {
    specials,
    competitions,
    competitionEntries,
    sellers,
    activeSeller,
    isOwnerAdminLoggedIn,
    addSpecial,
    deleteSpecial,
    incrementSpecialViews,
    submitCompetitionEntry
  } = useApp();

  const [activeTab, setActiveTab] = useState<'specials' | 'competitions' | 'post_special' | 'enter_competition'>(initialTab);
  const [selectedCompId, setSelectedCompId] = useState<string>(selectedCompetitionId || competitions[0]?.id || '');
  const [categoryFilter, setCategoryFilter] = useState<CategoryType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLinkSpecialId, setCopiedLinkSpecialId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states for posting a special
  const [specialForm, setSpecialForm] = useState({
    sellerId: activeSeller?.id || (sellers[0]?.id || ''),
    title: '',
    category: 'heavy_equipment' as CategoryType,
    subcategory: 'Hydraulics & Pumps',
    badge: 'FLASH SPECIAL',
    originalPriceZar: '',
    specialPriceZar: '',
    description: '',
    terms: 'Valid while stocks last or until promotional expiration. Price excludes VAT.',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    imageUrl: ''
  });

  // Form states for entering a competition
  const [entryForm, setEntryForm] = useState({
    competitionId: selectedCompetitionId || competitions[0]?.id || '',
    sellerId: activeSeller?.id || (sellers[0]?.id || ''),
    entryTitle: '',
    entryDescription: '',
    imageUrl: '',
    proofMetrics: ''
  });

  // Selected competition details
  const activeCompetition = competitions.find(c => c.id === selectedCompId) || competitions[0];

  // Filtered Specials
  const filteredSpecials = useMemo(() => {
    return specials.filter(special => {
      const matchesCategory = categoryFilter === 'all' || special.category === categoryFilter;
      const matchesSearch =
        searchQuery === '' ||
        special.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        special.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        special.sellerCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        special.badge.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [specials, categoryFilter, searchQuery]);

  // Handle Share / Copy Link
  const handleCopyLink = (special: SellerSpecial) => {
    const shareUrl = `${window.location.origin}?specialId=${special.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLinkSpecialId(special.id);
      setTimeout(() => setCopiedLinkSpecialId(null), 2500);
    });
  };

  // Helper for discount percentage calculation
  const calculateDiscount = (orig: number, spec: number) => {
    if (!orig || orig <= spec) return 0;
    return Math.round(((orig - spec) / orig) * 100);
  };

  // Helper for days remaining
  const getDaysRemaining = (isoDateStr: string) => {
    const diff = new Date(isoDateStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Expired';
    if (days === 0) return 'Ends Today!';
    return `${days} days left`;
  };

  // Submit Special Form
  const handleCreateSpecial = (e: React.FormEvent) => {
    e.preventDefault();
    const origPrice = parseFloat(specialForm.originalPriceZar);
    const specPrice = parseFloat(specialForm.specialPriceZar);

    if (!specialForm.title.trim()) {
      setNotification({ type: 'error', message: 'Please enter a title for your special.' });
      return;
    }
    if (!origPrice || !specPrice || specPrice <= 0) {
      setNotification({ type: 'error', message: 'Please enter valid regular and special prices.' });
      return;
    }
    if (specPrice >= origPrice) {
      setNotification({ type: 'error', message: 'Special price must be lower than the regular price.' });
      return;
    }

    const sellerObj = sellers.find(s => s.id === specialForm.sellerId) || activeSeller || sellers[0];
    if (!sellerObj) {
      setNotification({ type: 'error', message: 'Please select a registered seller yard.' });
      return;
    }

    const newSpecial = addSpecial({
      sellerId: sellerObj.id,
      sellerName: sellerObj.companyName,
      sellerPhone: sellerObj.phone,
      sellerWhatsapp: sellerObj.whatsapp,
      sellerCity: sellerObj.city,
      sellerProvince: sellerObj.province,
      title: specialForm.title.trim(),
      category: specialForm.category,
      subcategory: specialForm.subcategory,
      badge: specialForm.badge.trim() || `${calculateDiscount(origPrice, specPrice)}% OFF`,
      originalPriceZar: origPrice,
      specialPriceZar: specPrice,
      description: specialForm.description.trim() || 'Genuine inspected part in high-grade condition.',
      terms: specialForm.terms.trim(),
      expiresAt: new Date(specialForm.expiresAt).toISOString(),
      imageUrl: specialForm.imageUrl.trim() || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      isFeatured: true
    });

    setNotification({
      type: 'success',
      message: `🎉 Special "${newSpecial.title}" is now live on the Part-Smart ZA marketplace!`
    });
    setActiveTab('specials');

    // Reset form
    setSpecialForm(prev => ({
      ...prev,
      title: '',
      originalPriceZar: '',
      specialPriceZar: '',
      description: '',
      imageUrl: ''
    }));
  };

  // Submit Competition Entry
  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryForm.entryTitle.trim()) {
      setNotification({ type: 'error', message: 'Please enter a title for your challenge entry.' });
      return;
    }
    if (!entryForm.entryDescription.trim()) {
      setNotification({ type: 'error', message: 'Please provide details or a description of your entry.' });
      return;
    }

    const sellerObj = sellers.find(s => s.id === entryForm.sellerId) || activeSeller || sellers[0];
    if (!sellerObj) {
      setNotification({ type: 'error', message: 'Please select a registered seller yard.' });
      return;
    }

    submitCompetitionEntry({
      competitionId: entryForm.competitionId || competitions[0]?.id || 'comp-1',
      sellerId: sellerObj.id,
      sellerName: sellerObj.companyName,
      sellerWhatsapp: sellerObj.whatsapp,
      sellerCity: sellerObj.city,
      entryTitle: entryForm.entryTitle.trim(),
      entryDescription: entryForm.entryDescription.trim(),
      imageUrl: entryForm.imageUrl.trim() || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      proofMetrics: entryForm.proofMetrics.trim() || 'Verified yard submission'
    });

    setNotification({
      type: 'success',
      message: '🏆 Your yard challenge entry has been successfully submitted and logged in the competition!'
    });
    setActiveTab('competitions');

    setEntryForm(prev => ({
      ...prev,
      entryTitle: '',
      entryDescription: '',
      imageUrl: '',
      proofMetrics: ''
    }));
  };

  if (!isOpen) return null;

  return (
    <div
      id="specials-competitions-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="relative bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 p-5 sm:p-6 text-white shrink-0 overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-950/40 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
                <Flame className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Seller Specials & Yard Challenges
                  </h2>
                  <span className="bg-amber-400 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                    Part-Smart ZA
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-amber-100/90 mt-0.5">
                  Exclusive flash clearance deals, heavy equipment bundles, and nationwide scrapyard trophy competitions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="close-specials-modal-btn"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-950/40 hover:bg-slate-950/70 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/15 text-xs">
            <div className="bg-slate-950/30 rounded-lg p-2 flex items-center gap-2 border border-white/10">
              <Flame className="w-4 h-4 text-amber-300 shrink-0" />
              <div>
                <div className="font-bold text-white">{specials.length} Active Specials</div>
                <div className="text-[10px] text-amber-200/80">Up to 45% Discounts</div>
              </div>
            </div>

            <div className="bg-slate-950/30 rounded-lg p-2 flex items-center gap-2 border border-white/10">
              <Trophy className="w-4 h-4 text-amber-300 shrink-0" />
              <div>
                <div className="font-bold text-white">{competitions.length} Live Competitions</div>
                <div className="text-[10px] text-amber-200/80">R45,000+ Prize Pools</div>
              </div>
            </div>

            <div className="bg-slate-950/30 rounded-lg p-2 flex items-center gap-2 border border-white/10">
              <Building2 className="w-4 h-4 text-amber-300 shrink-0" />
              <div>
                <div className="font-bold text-white">{sellers.length} Verified Yards</div>
                <div className="text-[10px] text-amber-200/80">Nationwide Network</div>
              </div>
            </div>

            <div className="bg-slate-950/30 rounded-lg p-2 flex items-center gap-2 border border-white/10">
              <Zap className="w-4 h-4 text-amber-300 shrink-0" />
              <div>
                <div className="font-bold text-white">Direct WhatsApp</div>
                <div className="text-[10px] text-amber-200/80">Instant Yard Quotes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              id="tab-view-specials"
              onClick={() => setActiveTab('specials')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'specials'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Active Specials & Clearance ({specials.length})</span>
            </button>

            <button
              id="tab-view-competitions"
              onClick={() => setActiveTab('competitions')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'competitions'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Yard Competitions & Leaderboard ({competitions.length})</span>
            </button>

            <button
              id="tab-post-special"
              onClick={() => setActiveTab('post_special')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'post_special'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-orange-400 hover:text-orange-300 hover:bg-orange-950/40 border border-orange-500/30'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Post a Special (Sellers)</span>
            </button>

            <button
              id="tab-enter-competition"
              onClick={() => setActiveTab('enter_competition')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'enter_competition'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-500/30'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Submit Challenge Entry</span>
            </button>
          </div>

          {activeSeller && (
            <div className="hidden lg:flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-slate-400">Yard logged in:</span>
              <span className="font-bold text-white">{activeSeller.companyName}</span>
            </div>
          )}
        </div>

        {/* Global Notification Banner */}
        {notification && (
          <div
            className={`px-4 py-2.5 text-xs flex items-center justify-between border-b ${
              notification.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/80 border-rose-800 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-900/60">
          {/* TAB 1: ACTIVE SPECIALS */}
          {activeTab === 'specials' && (
            <div className="space-y-6">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  <span className="text-xs text-slate-400 font-semibold mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-amber-400" /> Filter:
                  </span>
                  {(['all', 'heavy_equipment', 'trucks', 'minibus_taxis', 'cars'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        categoryFilter === cat
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {cat === 'all'
                        ? 'All Specials'
                        : cat === 'heavy_equipment'
                        ? 'Heavy Equipment'
                        : cat === 'trucks'
                        ? 'Truck Parts'
                        : cat === 'minibus_taxis'
                        ? 'Minibus / Taxi'
                        : 'Car & Bakkie Spares'}
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search specials, yards, parts..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Specials Grid */}
              {filteredSpecials.length === 0 ? (
                <div className="text-center py-12 bg-slate-950/40 rounded-2xl border border-slate-800 p-6">
                  <Flame className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white">No promotional specials found</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    No specials match your current filter. Check back soon or post a special deal for your yard!
                  </p>
                  <button
                    onClick={() => setActiveTab('post_special')}
                    className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Post First Special</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSpecials.map(special => {
                    const discount = calculateDiscount(special.originalPriceZar, special.specialPriceZar);
                    const savings = special.originalPriceZar - special.specialPriceZar;
                    const daysLeft = getDaysRemaining(special.expiresAt);
                    const whatsappUrl = generateWhatsappSpecialInquiryUrl(special);

                    return (
                      <div
                        key={special.id}
                        className="group bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-xl hover:shadow-amber-500/5"
                      >
                        {/* Image & Badges */}
                        <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                          <img
                            src={special.imageUrl}
                            alt={special.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>

                          {/* Promotional Badge */}
                          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                            <span className="bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                              {special.badge}
                            </span>
                            {discount > 0 && (
                              <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
                                -{discount}%
                              </span>
                            )}
                          </div>

                          {/* Days Left Badge */}
                          <div className="absolute top-2.5 right-2.5">
                            <span className="bg-slate-950/80 backdrop-blur-sm border border-slate-700 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                              <Clock className="w-3 h-3" />
                              {daysLeft}
                            </span>
                          </div>

                          {/* Category Tag */}
                          <div className="absolute bottom-2.5 left-2.5">
                            <span className="bg-slate-900/90 text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-700">
                              {special.category.replace('_', ' ').toUpperCase()} • {special.subcategory}
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            {/* Seller & Location */}
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                              <span className="font-semibold text-amber-400 truncate max-w-[200px]" title={special.sellerName}>
                                {special.sellerName}
                              </span>
                              <span>{special.sellerCity}, {special.sellerProvince}</span>
                            </div>

                            {/* Title */}
                            <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
                              {special.title}
                            </h4>

                            {/* Description */}
                            <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                              {special.description}
                            </p>
                          </div>

                          {/* Pricing Box */}
                          <div className="pt-2 border-t border-slate-800/80">
                            <div className="flex items-baseline justify-between">
                              <div>
                                <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                                  Special Offer Price
                                </span>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-lg font-black text-amber-400">
                                    {new Intl.NumberFormat('en-ZA', {
                                      style: 'currency',
                                      currency: 'ZAR',
                                      maximumFractionDigits: 0
                                    }).format(special.specialPriceZar)}
                                  </span>
                                  <span className="text-xs text-slate-500 line-through">
                                    {new Intl.NumberFormat('en-ZA', {
                                      style: 'currency',
                                      currency: 'ZAR',
                                      maximumFractionDigits: 0
                                    }).format(special.originalPriceZar)}
                                  </span>
                                </div>
                              </div>

                              {savings > 0 && (
                                <div className="text-right">
                                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                                    Save {new Intl.NumberFormat('en-ZA', {
                                      style: 'currency',
                                      currency: 'ZAR',
                                      maximumFractionDigits: 0
                                    }).format(savings)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {special.terms && (
                              <p className="text-[10px] text-slate-500 italic mt-1.5 line-clamp-1" title={special.terms}>
                                * {special.terms}
                              </p>
                            )}

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-2 mt-3 pt-2">
                              {/* WhatsApp Claim Button */}
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => incrementSpecialViews(special.id)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
                              >
                                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>Claim on WhatsApp</span>
                              </a>

                              {/* Call Yard Button */}
                              <a
                                href={`tel:${special.sellerPhone}`}
                                onClick={() => incrementSpecialViews(special.id)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
                              >
                                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>Call Yard</span>
                              </a>
                            </div>

                            {/* Secondary Actions (Copy Link & Admin Delete) */}
                            <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
                              <button
                                onClick={() => handleCopyLink(special)}
                                className="hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                {copiedLinkSpecialId === special.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400 font-bold">Link Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Share2 className="w-3 h-3" />
                                    <span>Share Deal</span>
                                  </>
                                )}
                              </button>

                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-slate-500">
                                  <Eye className="w-3 h-3" /> {special.views || 0}
                                </span>

                                {(isOwnerAdminLoggedIn || activeSeller?.id === special.sellerId) && (
                                  <button
                                    onClick={() => deleteSpecial(special.id)}
                                    className="text-rose-400 hover:text-rose-300 p-1 transition-colors cursor-pointer"
                                    title="Delete Special"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: YARD COMPETITIONS & LEADERBOARD */}
          {activeTab === 'competitions' && (
            <div className="space-y-6">
              {/* Competition Selector Tabs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {competitions.map(comp => (
                  <button
                    key={comp.id}
                    onClick={() => setSelectedCompId(comp.id)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                      activeCompetition?.id === comp.id
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      activeCompetition?.id === comp.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-amber-400'
                    }`}>
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                          {comp.status === 'active' ? '⚡ Active Competition' : '🏁 Completed'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {getDaysRemaining(comp.endDate)}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-white mt-0.5">{comp.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{comp.tagline}</p>
                      <div className="mt-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded inline-block">
                        🎁 {comp.prizePool}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Active Competition Deep Dive */}
              {activeCompetition && (
                <div className="space-y-6">
                  {/* Hero Showcase Card */}
                  <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden p-6">
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                      <div className="lg:col-span-2 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                            Challenge Spotlight
                          </span>
                          <span className="text-xs text-slate-400">
                            {activeCompetition.participantsCount || 30}+ Registered Yards Competing
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white">
                          {activeCompetition.title}
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {activeCompetition.description}
                        </p>

                        {/* Prizes Breakdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                          {activeCompetition.prizes.map((prize, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border ${
                                idx === 0
                                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                  : idx === 1
                                  ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                                  : 'bg-orange-950/30 border-orange-900/40 text-orange-300'
                              }`}
                            >
                              <div className="font-black text-xs uppercase flex items-center justify-between">
                                <span>{prize.rank}</span>
                                <span className="text-base">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                              </div>
                              <p className="text-xs font-semibold text-white mt-1 leading-snug">
                                {prize.reward}
                              </p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                Badge: {prize.badge}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* CTA button */}
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              setSelectedCompId(activeCompetition.id);
                              setEntryForm(prev => ({ ...prev, competitionId: activeCompetition.id }));
                              setActiveTab('enter_competition');
                            }}
                            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                          >
                            <Award className="w-4 h-4" />
                            <span>Submit Yard Challenge Entry</span>
                          </button>
                        </div>
                      </div>

                      {/* Rules & Criteria Side Card */}
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
                        <h4 className="font-bold text-white flex items-center gap-1.5 text-sm border-b border-slate-800 pb-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>Competition Rules & Criteria</span>
                        </h4>
                        
                        <div className="space-y-2">
                          <span className="text-[10px] uppercase font-bold text-amber-400 block">Judging Criteria:</span>
                          <ul className="space-y-1 text-slate-300">
                            {activeCompetition.criteria.map((cr, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <span>{cr}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-1 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                          <span className="text-[10px] uppercase font-bold text-slate-300 block">Official Guidelines:</span>
                          {activeCompetition.rules.map((rule, idx) => (
                            <p key={idx}>• {rule}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Leaderboard Table */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="text-base font-black text-white flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-amber-400" />
                          <span>Live Yard Standings & Leaderboard</span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          Updated in real-time based on verified inventory listings and buyer WhatsApp response times.
                        </p>
                      </div>

                      <span className="text-xs bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1 rounded-lg">
                        Competition window: Aug - Sep 2026
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {activeCompetition.leaderboard.map((item, index) => (
                        <div
                          key={item.sellerId}
                          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                            index === 0
                              ? 'bg-amber-500/10 border-amber-500/40 text-white'
                              : index === 1
                              ? 'bg-slate-900 border-slate-700/80 text-slate-200'
                              : index === 2
                              ? 'bg-orange-950/20 border-orange-900/30 text-slate-200'
                              : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                              index === 0
                                ? 'bg-amber-500 text-slate-950'
                                : index === 1
                                ? 'bg-slate-400 text-slate-950'
                                : index === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              #{item.rank}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{item.sellerName}</span>
                                <span className="text-xs font-semibold px-2 py-0.2 rounded bg-slate-800 text-amber-300 border border-slate-700">
                                  {item.badgeTitle}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{item.city}, {item.province}</span>
                                {item.highlightNote && (
                                  <>
                                    <span>•</span>
                                    <span className="text-slate-300 italic">{item.highlightNote}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="sm:text-right shrink-0">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              {item.metricLabel}
                            </span>
                            <span className="text-sm font-black text-amber-400">
                              {item.metricValue}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submitted Showcase Entries Gallery */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-black text-white flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-amber-400" />
                          <span>Submitted Yard Showcase Highlights</span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          Rare salvage finds, machinery rebuilds, and truck overhauls submitted by contestants.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedCompId(activeCompetition.id);
                          setActiveTab('enter_competition');
                        }}
                        className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Submit Yours</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {competitionEntries.map(entry => (
                        <div
                          key={entry.id}
                          className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                {entry.sellerName} ({entry.sellerCity})
                              </span>
                              <h5 className="font-bold text-white text-sm mt-1">{entry.entryTitle}</h5>
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {new Date(entry.submittedAt).toLocaleDateString('en-ZA')}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            {entry.entryDescription}
                          </p>

                          {entry.proofMetrics && (
                            <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                              📊 {entry.proofMetrics}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: POST A SELLER SPECIAL FORM */}
          {activeTab === 'post_special' && (
            <div className="max-w-3xl mx-auto bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
                    <PlusCircle className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-white">Post a Special or Flash Deal</h3>
                    <p className="text-xs text-slate-400">
                      Promote surplus parts, discounted machinery assemblies, and clearance bundles to buyers across South Africa.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreateSpecial} className="space-y-4">
                {/* Yard Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Your Registered Scrap Yard / Seller Account *
                  </label>
                  <select
                    value={specialForm.sellerId}
                    onChange={e => setSpecialForm(prev => ({ ...prev, sellerId: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  >
                    {sellers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.companyName} ({s.city}, {s.province}) — {s.phone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Special Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Special Title / Deal Headline *
                  </label>
                  <input
                    type="text"
                    value={specialForm.title}
                    onChange={e => setSpecialForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., CAT 320D Main Hydraulic Pump (Refurbished 6-Mo Warranty)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                {/* Category & Subcategory */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
                    <select
                      value={specialForm.category}
                      onChange={e => setSpecialForm(prev => ({ ...prev, category: e.target.value as CategoryType }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="heavy_equipment">Heavy Machinery & Plant</option>
                      <option value="trucks">Commercial Trucks & Trailers</option>
                      <option value="minibus_taxis">Minibus / Taxi Spares</option>
                      <option value="cars">Cars & Bakkies</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Promo Badge Text</label>
                    <input
                      type="text"
                      value={specialForm.badge}
                      onChange={e => setSpecialForm(prev => ({ ...prev, badge: e.target.value }))}
                      placeholder="e.g., 30% OFF FLASH DEAL, BUNDLE COMBO, FREE COURIER"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Pricing Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Regular Price (ZAR) *
                    </label>
                    <input
                      type="number"
                      value={specialForm.originalPriceZar}
                      onChange={e => setSpecialForm(prev => ({ ...prev, originalPriceZar: e.target.value }))}
                      placeholder="48000"
                      min="1"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-amber-400 mb-1">
                      Promotional Special Price (ZAR) *
                    </label>
                    <input
                      type="number"
                      value={specialForm.specialPriceZar}
                      onChange={e => setSpecialForm(prev => ({ ...prev, specialPriceZar: e.target.value }))}
                      placeholder="34500"
                      min="1"
                      className="w-full bg-slate-950 border border-amber-500/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  {specialForm.originalPriceZar && specialForm.specialPriceZar && (
                    <div className="sm:col-span-2 text-xs text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 flex items-center justify-between">
                      <span>
                        Calculated Discount: {calculateDiscount(parseFloat(specialForm.originalPriceZar), parseFloat(specialForm.specialPriceZar))}% OFF
                      </span>
                      <span>
                        Buyer Saves: R{Math.max(0, parseFloat(specialForm.originalPriceZar) - parseFloat(specialForm.specialPriceZar)).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Expiry Date & Image URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Special Expiration Date *
                    </label>
                    <input
                      type="date"
                      value={specialForm.expiresAt}
                      onChange={e => setSpecialForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Part Photo Image URL
                    </label>
                    <input
                      type="url"
                      value={specialForm.imageUrl}
                      onChange={e => setSpecialForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Description & Terms */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Special Description & Condition Details
                  </label>
                  <textarea
                    rows={3}
                    value={specialForm.description}
                    onChange={e => setSpecialForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the condition, testing, warranty, and courier dispatch options..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Terms & Conditions Note
                  </label>
                  <input
                    type="text"
                    value={specialForm.terms}
                    onChange={e => setSpecialForm(prev => ({ ...prev, terms: e.target.value }))}
                    placeholder="e.g., Valid while stock lasts or exchange unit required."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('specials')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <Flame className="w-4 h-4" />
                    <span>Publish Special Deal</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: SUBMIT COMPETITION ENTRY FORM */}
          {activeTab === 'enter_competition' && (
            <div className="max-w-3xl mx-auto bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Award className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-white">Enter a Yard Challenge</h3>
                    <p className="text-xs text-slate-400">
                      Submit your best machine overhaul, rare salvage discovery, or fastest quote milestone into our trophy challenges.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmitEntry} className="space-y-4">
                {/* Competition Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Active Competition *
                  </label>
                  <select
                    value={entryForm.competitionId}
                    onChange={e => setEntryForm(prev => ({ ...prev, competitionId: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  >
                    {competitions.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.title} — Prize: {c.prizePool}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Yard Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Your Registered Scrap Yard Account *
                  </label>
                  <select
                    value={entryForm.sellerId}
                    onChange={e => setEntryForm(prev => ({ ...prev, sellerId: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  >
                    {sellers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.companyName} ({s.city}, {s.province})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Entry Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Showcase Entry Title *
                  </label>
                  <input
                    type="text"
                    value={entryForm.entryTitle}
                    onChange={e => setEntryForm(prev => ({ ...prev, entryTitle: e.target.value }))}
                    placeholder="e.g., Complete Overhaul of 50-Ton Excavator Final Drive with 24-hr Turnaround"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                {/* Metrics */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Key Performance Metrics / Stats Proof
                  </label>
                  <input
                    type="text"
                    value={entryForm.proofMetrics}
                    onChange={e => setEntryForm(prev => ({ ...prev, proofMetrics: e.target.value }))}
                    placeholder="e.g., 180 parts listed • 3.5 min average WhatsApp quote time • Bench tested at 350 bar"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Story & Showcase Description *
                  </label>
                  <textarea
                    rows={4}
                    value={entryForm.entryDescription}
                    onChange={e => setEntryForm(prev => ({ ...prev, entryDescription: e.target.value }))}
                    placeholder="Describe how your yard completed this rebuild, stripped this fleet, or maintained world-class customer response..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                    required
                  />
                </div>

                {/* Photo URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Showcase Photo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={entryForm.imageUrl}
                    onChange={e => setEntryForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('competitions')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Submit Challenge Entry</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

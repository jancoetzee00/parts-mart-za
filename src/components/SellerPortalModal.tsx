import React, { useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Building2,
  PlusCircle,
  Edit2,
  Trash2,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  HardHat,
  Eye,
  Send,
  Lock,
  Copy,
  Info,
  Check,
  Zap,
  ArrowRight,
  ShieldCheck,
  Star,
  Layers,
  Flame,
  Trophy,
  MessageSquare,
  ExternalLink,
  QrCode,
  Printer,
  Download,
  Share2,
  Smartphone,
  Tag
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUBSCRIPTION_PLANS, PROVINCES_LIST, SUBCATEGORIES } from '../data/initialData';
import { generateWhatsappInquiryUrl, buildWhatsappInquiryText } from '../lib/whatsapp';
import {
  InventoryItem,
  Seller,
  SubscriptionPlanId,
  CategoryType,
  PartCondition,
  SAProvince
} from '../types';

interface SellerPortalModalProps {
  onClose: () => void;
  onOpenOwnerAdmin: () => void;
  onOpenSpecialsCompetitions?: () => void;
}

export const SellerPortalModal: React.FC<SellerPortalModalProps> = ({
  onClose,
  onOpenOwnerAdmin,
  onOpenSpecialsCompetitions
}) => {
  const {
    sellers,
    activeSeller,
    setActiveSellerId,
    registerSeller,
    updateSeller,
    updateSellerOutOfOffice,
    ownerSettings,
    subscriptionPlans,
    promotionalCampaign,
    getPlanEffectivePricing,
    submitPaymentProof,
    getSellerListings,
    getSellerSpecials,
    getSellerEntries,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem
  } = useApp();

  const [activeTab, setActiveTab] = useState<'inventory' | 'subscription' | 'outofoffice' | 'switch_account' | 'register'>('inventory');
  
  // Notice & notification state
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [itemPendingDelete, setItemPendingDelete] = useState<InventoryItem | null>(null);

  // Yard-level out of office state
  const [yardOofEnabled, setYardOofEnabled] = useState<boolean>(activeSeller?.outOfOfficeEnabled || false);
  const [yardOofMessage, setYardOofMessage] = useState<string>(activeSeller?.outOfOfficeMessage || '');
  const [yardOofReturnDate, setYardOofReturnDate] = useState<string>(activeSeller?.outOfOfficeReturnDate || '');
  const [oofSavedSuccess, setOofSavedSuccess] = useState(false);

  // Keep yard OOF state synced with activeSeller
  React.useEffect(() => {
    if (activeSeller) {
      setYardOofEnabled(!!activeSeller.outOfOfficeEnabled);
      setYardOofMessage(activeSeller.outOfOfficeMessage || '');
      setYardOofReturnDate(activeSeller.outOfOfficeReturnDate || '');
    }
  }, [activeSeller?.id]);

  const handleSaveSelfOutOfOffice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSeller) return;
    updateSellerOutOfOffice(
      activeSeller.id,
      yardOofEnabled,
      yardOofMessage.trim(),
      yardOofReturnDate.trim()
    );
    setOofSavedSuccess(true);
    showNotice('Your WhatsApp Auto-Reply & Out-of-Office settings have been saved!');
    setTimeout(() => setOofSavedSuccess(false), 3500);
  };

  const showNotice = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setActionNotice({ type, message });
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Registration state
  const [regForm, setRegForm] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    whatsapp: '',
    email: '',
    province: 'Gauteng' as SAProvince,
    city: 'Johannesburg',
    address: '12 Main Road',
    planId: 'pro' as SubscriptionPlanId
  });

  // Payment proof & plan update state
  const [eftReference, setEftReference] = useState('');
  const [paymentSuccessNote, setPaymentSuccessNote] = useState('');
  const [planChangeNote, setPlanChangeNote] = useState('');

  // Item Form Modal state (For Adding / Editing Inventory)
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // QR Code Generator State for Inventory Listings
  const [qrModalItem, setQrModalItem] = useState<InventoryItem | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [qrTagFormat, setQrTagFormat] = useState<'shelf_tag' | 'bin_sticker' | 'counter_card'>('shelf_tag');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);
  const [batchQrPrintMode, setBatchQrPrintMode] = useState<boolean>(false);
  const [batchQrItems, setBatchQrItems] = useState<{ item: InventoryItem; qrDataUrl: string; waUrl: string }[]>([]);

  const [itemForm, setItemForm] = useState({
    title: '',
    category: 'heavy_equipment' as CategoryType,
    subcategory: 'Hydraulics & Pumps',
    make: 'Caterpillar',
    model: '320D',
    year: 2021,
    partNumber: '',
    condition: 'reconditioned' as PartCondition,
    priceZar: 45000,
    province: 'Gauteng' as SAProvince,
    city: 'Johannesburg',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    isFeatured: false
  });

  const sellerListings = activeSeller ? getSellerListings(activeSeller.id) : [];

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.companyName || !regForm.email || !regForm.phone) {
      showNotice('Please fill in all required company contact details.', 'error');
      return;
    }
    const newSeller = registerSeller(regForm);
    showNotice(`Account for ${newSeller.companyName} created successfully! Please review Owner Banking Details below to complete your monthly EFT subscription.`);
    setActiveTab('subscription');
  };

  const handleEftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSeller || !eftReference.trim()) return;
    submitPaymentProof(activeSeller.id, eftReference.trim());
    setPaymentSuccessNote('EFT Payment Proof reference submitted! The App Owner will review and activate your monthly subscription shortly.');
    showNotice('EFT Payment Proof submitted to App Owner for verification.');
    setEftReference('');
  };

  const handleSelectPlanForActiveSeller = (newPlanId: SubscriptionPlanId) => {
    if (!activeSeller) return;
    const targetPlan = getActivePlan(newPlanId);
    const pricing = getPlanEffectivePricing(newPlanId);
    updateSeller({
      ...activeSeller,
      planId: newPlanId
    });
    setPlanChangeNote(`Subscription updated to "${targetPlan.name}" (R${pricing.effectivePrice}/month)! Please use the App Owner banking details below to complete your EFT payment.`);
    showNotice(`Subscription plan updated to ${targetPlan.name}`);
  };

  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemForm({
      title: '',
      category: activeSeller ? 'heavy_equipment' : 'cars',
      subcategory: 'Hydraulics & Pumps',
      make: 'CAT',
      model: '320D',
      year: 2022,
      partNumber: '',
      condition: 'reconditioned',
      priceZar: 25000,
      province: activeSeller ? activeSeller.province : 'Gauteng',
      city: activeSeller ? activeSeller.city : 'Johannesburg',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      isFeatured: false
    });
    setIsItemFormOpen(true);
  };

  const handleOpenEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setItemForm({
      title: item.title,
      category: item.category,
      subcategory: item.subcategory,
      make: item.make,
      model: item.model,
      year: item.year || 2022,
      partNumber: item.partNumber || '',
      condition: item.condition,
      priceZar: item.priceZar,
      province: item.province,
      city: item.city,
      description: item.description,
      imageUrl: item.images && item.images.length > 0 ? item.images[0] : '',
      isFeatured: !!item.isFeatured
    });
    setIsItemFormOpen(true);
  };

  const handleSaveInventoryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSeller) {
      showNotice('Please select or register a seller account first.', 'error');
      return;
    }

    const payload = {
      sellerId: activeSeller.id,
      sellerName: activeSeller.companyName,
      sellerPhone: activeSeller.phone,
      sellerWhatsapp: activeSeller.whatsapp,
      title: itemForm.title,
      category: itemForm.category,
      subcategory: itemForm.subcategory,
      make: itemForm.make,
      model: itemForm.model,
      year: Number(itemForm.year),
      partNumber: itemForm.partNumber,
      condition: itemForm.condition,
      priceZar: Number(itemForm.priceZar),
      province: itemForm.province,
      city: itemForm.city,
      description: itemForm.description,
      specifications: {
        'Condition': itemForm.condition.toUpperCase(),
        'Location': `${itemForm.city}, ${itemForm.province}`,
        'Seller': activeSeller.companyName
      },
      images: [itemForm.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'],
      isFeatured: itemForm.isFeatured
    };

    if (editingItem) {
      updateInventoryItem({
        ...editingItem,
        ...payload
      });
      showNotice('Listing updated successfully!');
    } else {
      addInventoryItem(payload);
      showNotice('New inventory item added to directory!');
    }

    setIsItemFormOpen(false);
  };

  const confirmDeleteItem = (itemId: string) => {
    deleteInventoryItem(itemId);
    setItemPendingDelete(null);
    showNotice('Item removed from inventory.');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const copyToClipboard = (text: string, fieldName = 'text') => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showNotice(`Copied to clipboard: ${text}`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Open QR Code Generator Modal for a specific part listing
  const handleOpenQrModal = async (item: InventoryItem) => {
    setQrModalItem(item);
    setIsGeneratingQr(true);
    try {
      const seller = activeSeller || sellers.find(s => s.id === item.sellerId);
      const waUrl = generateWhatsappInquiryUrl(item, seller);
      const dataUrl = await QRCode.toDataURL(waUrl, {
        width: 400,
        margin: 1.5,
        color: {
          dark: '#020617',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });
      setQrCodeDataUrl(dataUrl);
    } catch (err) {
      console.error('Failed to generate WhatsApp QR code:', err);
      showNotice('Failed to generate WhatsApp QR code.', 'error');
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // Generate QR tags for all listings in bulk
  const handleOpenBatchQrModal = async () => {
    if (!sellerListings.length) {
      showNotice('No inventory listings found to generate QR tags for.', 'error');
      return;
    }
    setIsGeneratingQr(true);
    try {
      const results = await Promise.all(
        sellerListings.map(async (item) => {
          const seller = activeSeller || sellers.find(s => s.id === item.sellerId);
          const waUrl = generateWhatsappInquiryUrl(item, seller);
          const qrDataUrl = await QRCode.toDataURL(waUrl, {
            width: 280,
            margin: 1.5,
            color: { dark: '#020617', light: '#ffffff' },
            errorCorrectionLevel: 'M'
          });
          return { item, qrDataUrl, waUrl };
        })
      );
      setBatchQrItems(results);
      setBatchQrPrintMode(true);
    } catch (err) {
      console.error('Batch QR generation error:', err);
      showNotice('Failed to generate batch QR codes.', 'error');
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // Download QR Code PNG
  const handleDownloadQrPng = (item: InventoryItem, dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_whatsapp_qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('WhatsApp QR code image downloaded successfully!');
  };

  // Direct print tag handler
  const handlePrintCurrentTag = () => {
    window.print();
  };

  // Helper function to resolve active seller plan object safely
  const getActivePlan = (planId: string) => {
    const list = subscriptionPlans && subscriptionPlans.length > 0 ? subscriptionPlans : SUBSCRIPTION_PLANS;
    if (planId === 'starter' || planId === 'basic') return list.find(p => p.id === 'basic') || list[0];
    if (planId === 'dealer_unlimited' || planId === 'enterprise') return list.find(p => p.id === 'enterprise') || list[2];
    return list.find(p => p.id === 'pro') || list[1];
  };

  /* Tiered Plans Comparison Table Component */
  const renderPlansComparisonTable = (
    selectedPlanId: string,
    onSelectPlan: (planId: SubscriptionPlanId) => void
  ) => {
    const sourcePlans = subscriptionPlans && subscriptionPlans.length > 0 ? subscriptionPlans : SUBSCRIPTION_PLANS;

    const plans = sourcePlans.map((sp) => {
      const pricing = getPlanEffectivePricing(sp.id);
      const isPro = sp.id === 'pro';
      const isEnterprise = sp.id === 'enterprise';

      return {
        id: sp.id,
        name: sp.name,
        badge: pricing.promotionalBadge || (isPro ? 'Most Popular' : isEnterprise ? 'Maximum Reach' : 'Essential'),
        price: pricing.effectivePrice,
        originalPrice: pricing.originalPrice,
        isDiscountActive: pricing.isDiscountActive,
        discountPercentage: pricing.discountPercentage,
        promoNotice: pricing.promoNotice,
        description: sp.description,
        maxListings: sp.maxListings >= 9999 ? 'Unlimited Listings' : `${sp.maxListings} Active Listings`,
        target: isEnterprise
          ? 'Heavy Equipment Dealers & Fleet Yards'
          : isPro
          ? 'Truck Breakers & Auto Scrap Yards'
          : 'Local Breakers & Spares Shops',
        ranking: isEnterprise
          ? 'Top Homepage Banner + Verified Dealer Badge'
          : isPro
          ? 'Featured Yard Badge + Priority Search Placement'
          : 'Standard Search Directory Placement',
        leads: isEnterprise
          ? 'WhatsApp, Phone & Direct Email Leads'
          : isPro
          ? 'Direct WhatsApp & Phone Routing'
          : 'Direct WhatsApp & Phone Calls',
        reach: isEnterprise
          ? 'Nationwide Premium Exposure'
          : isPro
          ? 'Province & City Highlighted'
          : 'City-Level Buyer Search',
        analytics: isEnterprise
          ? 'Real-Time Performance Dashboard'
          : isPro
          ? 'Detailed Buyer Inquiry Analytics'
          : 'Basic View Counter',
        bulkUpload: isEnterprise
          ? 'Bulk CSV Inventory Upload Assistant'
          : 'Manual Entry',
        support: isEnterprise
          ? 'Dedicated Account Manager'
          : isPro
          ? 'Priority Email & WhatsApp Support'
          : 'Community Email Support',
        popular: isPro
      };
    });

    const isCurrentPlan = (pId: string) => {
      if (selectedPlanId === pId) return true;
      if (selectedPlanId === 'starter' && pId === 'basic') return true;
      if (selectedPlanId === 'dealer_unlimited' && pId === 'enterprise') return true;
      return false;
    };

    return (
      <div className="space-y-6">
        
        {/* Promotional Campaign Header Banner if Active */}
        {promotionalCampaign?.enabled && (
          <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 border border-amber-500/40 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                    {promotionalCampaign.badgeText || 'SPECIAL PROMOTION'}
                  </span>
                  {promotionalCampaign.expiresAt && (
                    <span className="text-[10px] bg-slate-950/80 text-amber-400 font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                      {promotionalCampaign.expiresAt}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-black text-white">{promotionalCampaign.headline}</h4>
                {promotionalCampaign.announcementText && (
                  <p className="text-xs text-slate-300">{promotionalCampaign.announcementText}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="text-center space-y-1.5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> Tiered Advertising Subscriptions
          </div>
          <h3 className="text-xl font-black text-white">Compare Monthly Seller Subscription Plans</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Select the advertising plan tailored for your yard's inventory size to start receiving direct WhatsApp & phone leads across South Africa.
          </p>
        </div>

        {/* Desktop Tiered Comparison Table */}
        <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90">
                <th className="p-4 w-1/4 font-extrabold text-slate-400 uppercase text-[11px] tracking-wider">
                  Tier Comparison
                </th>
                {plans.map((p) => {
                  const selected = isCurrentPlan(p.id);
                  const savings = Math.max(0, p.originalPrice - p.price);
                  return (
                    <th
                      key={p.id}
                      className={`p-4 w-1/4 align-top transition-all ${
                        p.popular ? 'bg-amber-500/10' : ''
                      } ${selected ? 'bg-amber-500/15 border-t-2 border-amber-500' : ''}`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-black text-base text-white uppercase tracking-wide">{p.name}</span>
                          {p.isDiscountActive ? (
                            <span className="bg-orange-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                              {p.badge}
                            </span>
                          ) : p.popular ? (
                            <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                              Most Popular
                            </span>
                          ) : (
                            <span className="bg-slate-800 text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                              {p.badge}
                            </span>
                          )}
                        </div>

                        <div className="space-y-0.5">
                          {p.isDiscountActive && p.price < p.originalPrice ? (
                            <div>
                              <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className="text-slate-500 line-through text-xs font-bold">R{p.originalPrice}</span>
                                <span className="text-2xl font-black text-amber-400">R{p.price}</span>
                                <span className="text-[10px] text-slate-400 font-normal">/month</span>
                              </div>
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded-full inline-block mt-0.5">
                                Save R{savings}/mo ({p.discountPercentage}% OFF)
                              </span>
                            </div>
                          ) : (
                            <div className="text-2xl font-black text-white flex items-baseline gap-1">
                              R{p.price}
                              <span className="text-[10px] text-slate-400 font-normal">/month</span>
                            </div>
                          )}

                          {p.promoNotice && p.isDiscountActive && (
                            <p className="text-[10px] text-amber-400 font-medium pt-0.5">{p.promoNotice}</p>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 font-normal leading-snug min-h-[36px]">
                          {p.description}
                        </p>

                        <button
                          type="button"
                          onClick={() => onSelectPlan(p.id)}
                          className={`w-full py-2 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            selected
                              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                              : p.popular
                              ? 'bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 hover:bg-slate-700 text-white'
                          }`}
                        >
                          {selected ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Selected Plan</span>
                            </>
                          ) : (
                            <>
                              <span>Choose {p.name}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              <tr>
                <td className="p-3.5 font-bold text-slate-300 bg-slate-900/40 border-r border-slate-800/60">
                  Active Listings Limit
                </td>
                {plans.map((p) => (
                  <td key={p.id} className={`p-3.5 font-black text-amber-400 ${p.popular ? 'bg-amber-500/5' : ''}`}>
                    {p.maxListings}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-300 bg-slate-900/40 border-r border-slate-800/60">
                  Target Business Type
                </td>
                {plans.map((p) => (
                  <td key={p.id} className={`p-3.5 text-slate-200 ${p.popular ? 'bg-amber-500/5' : ''}`}>
                    {p.target}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-300 bg-slate-900/40 border-r border-slate-800/60">
                  Directory Search Ranking
                </td>
                {plans.map((p) => (
                  <td key={p.id} className={`p-3.5 font-medium ${p.id === 'basic' ? 'text-slate-300' : 'text-amber-300'} ${p.popular ? 'bg-amber-500/5' : ''}`}>
                    {p.ranking}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-300 bg-slate-900/40 border-r border-slate-800/60">
                  Buyer Lead Routing
                </td>
                {plans.map((p) => (
                  <td key={p.id} className={`p-3.5 text-slate-200 ${p.popular ? 'bg-amber-500/5' : ''}`}>
                    {p.leads}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-300 bg-slate-900/40 border-r border-slate-800/60">
                  Geographic Reach
                </td>
                {plans.map((p) => (
                  <td key={p.id} className={`p-3.5 text-slate-200 ${p.popular ? 'bg-amber-500/5' : ''}`}>
                    {p.reach}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-300 bg-slate-900/40 border-r border-slate-800/60">
                  Analytics & View Stats
                </td>
                {plans.map((p) => (
                  <td key={p.id} className={`p-3.5 text-slate-200 ${p.popular ? 'bg-amber-500/5' : ''}`}>
                    {p.analytics}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-300 bg-slate-900/40 border-r border-slate-800/60">
                  Bulk CSV Upload Tool
                </td>
                {plans.map((p) => (
                  <td key={p.id} className={`p-3.5 ${p.id === 'enterprise' ? 'font-bold text-emerald-400' : 'text-slate-400'} ${p.popular ? 'bg-amber-500/5' : ''}`}>
                    {p.bulkUpload}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-300 bg-slate-900/40 border-r border-slate-800/60">
                  Support Level
                </td>
                {plans.map((p) => (
                  <td key={p.id} className={`p-3.5 ${p.id === 'enterprise' ? 'font-bold text-indigo-300' : 'text-slate-200'} ${p.popular ? 'bg-amber-500/5' : ''}`}>
                    {p.support}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile Plan Cards */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {plans.map((p) => {
            const selected = isCurrentPlan(p.id);
            const savings = Math.max(0, p.originalPrice - p.price);
            return (
              <div
                key={p.id}
                className={`p-5 rounded-2xl border transition-all space-y-3 ${
                  selected
                    ? 'bg-amber-500/10 border-amber-500'
                    : p.popular
                    ? 'bg-slate-900 border-amber-500/40'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base text-white">{p.name}</h4>
                      {p.isDiscountActive && (
                        <span className="text-[9px] bg-orange-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-amber-400 font-bold">{p.maxListings}</span>
                  </div>
                  <div className="text-right">
                    {p.isDiscountActive && p.price < p.originalPrice ? (
                      <div>
                        <div className="text-xs text-slate-500 line-through font-bold">R{p.originalPrice}</div>
                        <div className="text-lg font-black text-amber-400">R{p.price}</div>
                        <span className="text-[9px] text-emerald-400 font-bold">Save R{savings}/mo</span>
                      </div>
                    ) : (
                      <div>
                        <div className="text-lg font-black text-white">R{p.price}</div>
                        <span className="text-[10px] text-slate-400">per month</span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-normal">{p.description}</p>

                <ul className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Listings:</strong> {p.maxListings}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Ranking:</strong> {p.ranking}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Leads:</strong> {p.leads}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Support:</strong> {p.support}</span>
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={() => onSelectPlan(p.id)}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    selected
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  {selected ? 'Selected Plan' : `Select ${p.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl text-white my-auto flex flex-col">
        
        {/* Top Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Seller Portal & Inventory Management</h2>
              <p className="text-xs text-slate-400">
                {activeSeller ? `Logged in as: ${activeSeller.companyName}` : 'Select an account or subscribe to list parts'}
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

        {/* Tab Navigation */}
        <div className="bg-slate-950 px-6 py-2 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'inventory'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              My Inventory ({sellerListings.length})
            </button>

            {onOpenSpecialsCompetitions && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSpecialsCompetitions();
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Post Special Deals or Enter Yard Challenges"
              >
                <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                <span>Specials & Competitions</span>
                <span className="bg-orange-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                  NEW
                </span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'subscription'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Plans & Owner Banking
            </button>

            <button
              onClick={() => setActiveTab('outofoffice')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'outofoffice'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp Auto-Reply</span>
              {activeSeller?.outOfOfficeEnabled && (
                <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                  OOF ON
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('switch_account')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'switch_account'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Switch Seller Account
            </button>
          </div>

          <button
            onClick={() => setActiveTab('register')}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Register New Yard
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-6 flex-1">

          {/* Action Notice Notification Banner */}
          {actionNotice && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between border shadow-lg transition-all animate-fadeIn ${
                actionNotice.type === 'error'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : actionNotice.type === 'info'
                  ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {actionNotice.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span>{actionNotice.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionNotice(null)}
                className="p-1 hover:bg-slate-800/60 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* In-Modal Delete Confirmation Dialog */}
          {itemPendingDelete && (
            <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl text-xs space-y-3 shadow-xl">
              <div className="flex items-center gap-2 text-rose-300 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Confirm Deletion</span>
              </div>
              <p className="text-slate-300">
                Are you sure you want to remove <strong className="text-white">"{itemPendingDelete.title}"</strong> from your inventory?
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => confirmDeleteItem(itemPendingDelete.id)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl cursor-pointer"
                >
                  Yes, Remove Item
                </button>
                <button
                  type="button"
                  onClick={() => setItemPendingDelete(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: INVENTORY MANAGEMENT */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {!activeSeller ? (
                <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center space-y-4">
                  <Building2 className="w-12 h-12 text-amber-400 mx-auto opacity-80" />
                  <h3 className="text-base font-bold">No Active Seller Account Selected</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Please register a new equipment/spares yard or switch to an existing seller account to manage your listings.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setActiveTab('register')}
                      className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
                    >
                      Register New Seller
                    </button>
                    <button
                      onClick={() => setActiveTab('switch_account')}
                      className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl"
                    >
                      Select Existing Seller
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Seller Header & Action */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white">{activeSeller.companyName}</h3>
                        {activeSeller.subscriptionStatus === 'active' ? (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Active Subscription
                          </span>
                        ) : (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {activeSeller.subscriptionStatus.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {activeSeller.city}, {activeSeller.province} | Contact: {activeSeller.contactName} ({activeSeller.phone})
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <button
                        onClick={handleOpenBatchQrModal}
                        disabled={sellerListings.length === 0}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-amber-400 border border-amber-500/30 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        title="Generate and print printable QR code stickers for all inventory items"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print Yard QR Labels ({sellerListings.length})</span>
                      </button>

                      <button
                        onClick={handleOpenAddItem}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:from-amber-400 hover:to-amber-500 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <PlusCircle className="w-4 h-4" /> Add Inventory Listing
                      </button>
                    </div>
                  </div>

                  {/* Listings Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        Your Current Listings ({sellerListings.length})
                      </h4>
                      {sellerListings.length > 0 && (
                        <span className="text-[11px] text-slate-400">
                          Click <strong className="text-amber-400">QR Tag</strong> to print stickers for parts & shelves
                        </span>
                      )}
                    </div>

                    {sellerListings.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sellerListings.map((item) => (
                          <div
                            key={item.id}
                            className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex gap-4 items-center justify-between hover:border-slate-750 transition-colors"
                          >
                            <div className="flex gap-3 items-center min-w-0">
                              <img
                                src={item.images[0]}
                                alt=""
                                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-800"
                              />
                              <div className="min-w-0">
                                <h5 className="font-bold text-xs text-white truncate">{item.title}</h5>
                                <div className="text-[11px] text-amber-400 font-bold mt-0.5">
                                  {formatCurrency(item.priceZar)}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-1">
                                  <span className="uppercase">{item.condition}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {item.views}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleOpenQrModal(item)}
                                className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                title="Generate WhatsApp QR Code & Print Sticker Label"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">QR Tag</span>
                              </button>
                              <button
                                onClick={() => handleOpenEditItem(item)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                                title="Edit Listing"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setItemPendingDelete(item)}
                                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                                title="Delete Listing"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-950/50 p-8 rounded-2xl border border-dashed border-slate-800 text-center space-y-3">
                        <HardHat className="w-10 h-10 text-slate-600 mx-auto" />
                        <div className="text-xs font-bold text-slate-300">No Inventory Items Added Yet</div>
                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                          Start adding your heavy machinery, truck spares, or bakkie parts to reach buyers across South Africa.
                        </p>
                        <button
                          onClick={handleOpenAddItem}
                          className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Add Your First Part
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: PLANS & OWNER BANKING DETAILS */}
          {activeTab === 'subscription' && (
            <div className="space-y-8">
              
              {/* TIERED PLANS COMPARISON TABLE */}
              <div className="bg-slate-950/80 p-6 rounded-3xl border border-slate-800">
                {renderPlansComparisonTable(
                  activeSeller ? activeSeller.planId : regForm.planId,
                  (pId) => {
                    if (activeSeller) {
                      handleSelectPlanForActiveSeller(pId);
                    } else {
                      setRegForm(prev => ({ ...prev, planId: pId }));
                      setActiveTab('register');
                    }
                  }
                )}
              </div>

              {!activeSeller ? (
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-3">
                  <Info className="w-8 h-8 text-amber-400 mx-auto" />
                  <h4 className="text-sm font-bold">Select or Register a Seller Account</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    To make EFT payments or manage your subscription, please register your yard or switch to an existing seller profile.
                  </p>
                  <button
                    onClick={() => setActiveTab('register')}
                    className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Register New Yard Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Current Subscription Status */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-slate-400">Subscription Status</span>
                        {activeSeller.subscriptionStatus === 'active' ? (
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-bold">
                            Active
                          </span>
                        ) : activeSeller.subscriptionStatus === 'pending_verification' ? (
                          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs font-bold">
                            Pending Verification
                          </span>
                        ) : (
                          <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-full text-xs font-bold">
                            Unpaid / Expired
                          </span>
                        )}
                      </div>

                      {planChangeNote && (
                        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3 rounded-xl text-xs space-y-1">
                          <span className="font-bold block flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Plan Change Saved!
                          </span>
                          <p className="text-[11px] leading-relaxed">{planChangeNote}</p>
                        </div>
                      )}

                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-white">{activeSeller.companyName}</h4>
                        <div className="text-xs text-amber-400 font-extrabold flex items-center gap-1.5 flex-wrap">
                          <span>Active Tier: {getActivePlan(activeSeller.planId).name} Plan</span>
                          {(() => {
                            const pricing = getPlanEffectivePricing(activeSeller.planId);
                            return pricing.isDiscountActive && pricing.effectivePrice < pricing.originalPrice ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="line-through text-slate-500 text-[11px] font-normal">R{pricing.originalPrice}</span>
                                <span className="text-amber-400 font-black">R{pricing.effectivePrice}/mo</span>
                                <span className="text-[9px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded font-bold border border-orange-500/30">
                                  {pricing.promotionalBadge || `${pricing.discountPercentage}% OFF`}
                                </span>
                              </span>
                            ) : (
                              <span>(R{pricing.effectivePrice}/mo)</span>
                            );
                          })()}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Due Date: {new Date(activeSeller.subscriptionDueDate).toLocaleDateString('en-ZA')}
                        </div>
                      </div>

                      {activeSeller.lastPaymentRef && (
                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                          <span className="text-slate-400 block text-[10px]">Submitted Payment Reference:</span>
                          <span className="font-mono font-bold text-emerald-400">{activeSeller.lastPaymentRef}</span>
                        </div>
                      )}
                    </div>

                    {/* EFT Proof Submission Form */}
                    <form onSubmit={handleEftSubmit} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5" /> Submit EFT Payment Proof Reference
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        After paying via EFT to the App Owner's bank account, enter your payment reference number below for instant verification.
                      </p>

                      {paymentSuccessNote && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs">
                          {paymentSuccessNote}
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-300 font-medium">EFT Reference ID / POP Note</label>
                        <input
                          type="text"
                          value={eftReference}
                          onChange={(e) => setEftReference(e.target.value)}
                          placeholder="e.g. PS-HIGHVELD-AUG26 or FNB-981240"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Submit Payment Proof
                      </button>
                    </form>
                  </div>

                  {/* Right Column: OWNER BANKING DETAILS DISPLAY */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 p-6 rounded-2xl border-2 border-amber-500/40 space-y-4 shadow-xl">
                      
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-amber-400" />
                          <h3 className="font-bold text-sm text-white">App Owner Banking Details</h3>
                        </div>
                        <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded">
                          EFT PAYMENTS ONLY
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        Please transfer your monthly subscription fee to the official Part-Smart-ZA owner banking account below:
                      </p>

                      {/* Banking Details Box */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Bank Name</span>
                          <span className="font-bold text-white text-sm">{ownerSettings.bankingDetails.bankName}</span>
                        </div>

                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Account Holder</span>
                          <span className="font-bold text-white text-sm">{ownerSettings.bankingDetails.accountHolder}</span>
                        </div>

                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1 relative group">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Account Number</span>
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-amber-400 text-base">
                              {ownerSettings.bankingDetails.accountNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(ownerSettings.bankingDetails.accountNumber, 'accountNumber')}
                              className="text-slate-400 hover:text-white p-1 cursor-pointer transition-colors"
                              title="Copy Account Number"
                            >
                              {copiedField === 'accountNumber' ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Branch Code</span>
                          <span className="font-mono font-bold text-white text-sm">{ownerSettings.bankingDetails.branchCode}</span>
                        </div>

                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Account Type</span>
                          <span className="font-semibold text-slate-200">{ownerSettings.bankingDetails.accountType}</span>
                        </div>

                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment Reference</span>
                          <span className="font-mono text-emerald-400 font-bold text-xs">{ownerSettings.bankingDetails.paymentReferenceFormat}</span>
                        </div>
                      </div>

                      {/* Additional Instructions */}
                      <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl text-xs text-slate-300 space-y-1">
                        <span className="font-bold text-amber-400 block">Payment Notes & Instructions:</span>
                        <p className="text-[11px] leading-relaxed">
                          {ownerSettings.bankingDetails.additionalInstructions}
                        </p>
                      </div>

                      <div className="text-[10px] text-slate-500 text-right">
                        Last updated by App Owner: {new Date(ownerSettings.bankingDetails.updatedAt).toLocaleDateString('en-ZA')}
                      </div>

                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB: WHATSAPP AUTO-REPLY & OUT-OF-OFFICE */}
          {activeTab === 'outofoffice' && activeSeller && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Intro Banner */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-950 to-amber-950/30 border border-emerald-500/30 rounded-2xl p-5 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-white flex items-center gap-2">
                        WhatsApp Auto-Reply & Out-of-Office Notice
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                          {activeSeller.companyName}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-300">
                        When enabled, any buyer sending a WhatsApp inquiry for your inventory will automatically have this notice appended to their message.
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-black border flex items-center gap-1.5 ${
                      yardOofEnabled
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {yardOofEnabled ? '🏖️ Auto-Reply Active' : '🟢 Trading Online'}
                    </span>
                  </div>
                </div>
              </div>

              {oofSavedSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-2xl text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" /> Your WhatsApp Out-of-Office settings have been saved successfully!
                </div>
              )}

              <form onSubmit={handleSaveSelfOutOfOffice} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
                {/* 1. Toggle Switch */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Enable Out-of-Office Auto-Reply</span>
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Toggle on when your yard sales counter is closed for weekends, public holidays, or stocktakes.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setYardOofEnabled(!yardOofEnabled)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 border shadow-md ${
                      yardOofEnabled
                        ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-500/30 font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    {yardOofEnabled ? '🏖️ Enabled (Out-of-Office)' : '🟢 Disabled (Online)'}
                  </button>
                </div>

                {/* 2. Expected Reopen / Return Time */}
                <div className="space-y-1.5 text-xs">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Expected Reopening / Staff Return Date or Time</span>
                    <span className="text-[10px] text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={yardOofReturnDate}
                    onChange={(e) => setYardOofReturnDate(e.target.value)}
                    placeholder="e.g. Monday 08:00, Tomorrow morning, After Easter long weekend"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />

                  {/* Quick Return Time Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] text-slate-500 font-bold">Quick set:</span>
                    {[
                      'Monday 08:00',
                      'Tomorrow morning',
                      'Next Business Day',
                      'Standby 24/7 Breakdown',
                      'Until Further Notice'
                    ].map((pill) => (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => {
                          setYardOofReturnDate(pill);
                          if (!yardOofEnabled) setYardOofEnabled(true);
                        }}
                        className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 px-2.5 py-0.5 rounded-lg transition-all cursor-pointer"
                      >
                        {pill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Custom Auto-Reply Message */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Custom WhatsApp Message Notice</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {yardOofMessage.length} chars
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    value={yardOofMessage}
                    onChange={(e) => setYardOofMessage(e.target.value)}
                    placeholder="Enter your custom message or choose a preset below..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* 4. Presets */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Quick Template Presets:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setYardOofMessage('Our scrap yard sales counter is closed for the weekend / after trading hours. All inquiries will be processed first thing Monday morning at 08:00.');
                        setYardOofReturnDate('Monday 08:00');
                        setYardOofEnabled(true);
                      }}
                      className="text-left p-2.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all cursor-pointer group"
                    >
                      <div className="font-bold text-slate-200 group-hover:text-amber-400">🌙 Weekend / After-Hours</div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">Resumes Monday at 08:00.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setYardOofMessage('We are closed for the South African public holiday. Courier dispatches and warehouse loading will resume on the next business day.');
                        setYardOofReturnDate('Next Business Day');
                        setYardOofEnabled(true);
                      }}
                      className="text-left p-2.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all cursor-pointer group"
                    >
                      <div className="font-bold text-slate-200 group-hover:text-amber-400">🇿🇦 SA Public Holiday</div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">Closed for holiday, courier dispatches resume next business day.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setYardOofMessage('Our yard is currently operating on generator backup during loadshedding. Part inquiries are monitored via our mobile standby desk.');
                        setYardOofReturnDate('Within 2 hours');
                        setYardOofEnabled(true);
                      }}
                      className="text-left p-2.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all cursor-pointer group"
                    >
                      <div className="font-bold text-slate-200 group-hover:text-amber-400">⚡ Loadshedding Backup</div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">Operating on generator standby desk.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setYardOofMessage('Yard counter closed. For critical fleet breakdown emergencies (Engines, Transmissions, Final Drives), please WhatsApp our standby technician directly.');
                        setYardOofReturnDate('Standby 24/7');
                        setYardOofEnabled(true);
                      }}
                      className="text-left p-2.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all cursor-pointer group"
                    >
                      <div className="font-bold text-slate-200 group-hover:text-amber-400">🚜 Fleet Emergency Standby</div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">Emergency breakdown standby hotline.</p>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Save WhatsApp Auto-Reply Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: SWITCH SELLER ACCOUNT */}
          {activeTab === 'switch_account' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Select Active Seller Yard</h3>
                <span className="text-xs text-slate-400 font-medium">Sorted by Province & City/Town</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...sellers]
                  .sort((a, b) => {
                    if (a.province !== b.province) return a.province.localeCompare(b.province);
                    if (a.city !== b.city) return a.city.localeCompare(b.city);
                    return a.companyName.localeCompare(b.companyName);
                  })
                  .map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setActiveSellerId(s.id);
                      setActiveTab('inventory');
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      activeSeller?.id === s.id
                        ? 'bg-amber-500/15 border-amber-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-white">{s.companyName}</h4>
                        <p className="text-xs text-slate-400">{s.city}, {s.province}</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Contact: {s.contactName} ({s.phone}) | Plan: <span className="text-amber-400 font-bold uppercase">{getActivePlan(s.planId).name}</span>
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          s.subscriptionStatus === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {s.subscriptionStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: REGISTER NEW SELLER */}
          {activeTab === 'register' && (
            <div className="space-y-8">
              <form onSubmit={handleRegisterSubmit} className="space-y-6 max-w-3xl mx-auto bg-slate-950 p-6 rounded-2xl border border-slate-800">
                <h3 className="text-base font-bold text-amber-400 border-b border-slate-800 pb-2">
                  Register Equipment Yard / Breaker Account
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Company / Yard Name *</label>
                    <input
                      type="text"
                      required
                      value={regForm.companyName}
                      onChange={(e) => setRegForm({ ...regForm, companyName: e.target.value })}
                      placeholder="e.g. Witbank Truck Breakers"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Contact Person *</label>
                    <input
                      type="text"
                      required
                      value={regForm.contactName}
                      onChange={(e) => setRegForm({ ...regForm, contactName: e.target.value })}
                      placeholder="e.g. Piet Botha"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value, whatsapp: regForm.whatsapp || e.target.value })}
                      placeholder="e.g. +27 82 123 4567"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">WhatsApp Number *</label>
                    <input
                      type="text"
                      required
                      value={regForm.whatsapp}
                      onChange={(e) => setRegForm({ ...regForm, whatsapp: e.target.value })}
                      placeholder="e.g. 27821234567"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      placeholder="e.g. sales@witbankbreakers.co.za"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Province *</label>
                    <select
                      value={regForm.province}
                      onChange={(e) => setRegForm({ ...regForm, province: e.target.value as SAProvince })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white cursor-pointer"
                    >
                      {PROVINCES_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-slate-300 font-medium">City & Street Address</label>
                    <input
                      type="text"
                      value={regForm.address}
                      onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                      placeholder="e.g. 14 Industrial Park, eMalahleni"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                {/* Choose Subscription Plan Tiered Table */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-amber-400 block border-b border-slate-800 pb-2">
                    Selected Subscription Plan: <span className="text-white uppercase font-black">{getActivePlan(regForm.planId).name} (R{getActivePlan(regForm.planId).priceZar}/mo)</span>
                  </label>

                  {renderPlansComparisonTable(regForm.planId, (pId) => setRegForm({ ...regForm, planId: pId }))}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Complete Registration & View Banking Details
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* Add / Edit Item Sub-Modal */}
      {isItemFormOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-5 text-white my-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-amber-400">
                {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
              </h3>
              <button
                onClick={() => setIsItemFormOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInventoryItem} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Listing Title *</label>
                <input
                  type="text"
                  required
                  value={itemForm.title}
                  onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                  placeholder="e.g. Caterpillar 320D Excavator Main Hydraulic Pump"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Category *</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value as CategoryType })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="heavy_equipment">Heavy Equipment</option>
                    <option value="trucks">Trucks & Commercial</option>
                    <option value="cars">Cars & Bakkies</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Subcategory</label>
                  <input
                    type="text"
                    value={itemForm.subcategory}
                    onChange={(e) => setItemForm({ ...itemForm, subcategory: e.target.value })}
                    placeholder="e.g. Hydraulics / Engine / Gearbox"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Make / Brand *</label>
                  <input
                    type="text"
                    required
                    value={itemForm.make}
                    onChange={(e) => setItemForm({ ...itemForm, make: e.target.value })}
                    placeholder="e.g. Caterpillar / Scania / Toyota"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Model</label>
                  <input
                    type="text"
                    value={itemForm.model}
                    onChange={(e) => setItemForm({ ...itemForm, model: e.target.value })}
                    placeholder="e.g. 320D / R500 / Hilux GD-6"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Price in Rands (ZAR) *</label>
                  <input
                    type="number"
                    required
                    value={itemForm.priceZar}
                    onChange={(e) => setItemForm({ ...itemForm, priceZar: Number(e.target.value) })}
                    placeholder="e.g. 85000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Condition *</label>
                  <select
                    value={itemForm.condition}
                    onChange={(e) => setItemForm({ ...itemForm, condition: e.target.value as PartCondition })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="reconditioned">Reconditioned</option>
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="stripping_spares">Stripping for Spares</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Image URL</label>
                <input
                  type="text"
                  value={itemForm.imageUrl}
                  onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Full Description</label>
                <textarea
                  rows={3}
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="Provide specifications, warranty terms, and yard location..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsItemFormOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SINGLE ITEM WHATSAPP QR CODE & SHELF TAG MODAL */}
      {qrModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] max-h-[calc(100dvh-2rem)] overflow-y-auto shadow-2xl text-white my-auto flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-white truncate">
                    WhatsApp Inquiry QR Code & Label
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    Direct WhatsApp link tag for <strong className="text-amber-400">{qrModalItem.title}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setQrModalItem(null);
                  setQrCodeDataUrl('');
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-6 flex-1">
              
              {/* Format Switcher */}
              <div className="flex items-center justify-between gap-2 flex-wrap bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  Tag Format:
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setQrTagFormat('shelf_tag')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      qrTagFormat === 'shelf_tag'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    Compact Shelf Tag
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrTagFormat('bin_sticker')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      qrTagFormat === 'bin_sticker'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    Bin / Rack Sticker
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrTagFormat('counter_card')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      qrTagFormat === 'counter_card'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    Showroom Counter Flyer
                  </button>
                </div>
              </div>

              {/* LIVE PRINTABLE TAG PREVIEW */}
              <div className="flex justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                {isGeneratingQr ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold">Generating WhatsApp QR Code...</span>
                  </div>
                ) : (
                  <div
                    id="printable-single-qr-tag"
                    className={`bg-white text-slate-950 rounded-2xl shadow-xl transition-all border-2 border-slate-900 print-qr-tag ${
                      qrTagFormat === 'shelf_tag'
                        ? 'p-4 w-72 flex flex-col items-center text-center space-y-2'
                        : qrTagFormat === 'bin_sticker'
                        ? 'p-5 w-96 flex flex-row items-center gap-4'
                        : 'p-6 w-full max-w-lg flex flex-col space-y-3'
                    }`}
                  >
                    {/* Compact Shelf Tag */}
                    {qrTagFormat === 'shelf_tag' && (
                      <>
                        <div className="w-full border-b border-slate-200 pb-1.5 flex items-center justify-between">
                          <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">
                            Part-Smart ZA
                          </span>
                          <span className="text-[9px] font-bold text-slate-500 truncate max-w-[120px]">
                            {activeSeller?.companyName || qrModalItem.sellerName}
                          </span>
                        </div>

                        <div className="w-full text-left">
                          <h4 className="font-black text-xs text-slate-900 leading-tight line-clamp-2">
                            {qrModalItem.title}
                          </h4>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm font-black text-emerald-700">
                              {formatCurrency(qrModalItem.priceZar)}
                            </span>
                            <span className="text-[9px] font-bold uppercase bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {qrModalItem.condition}
                            </span>
                          </div>
                        </div>

                        {/* High-Resolution QR Code */}
                        <div className="bg-white p-2 rounded-xl border border-slate-300 shadow-xs my-1">
                          {qrCodeDataUrl && (
                            <img
                              src={qrCodeDataUrl}
                              alt="WhatsApp QR Code"
                              className="w-40 h-40 object-contain mx-auto"
                            />
                          )}
                        </div>

                        <div className="w-full text-center space-y-0.5 pt-1 border-t border-slate-200">
                          <span className="text-[10px] font-black text-emerald-700 flex items-center justify-center gap-1">
                            <Smartphone className="w-3 h-3 text-emerald-600 inline" />
                            Scan with Phone Camera
                          </span>
                          <p className="text-[8px] text-slate-500">
                            Opens direct WhatsApp chat with seller
                          </p>
                          <p className="text-[9px] font-mono text-slate-700 font-bold">
                            WA: {activeSeller?.whatsapp || qrModalItem.sellerWhatsapp || qrModalItem.sellerPhone}
                          </p>
                        </div>
                      </>
                    )}

                    {/* Bin / Rack Sticker */}
                    {qrTagFormat === 'bin_sticker' && (
                      <>
                        <div className="shrink-0 bg-white p-1.5 rounded-xl border border-slate-300 shadow-xs">
                          {qrCodeDataUrl && (
                            <img
                              src={qrCodeDataUrl}
                              alt="WhatsApp QR Code"
                              className="w-32 h-32 object-contain"
                            />
                          )}
                          <div className="text-[8px] text-center font-black uppercase text-emerald-700 mt-1">
                            Scan for WhatsApp
                          </div>
                        </div>

                        <div className="min-w-0 flex-1 space-y-1.5 text-left">
                          <div className="text-[9px] font-black text-amber-600 uppercase tracking-wider">
                            {activeSeller?.companyName || qrModalItem.sellerName}
                          </div>
                          <h4 className="font-black text-xs text-slate-900 leading-snug">
                            {qrModalItem.title}
                          </h4>
                          <div className="text-[10px] text-slate-600 font-medium">
                            <span>{qrModalItem.make} {qrModalItem.model}</span>
                            {qrModalItem.partNumber && (
                              <span className="font-mono block text-[9px] text-slate-500">OEM: {qrModalItem.partNumber}</span>
                            )}
                          </div>
                          <div className="pt-1 flex items-center justify-between border-t border-slate-200">
                            <span className="text-sm font-black text-emerald-700">
                              {formatCurrency(qrModalItem.priceZar)}
                            </span>
                            <span className="text-[9px] font-bold uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                              {qrModalItem.condition}
                            </span>
                          </div>
                          <div className="text-[9px] font-bold text-slate-700 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-emerald-600" />
                            <span>WA: {activeSeller?.whatsapp || qrModalItem.sellerWhatsapp}</span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Showroom Counter Flyer */}
                    {qrTagFormat === 'counter_card' && (
                      <>
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xs">
                              PS
                            </div>
                            <span className="font-black text-slate-900 text-sm tracking-tight">
                              PART-SMART<span className="text-amber-600">.ZA</span>
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-600">
                            {activeSeller?.companyName || qrModalItem.sellerName}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                          <div className="space-y-2 text-left">
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              {qrModalItem.category.replace('_', ' ').toUpperCase()} • {qrModalItem.subcategory}
                            </span>
                            <h4 className="font-black text-base text-slate-900 leading-tight">
                              {qrModalItem.title}
                            </h4>
                            <div className="text-xs text-slate-600 space-y-0.5">
                              <div><strong>Make/Model:</strong> {qrModalItem.make} {qrModalItem.model} ({qrModalItem.year || 'All'})</div>
                              <div><strong>Condition:</strong> <span className="uppercase font-bold">{qrModalItem.condition}</span></div>
                              {qrModalItem.partNumber && <div><strong>Part No:</strong> <span className="font-mono">{qrModalItem.partNumber}</span></div>}
                              <div><strong>Location:</strong> {qrModalItem.city}, {qrModalItem.province}</div>
                            </div>
                            <div className="text-xl font-black text-emerald-700 pt-1">
                              {formatCurrency(qrModalItem.priceZar)}
                            </div>
                          </div>

                          <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
                            {qrCodeDataUrl && (
                              <img
                                src={qrCodeDataUrl}
                                alt="WhatsApp Inquiry QR Code"
                                className="w-36 h-36 object-contain"
                              />
                            )}
                            <strong className="text-xs font-black text-slate-900 block">
                              Instant WhatsApp Inquiry
                            </strong>
                            <p className="text-[10px] text-slate-500">
                              Scan with your camera to chat with our parts desk immediately.
                            </p>
                            <span className="font-mono font-bold text-xs text-emerald-700">
                              {activeSeller?.whatsapp || qrModalItem.sellerWhatsapp}
                            </span>
                          </div>
                        </div>

                        <div className="text-center pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                          Listed on South Africa's Heavy Machinery, Truck Spares & Car Breakers Network • Part-Smart ZA
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* WhatsApp Message Inspector Preview */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    Customer Pre-filled WhatsApp Inquiry Message:
                  </span>
                  <span className="text-[10px] text-slate-500">Auto-fills when buyer scans QR</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                  {buildWhatsappInquiryText(qrModalItem, activeSeller || sellers.find(s => s.id === qrModalItem.sellerId))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handlePrintCurrentTag}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  title="Print sticker tag to thermal or standard printer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Label</span>
                </button>

                <button
                  type="button"
                  onClick={() => qrCodeDataUrl && handleDownloadQrPng(qrModalItem, qrCodeDataUrl)}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700 active:scale-95"
                  title="Download high resolution QR code PNG"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Download PNG</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const waUrl = generateWhatsappInquiryUrl(qrModalItem, activeSeller || sellers.find(s => s.id === qrModalItem.sellerId));
                    copyToClipboard(waUrl, 'qrWaUrl');
                  }}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700 active:scale-95"
                  title="Copy WhatsApp deep link URL"
                >
                  {copiedField === 'qrWaUrl' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-sky-400" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const waUrl = generateWhatsappInquiryUrl(qrModalItem, activeSeller || sellers.find(s => s.id === qrModalItem.sellerId));
                    window.open(waUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                  title="Test WhatsApp Link in new window"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Test Link</span>
                </button>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Attach this QR code to the part shelf, bin, or windscreen for instant customer walk-in leads.</span>
              <button
                type="button"
                onClick={() => {
                  setQrModalItem(null);
                  setQrCodeDataUrl('');
                }}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer font-bold"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* BATCH INVENTORY QR LABELS PRINT SHEET MODAL */}
      {batchQrPrintMode && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] max-h-[calc(100dvh-2rem)] overflow-y-auto shadow-2xl text-white my-auto flex flex-col">
            
            {/* Batch Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Batch Inventory WhatsApp QR Labels
                  </h3>
                  <p className="text-xs text-slate-400">
                    {batchQrItems.length} inventory labels ready for printing • <strong className="text-amber-400">{activeSeller?.companyName}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintCurrentTag}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print All Labels</span>
                </button>
                <button
                  onClick={() => setBatchQrPrintMode(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Batch Labels Grid */}
            <div className="p-6 space-y-6 flex-1 bg-slate-950">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-2xl text-xs flex items-center justify-between gap-3">
                <span>
                  💡 <strong>Scrapyard Tip:</strong> Use standard sticker sheets or cut along the borders to stick directly onto bins, shelving, or parts.
                </span>
                <button
                  type="button"
                  onClick={handlePrintCurrentTag}
                  className="underline font-bold text-amber-400 cursor-pointer"
                >
                  Print (⌘P)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print-only-container">
                {batchQrItems.map(({ item, qrDataUrl }) => (
                  <div
                    key={item.id}
                    className="bg-white text-slate-950 p-4 rounded-2xl border-2 border-slate-900 shadow-md flex flex-col justify-between space-y-3 print-qr-tag"
                  >
                    <div className="border-b border-slate-200 pb-2">
                      <div className="flex items-center justify-between text-[9px] font-black text-amber-600 uppercase">
                        <span>Part-Smart ZA</span>
                        <span className="text-slate-500 font-bold truncate max-w-[130px]">
                          {activeSeller?.companyName || item.sellerName}
                        </span>
                      </div>
                      <h4 className="font-black text-xs text-slate-900 leading-tight mt-1 line-clamp-2">
                        {item.title}
                      </h4>
                      <div className="text-[10px] text-slate-600 mt-0.5">
                        {item.make} {item.model} • <span className="uppercase font-bold">{item.condition}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 py-1">
                      <div className="min-w-0">
                        <div className="text-base font-black text-emerald-700">
                          {formatCurrency(item.priceZar)}
                        </div>
                        <div className="text-[9px] text-slate-500 mt-1">
                          WA: <strong>{activeSeller?.whatsapp || item.sellerWhatsapp}</strong>
                        </div>
                        <div className="text-[8px] text-slate-500 font-mono mt-0.5">
                          {item.city}, {item.province}
                        </div>
                      </div>

                      <div className="shrink-0 bg-white p-1 rounded-xl border border-slate-300">
                        <img
                          src={qrDataUrl}
                          alt="QR Code"
                          className="w-20 h-20 object-contain"
                        />
                      </div>
                    </div>

                    <div className="text-center pt-1.5 border-t border-slate-200 text-[8px] text-slate-500 font-bold uppercase tracking-wider text-emerald-800">
                      Scan to WhatsApp Seller Directly
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Batch Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Total {batchQrItems.length} inventory tags generated.
              </span>
              <button
                type="button"
                onClick={() => setBatchQrPrintMode(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

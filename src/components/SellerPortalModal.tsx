import React, { useState, useMemo } from 'react';
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
  Tag,
  Crown,
  ChevronRight,
  TrendingUp,
  Radio,
  HelpCircle,
  CheckCheck,
  Sliders,
  Settings2,
  Maximize2,
  FileText,
  Scissors,
  CheckSquare,
  Square,
  ListChecks,
  Image as ImageIcon,
  Calculator,
  CalendarCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUBSCRIPTION_PLANS, PROVINCES_LIST, SUBCATEGORIES } from '../data/initialData';
import { TierSavingsCalculator } from './TierSavingsCalculator';
import { WhatsappBroadcastTool } from './WhatsappBroadcastTool';
import { WhatsappInventoryExportModal } from './WhatsappInventoryExportModal';
import { SubscriptionOverviewTab } from './SubscriptionOverviewTab';
import { PaymentMethodConfigScreen } from './PaymentMethodConfigScreen';
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

  const [activeTab, setActiveTab] = useState<'inventory' | 'broadcast' | 'subscription_overview' | 'subscription' | 'outofoffice' | 'switch_account' | 'register'>('inventory');
  const [subscriptionSubView, setSubscriptionSubView] = useState<'payment_config' | 'calculator' | 'matrix'>('payment_config');
  const [isExpiryBannerDismissed, setIsExpiryBannerDismissed] = useState<boolean>(false);
  
  // Notice & notification state
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [itemPendingDelete, setItemPendingDelete] = useState<InventoryItem | null>(null);

  // 3-Day Subscription Expiry Detection and Metrics
  const subscriptionAlert = useMemo(() => {
    if (!activeSeller) return null;
    const now = new Date();
    const dueDate = activeSeller.subscriptionDueDate ? new Date(activeSeller.subscriptionDueDate) : null;
    if (!dueDate || isNaN(dueDate.getTime())) return null;

    const diffMs = dueDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const isOverdue = activeSeller.subscriptionStatus === 'unpaid' || daysRemaining <= 0;
    const isExpiringWithin3Days = daysRemaining <= 3 && daysRemaining > 0;
    const isPendingVerification = activeSeller.subscriptionStatus === 'pending_verification';

    // Trigger alert when subscription is within 3 days of expiring or overdue
    const shouldAlert = isExpiringWithin3Days || isOverdue;

    return {
      shouldAlert,
      daysRemaining,
      dueDate,
      isOverdue,
      isExpiringWithin3Days,
      isPendingVerification,
      formattedDueDate: dueDate.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
    };
  }, [activeSeller?.subscriptionDueDate, activeSeller?.subscriptionStatus, activeSeller?.id]);

  // Reset banner dismissal on seller switch
  React.useEffect(() => {
    setIsExpiryBannerDismissed(false);
  }, [activeSeller?.id]);

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
    logoUrl: '',
    province: 'Gauteng' as SAProvince,
    city: 'Johannesburg',
    address: '12 Main Road',
    planId: 'pro' as SubscriptionPlanId
  });

  // Payment proof & plan update state
  const [eftReference, setEftReference] = useState('');
  const [paymentSuccessNote, setPaymentSuccessNote] = useState('');
  const [planChangeNote, setPlanChangeNote] = useState('');

  // Yard Branding & Profile Logo Modal State
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [brandingLogoInput, setBrandingLogoInput] = useState('');

  // Subscription Plan Upgrade Dialog & Listing Limit State
  const [upgradeTargetPlan, setUpgradeTargetPlan] = useState<{
    id: SubscriptionPlanId;
    name: string;
    price: number;
    originalPrice: number;
    discountPercentage: number;
    isDiscountActive: boolean;
    maxListingsText: string;
    maxListingsNum: number;
    isUpgrade: boolean;
    features: string[];
    description: string;
  } | null>(null);

  const [limitWarningModal, setLimitWarningModal] = useState<{
    currentCount: number;
    maxAllowed: number;
    planName: string;
  } | null>(null);

  // Multi-Select & Bulk Printing State
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // WhatsApp Grid Export Modal State
  const [isWhatsappExportOpen, setIsWhatsappExportOpen] = useState<boolean>(false);
  const [whatsappExportPreSelectedIds, setWhatsappExportPreSelectedIds] = useState<string[]>([]);

  const handleOpenWhatsappExport = (itemIds?: string[]) => {
    if (itemIds && itemIds.length > 0) {
      setWhatsappExportPreSelectedIds(itemIds);
    } else if (selectedItemIds.length > 0) {
      setWhatsappExportPreSelectedIds(selectedItemIds);
    } else {
      setWhatsappExportPreSelectedIds([]);
    }
    setIsWhatsappExportOpen(true);
  };

  // Item Form Modal state (For Adding / Editing Inventory)
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Shelf Label & QR Code Generator State for Inventory Listings
  type ShelfLabelFormat = 'thermal_58' | 'thermal_80' | 'shelf_tag' | 'bin_sticker' | 'counter_card';
  const [qrModalItem, setQrModalItem] = useState<InventoryItem | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [qrTagFormat, setQrTagFormat] = useState<ShelfLabelFormat>('thermal_58');
  const [labelOptions, setLabelOptions] = useState({
    showPrice: true,
    showPartNumber: true,
    showSellerInfo: true,
    showCondition: true,
    showYardLogo: true, // Optional 'Add Yard Logo' for printable shelf & thermal labels
    highContrastThermal: true,
    copiesCount: 1
  });
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);
  const [batchQrPrintMode, setBatchQrPrintMode] = useState<boolean>(false);
  const [batchLabelFormat, setBatchLabelFormat] = useState<ShelfLabelFormat>('thermal_58');
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

  // Helper to look up yard profile logo
  const getSellerLogo = (sellerId?: string): string | undefined => {
    if (sellerId) {
      const s = sellers.find(seller => seller.id === sellerId);
      if (s?.logoUrl) return s.logoUrl;
    }
    if (activeSeller?.logoUrl) return activeSeller.logoUrl;
    return undefined;
  };

  // Helper to render Yard Profile Logo across label formats
  const renderYardLogo = (sellerId?: string, isThermal?: boolean, customClassName?: string) => {
    if (!labelOptions.showYardLogo) return null;
    const logo = getSellerLogo(sellerId);
    const yardObj = sellers.find(s => s.id === sellerId) || activeSeller;
    const yardName = yardObj?.companyName || 'Yard';

    if (logo) {
      return (
        <div className={`inline-flex items-center justify-center shrink-0 ${customClassName || ''}`}>
          <img
            src={logo}
            alt={`${yardName} Logo`}
            referrerPolicy="no-referrer"
            className={`object-contain ${
              isThermal && labelOptions.highContrastThermal
                ? 'filter grayscale contrast-200 brightness-95'
                : ''
            } ${customClassName ? '' : 'max-h-7 max-w-[110px]'}`}
          />
        </div>
      );
    }

    // High contrast typography insignia fallback when no image logo is uploaded
    return (
      <div
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-900/40 bg-slate-100 text-slate-950 text-[8px] font-black tracking-tight uppercase shrink-0 ${
          isThermal && labelOptions.highContrastThermal ? 'border-2 border-slate-950 bg-white' : ''
        } ${customClassName || ''}`}
      >
        <Building2 className="w-2.5 h-2.5 text-slate-800 shrink-0" />
        <span className="truncate max-w-[90px]">{yardName.split(' ')[0]}</span>
      </div>
    );
  };

  const handleOpenBrandingModal = () => {
    if (!activeSeller) return;
    setBrandingLogoInput(activeSeller.logoUrl || '');
    setIsBrandingModalOpen(true);
  };

  const handleSaveBranding = (newLogoUrl: string) => {
    if (!activeSeller) return;
    updateSeller({
      ...activeSeller,
      logoUrl: newLogoUrl.trim()
    });
    setIsBrandingModalOpen(false);
    showNotice('Yard Profile Logo & Branding updated successfully! Labels will reflect this logo.');
  };

  const handleOpenAddItem = () => {
    if (activeSeller) {
      const currentPlan = getActivePlan(activeSeller.planId);
      const isUnlimited = currentPlan.maxListings >= 9999;
      if (!isUnlimited && sellerListings.length >= currentPlan.maxListings) {
        setLimitWarningModal({
          currentCount: sellerListings.length,
          maxAllowed: currentPlan.maxListings,
          planName: currentPlan.name
        });
        return;
      }
    }

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

  // Multi-Selection Helpers for Inventory Table
  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedItemIds.length === sellerListings.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(sellerListings.map(item => item.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedItemIds([]);
  };

  // Generate QR tags for selected items or all listings in bulk
  const handleOpenBatchQrModal = async (customItems?: InventoryItem[]) => {
    const targetItems = customItems && customItems.length > 0
      ? customItems
      : selectedItemIds.length > 0
      ? sellerListings.filter(item => selectedItemIds.includes(item.id))
      : sellerListings;

    if (!targetItems.length) {
      showNotice('Please select at least one inventory item to generate shelf labels.', 'error');
      return;
    }
    setIsGeneratingQr(true);
    try {
      const results = await Promise.all(
        targetItems.map(async (item) => {
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

    const getPlanRank = (pId: string) => {
      if (pId === 'basic' || pId === 'starter') return 1;
      if (pId === 'pro') return 2;
      if (pId === 'enterprise' || pId === 'dealer_unlimited') return 3;
      return 1;
    };

    const currentRank = getPlanRank(selectedPlanId);

    const plans = sourcePlans.map((sp) => {
      const pricing = getPlanEffectivePricing(sp.id);
      const isPro = sp.id === 'pro';
      const isEnterprise = sp.id === 'enterprise';
      const rank = getPlanRank(sp.id);

      return {
        id: sp.id,
        name: sp.name,
        rank,
        badge: pricing.promotionalBadge || (isPro ? 'Most Popular' : isEnterprise ? 'Maximum Reach' : 'Starter Yard'),
        price: pricing.effectivePrice,
        originalPrice: pricing.originalPrice,
        isDiscountActive: pricing.isDiscountActive,
        discountPercentage: pricing.discountPercentage,
        promoNotice: pricing.promoNotice,
        description: sp.description,
        maxListingsNum: isEnterprise ? 9999 : isPro ? 50 : 10,
        maxListings: sp.maxListings >= 9999 ? 'Unlimited Listings' : `${sp.maxListings} Active Listings`,
        target: isEnterprise
          ? 'Heavy Equipment Dealers & Fleet Yards'
          : isPro
          ? 'Truck Breakers & Auto Scrap Yards'
          : 'Local Breakers & Spares Shops',
        ranking: isEnterprise
          ? 'Top Homepage Banner + Verified Master Dealer'
          : isPro
          ? 'Featured Yard Badge + Priority Search Placement'
          : 'Standard Directory Search Placement',
        leads: isEnterprise
          ? 'Direct WhatsApp, Phone & Buyer Email Routing'
          : isPro
          ? 'Direct WhatsApp & Phone Call Leads'
          : 'Direct WhatsApp & Phone Calls',
        reach: isEnterprise
          ? 'Nationwide SA Heavy Machinery Network'
          : isPro
          ? 'Province-Wide & City Search Highlighted'
          : 'City & Local Buyer Search',
        analytics: isEnterprise
          ? 'Real-Time Performance Dashboard & Inquiry Logs'
          : isPro
          ? 'Detailed Buyer Inquiry & View Tracker'
          : 'Basic Listing View Counter',
        bulkUpload: isEnterprise
          ? 'Assisted Bulk CSV & Spreadsheet Import'
          : 'Standard Manual Entry',
        support: isEnterprise
          ? 'Dedicated Account Manager & Priority Setup'
          : isPro
          ? 'Priority WhatsApp & Email Support'
          : 'Standard Community Email Support',
        qrTags: 'Included: Batch Shelf & Bin QR Stickers',
        autoReply: 'Included: Out-of-Office WhatsApp Auto-Reply',
        popular: isPro
      };
    });

    const isCurrentPlan = (pId: string) => {
      if (selectedPlanId === pId) return true;
      if (selectedPlanId === 'starter' && pId === 'basic') return true;
      if (selectedPlanId === 'dealer_unlimited' && pId === 'enterprise') return true;
      return false;
    };

    const handlePlanButtonClick = (p: typeof plans[0]) => {
      if (isCurrentPlan(p.id)) return;

      if (activeSeller) {
        // Open Upgrade Confirmation Dialog
        const isUpgrade = p.rank > currentRank;
        setUpgradeTargetPlan({
          id: p.id as SubscriptionPlanId,
          name: p.name,
          price: p.price,
          originalPrice: p.originalPrice,
          discountPercentage: p.discountPercentage,
          isDiscountActive: p.isDiscountActive,
          maxListingsText: p.maxListings,
          maxListingsNum: p.maxListingsNum,
          isUpgrade,
          description: p.description,
          features: [
            p.maxListings,
            p.ranking,
            p.leads,
            p.reach,
            p.support,
            p.bulkUpload !== 'Standard Manual Entry' ? p.bulkUpload : 'Batch QR Shelf & Bin Sticker Generator'
          ]
        });
      } else {
        onSelectPlan(p.id as SubscriptionPlanId);
      }
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
            {((promotionalCampaign.discountPercentage || (promotionalCampaign as any).globalDiscountPercentage || 0) > 0) && (
              <div className="px-3.5 py-1.5 bg-orange-500 text-slate-950 font-black text-xs rounded-xl shadow-md shrink-0 uppercase tracking-wider self-start sm:self-auto">
                {promotionalCampaign.discountPercentage || (promotionalCampaign as any).globalDiscountPercentage}% OFF Applied
              </div>
            )}
          </div>
        )}

        {/* Active Seller Tier Status Summary (if logged in) */}
        {activeSeller && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Current Active Subscription:</span>
                  <span className="text-xs font-black text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {getActivePlan(activeSeller.planId).name} Plan
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                    Active Status
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Yard: <strong>{activeSeller.companyName}</strong> • Inventory Usage: <strong>{sellerListings.length}</strong> listings active
                </p>
              </div>
            </div>

            {selectedPlanId !== 'enterprise' && (
              <button
                type="button"
                onClick={() => {
                  const target = plans.find(p => p.id === 'enterprise') || plans[2];
                  handlePlanButtonClick(target);
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Upgrade to Enterprise for Unlimited Listings</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        <div className="text-center space-y-1.5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> Feature Matrix & Limits Comparison
          </div>
          <h3 className="text-xl font-black text-white">Compare Monthly Seller Subscription Tiers</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Upgrade your plan anytime to expand listing capacity, boost directory search placement, and unlock direct WhatsApp buyer inquiries across South Africa.
          </p>
        </div>

        {/* Desktop Tiered Comparison Table */}
        <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90">
                <th className="p-4 w-1/4 font-extrabold text-slate-400 uppercase text-[11px] tracking-wider">
                  Features & Tier Limits
                </th>
                {plans.map((p) => {
                  const selected = isCurrentPlan(p.id);
                  const isUpgrade = p.rank > currentRank;
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
                          onClick={() => handlePlanButtonClick(p)}
                          className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            selected
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                              : isUpgrade
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95'
                              : p.popular
                              ? 'bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 hover:bg-slate-700 text-white'
                          }`}
                        >
                          {selected ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Current Active Tier</span>
                            </>
                          ) : isUpgrade ? (
                            <>
                              <Zap className="w-3.5 h-3.5" />
                              <span>Upgrade to {p.name}</span>
                              <ArrowRight className="w-3 h-3" />
                            </>
                          ) : (
                            <>
                              <span>Switch to {p.name}</span>
                              <ArrowRight className="w-3 h-3" />
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
              
              {/* SECTION: LISTINGS & INVENTORY CAPACITY */}
              <tr className="bg-slate-900/60 font-black text-amber-400 tracking-wider uppercase text-[10px]">
                <td colSpan={4} className="p-2.5 px-4">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Inventory Limits & Capacity</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-300 bg-slate-900/30 border-r border-slate-800/60">
                  Active Listings Limit
                </td>
                {plans.map((p) => (
                  <td key={p.id} className={`p-3.5 font-black text-sm ${p.id === 'enterprise' ? 'text-emerald-400' : 'text-amber-400'} ${p.popular ? 'bg-amber-500/5' : ''}`}>
                    {p.maxListings}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-300 bg-slate-900/30 border-r border-slate-800/60">
                  Target Equipment Yard
                </td>
                {plans.map((p) => (
                  <td key={p.id} className={`p-3.5 text-slate-200 ${p.popular ? 'bg-amber-500/5' : ''}`}>
                    {p.target}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-300 bg-slate-900/30 border-r border-slate-800/60">
                  Printable Shelf & Bin QR Labels
                </td>
                {plans.map((p) => (
                  <td key={p.id} className={`p-3.5 text-slate-200 ${p.popular ? 'bg-amber-500/5' : ''}`}>
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>{p.qrTags}</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* SECTION: BUYER VISIBILITY & SEARCH RANKING */}
              <tr className="bg-slate-900/60 font-black text-amber-400 tracking-wider uppercase text-[10px]">
                <td colSpan={4} className="p-2.5 px-4">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Search Ranking & Visibility</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-300 bg-slate-900/30 border-r border-slate-800/60">
                  Directory Search Ranking
                </td>
                {plans.map((p) => (
                  <td key={p.id} className={`p-3.5 font-bold ${p.id === 'basic' ? 'text-slate-300' : 'text-amber-300'} ${p.popular ? 'bg-amber-500/5' : ''}`}>
                    {p.ranking}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-300 bg-slate-900/30 border-r border-slate-800/60">
                  Geographic Exposure Reach
                </td>
                {plans.map((p) => (
                  <td key={p.id} className={`p-3.5 text-slate-200 ${p.popular ? 'bg-amber-500/5' : ''}`}>
                    {p.reach}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-300 bg-slate-900/30 border-r border-slate-800/60">
                  Direct Buyer Leads Routing
                </td>
                {plans.map((p) => (
                  <td key={p.id} className={`p-3.5 text-slate-200 ${p.popular ? 'bg-amber-500/5' : ''}`}>
                    {p.leads}
                  </td>
                ))}
              </tr>

              {/* SECTION: YARD TOOLS & AUTOMATION */}
              <tr className="bg-slate-900/60 font-black text-amber-400 tracking-wider uppercase text-[10px]">
                <td colSpan={4} className="p-2.5 px-4">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Seller Tools & Support</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-300 bg-slate-900/30 border-r border-slate-800/60">
                  WhatsApp Out-of-Office Auto-Reply
                </td>
                {plans.map((p) => (
                  <td key={p.id} className={`p-3.5 text-slate-200 ${p.popular ? 'bg-amber-500/5' : ''}`}>
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>{p.autoReply}</span>
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-300 bg-slate-900/30 border-r border-slate-800/60">
                  Inventory Upload Assistant
                </td>
                {plans.map((p) => (
                  <td key={p.id} className={`p-3.5 ${p.id === 'enterprise' ? 'font-bold text-emerald-400' : 'text-slate-400'} ${p.popular ? 'bg-amber-500/5' : ''}`}>
                    {p.bulkUpload}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-300 bg-slate-900/30 border-r border-slate-800/60">
                  Yard Performance Analytics
                </td>
                {plans.map((p) => (
                  <td key={p.id} className={`p-3.5 text-slate-200 ${p.popular ? 'bg-amber-500/5' : ''}`}>
                    {p.analytics}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-300 bg-slate-900/30 border-r border-slate-800/60">
                  Account Care & Support SLA
                </td>
                {plans.map((p) => (
                  <td key={p.id} className={`p-3.5 ${p.id === 'enterprise' ? 'font-bold text-indigo-300' : 'text-slate-200'} ${p.popular ? 'bg-amber-500/5' : ''}`}>
                    {p.support}
                  </td>
                ))}
              </tr>
            </tbody>
            {/* Table Footer with Action Buttons */}
            <tfoot>
              <tr className="bg-slate-900/90 border-t border-slate-800">
                <td className="p-4 font-bold text-slate-400">
                  Select Plan to Upgrade:
                </td>
                {plans.map((p) => {
                  const selected = isCurrentPlan(p.id);
                  const isUpgrade = p.rank > currentRank;
                  return (
                    <td key={p.id} className="p-4">
                      <button
                        type="button"
                        onClick={() => handlePlanButtonClick(p)}
                        className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          selected
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                            : isUpgrade
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95'
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                        }`}
                      >
                        {selected ? 'Active Tier' : isUpgrade ? `Upgrade to ${p.name}` : `Select ${p.name}`}
                      </button>
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile Plan Cards */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {plans.map((p) => {
            const selected = isCurrentPlan(p.id);
            const isUpgrade = p.rank > currentRank;
            const savings = Math.max(0, p.originalPrice - p.price);
            return (
              <div
                key={p.id}
                className={`p-5 rounded-2xl border transition-all space-y-4 ${
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
                      {p.isDiscountActive ? (
                        <span className="text-[9px] bg-orange-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                          {p.badge}
                        </span>
                      ) : p.popular ? (
                        <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                          Most Popular
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs text-amber-400 font-bold">{p.maxListings}</span>
                  </div>
                  <div className="text-right">
                    {p.isDiscountActive && p.price < p.originalPrice ? (
                      <div>
                        <div className="text-xs text-slate-500 line-through font-bold">R{p.originalPrice}</div>
                        <div className="text-lg font-black text-amber-400">R{p.price}</div>
                        <span className="text-[9px] text-emerald-400 font-bold">Save R{savings}/mo ({p.discountPercentage}% OFF)</span>
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

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex items-start gap-2 text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Listings:</strong> {p.maxListings}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Ranking:</strong> {p.ranking}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Leads:</strong> {p.leads}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Reach:</strong> {p.reach}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Support:</strong> {p.support}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>QR Labels:</strong> Batch shelf & bin QR tags included</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handlePlanButtonClick(p)}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    selected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : isUpgrade
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  {selected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Current Active Tier</span>
                    </>
                  ) : isUpgrade ? (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Upgrade to {p.name}</span>
                    </>
                  ) : (
                    `Select ${p.name}`
                  )}
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
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold">Seller Portal & Inventory Management</h2>
                {subscriptionAlert && subscriptionAlert.shouldAlert && (
                  <button
                    id="btn-header-expiry-alert-badge"
                    type="button"
                    onClick={() => {
                      setActiveTab('subscription');
                      setSubscriptionSubView('payment_config');
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black cursor-pointer transition-all active:scale-95 border ${
                      subscriptionAlert.isOverdue
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                    }`}
                    title="Click to configure payment method and settle subscription"
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>
                      {subscriptionAlert.isOverdue
                        ? 'Renewal Due • Configure Payment →'
                        : `Expires in ${subscriptionAlert.daysRemaining}d • Configure Payment →`}
                    </span>
                  </button>
                )}
              </div>
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

            <button
              id="btn-seller-tab-broadcast"
              onClick={() => setActiveTab('broadcast')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'broadcast'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
              title="Send WhatsApp Bulk Arrival Broadcasts to Customer Network"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp Broadcasts</span>
              <span className="bg-emerald-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                NEW
              </span>
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
              id="btn-seller-tab-sub-overview"
              onClick={() => setActiveTab('subscription_overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'subscription_overview'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
              title="View Days Remaining in Billing Cycle & Historical Invoices"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Subscription Overview</span>
              {activeSeller?.subscriptionStatus === 'active' ? (
                <span className="bg-emerald-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                  ACTIVE
                </span>
              ) : activeSeller?.subscriptionStatus === 'pending_verification' ? (
                <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                  PENDING
                </span>
              ) : null}
            </button>

            <button
              id="btn-seller-tab-subscription"
              onClick={() => {
                setActiveTab('subscription');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'subscription'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payment & Plans</span>
              {subscriptionAlert?.shouldAlert ? (
                <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                  {subscriptionAlert.isOverdue ? 'DUE' : `${subscriptionAlert.daysRemaining}D`}
                </span>
              ) : null}
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

          {/* 3-Day Subscription Expiry Visual Notification Alert Banner */}
          {subscriptionAlert && subscriptionAlert.shouldAlert && !isExpiryBannerDismissed && (
            <div
              id="alert-subscription-expiring"
              className={`p-4 sm:p-5 rounded-2xl border shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all animate-fadeIn relative overflow-hidden ${
                subscriptionAlert.isOverdue
                  ? 'bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/90 border-rose-500/60 text-rose-200'
                  : 'bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border-amber-500/60 text-amber-200'
              }`}
            >
              {/* Background ambient pulse */}
              <div
                className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
                  subscriptionAlert.isOverdue ? 'bg-rose-500/10' : 'bg-amber-500/10'
                }`}
              />

              <div className="flex items-start sm:items-center gap-3.5 relative z-10">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                    subscriptionAlert.isOverdue
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  <AlertTriangle className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-white">
                      {subscriptionAlert.isOverdue
                        ? '🚨 Subscription Overdue — Immediate Action Required'
                        : `⚡ Subscription Expiring Soon (${subscriptionAlert.daysRemaining} Day${subscriptionAlert.daysRemaining === 1 ? '' : 's'} Remaining)`}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        subscriptionAlert.isOverdue
                          ? 'bg-rose-500 text-slate-950'
                          : 'bg-amber-400 text-slate-950'
                      }`}
                    >
                      {subscriptionAlert.isOverdue ? 'EXPIRED / UNPAID' : `${subscriptionAlert.daysRemaining} DAYS LEFT`}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    Your subscription for <strong className="text-white">{activeSeller?.companyName}</strong> expires on <strong className="text-amber-300">{subscriptionAlert.formattedDueDate}</strong>. Configure your preferred payment method (EFT, Card, or WhatsApp) or settle the invoice now to keep your parts inventory active and maintain WhatsApp buyer leads.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center relative z-10">
                <button
                  id="btn-alert-configure-payment"
                  type="button"
                  onClick={() => {
                    setActiveTab('subscription');
                    setSubscriptionSubView('payment_config');
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
                  title="Open Payment Method Configuration Screen"
                >
                  <CreditCard className="w-4 h-4 text-slate-950" />
                  <span>Configure Payment Method →</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsExpiryBannerDismissed(true)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
                  title="Dismiss notification for this session"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

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
                    <div className="flex items-center gap-4">
                      {/* Yard Logo / Branding Emblem */}
                      <div className="shrink-0 relative group">
                        {activeSeller.logoUrl ? (
                          <div className="w-14 h-14 rounded-2xl bg-white p-1 border-2 border-amber-500/40 shadow-md flex items-center justify-center overflow-hidden">
                            <img
                              src={activeSeller.logoUrl}
                              alt={activeSeller.companyName}
                              className="max-h-full max-w-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border-2 border-dashed border-amber-500/40 flex flex-col items-center justify-center text-amber-400">
                            <Building2 className="w-6 h-6" />
                            <span className="text-[8px] font-bold mt-0.5">NO LOGO</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setBrandingLogoInput(activeSeller.logoUrl || '');
                            setIsBrandingModalOpen(true);
                          }}
                          className="absolute -bottom-1 -right-1 bg-amber-500 hover:bg-amber-400 text-slate-950 p-1 rounded-full shadow-md cursor-pointer transition-all hover:scale-110"
                          title="Change Yard Logo"
                        >
                          <ImageIcon className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
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
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsappExport()}
                        disabled={sellerListings.length === 0}
                        className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        title="Export full inventory grid as formatted WhatsApp payload for customer lists & broadcast groups"
                      >
                        <Share2 className="w-4 h-4 stroke-[2.4]" />
                        <span>Export Grid to WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('broadcast')}
                        className="px-3.5 py-2.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        title="Broadcast New Inventory Arrivals via WhatsApp to Customer Network"
                      >
                        <Send className="w-4 h-4 text-emerald-400" />
                        <span>WhatsApp Arrival Broadcast</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBrandingLogoInput(activeSeller.logoUrl || '');
                          setIsBrandingModalOpen(true);
                        }}
                        className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        title="Configure Yard Logo for Shelf Labels & Invoices"
                      >
                        <Building2 className="w-4 h-4 text-amber-400" />
                        <span>Yard Branding & Logo</span>
                      </button>

                      <button
                        onClick={() => handleOpenBatchQrModal()}
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

                  {/* Plan Capacity & Tier Usage Tracker Bar */}
                  {(() => {
                    const currentPlan = getActivePlan(activeSeller.planId);
                    const isUnlimited = currentPlan.maxListings >= 9999;
                    const maxAllowed = currentPlan.maxListings;
                    const count = sellerListings.length;
                    const percent = isUnlimited ? Math.min(100, (count / 100) * 100) : Math.min(100, Math.round((count / maxAllowed) * 100));
                    const isNearLimit = !isUnlimited && count >= maxAllowed;
                    const isApproaching = !isUnlimited && count >= maxAllowed * 0.8 && count < maxAllowed;

                    return (
                      <div className={`p-4 rounded-2xl border transition-all ${
                        isNearLimit
                          ? 'bg-rose-950/20 border-rose-500/40'
                          : isApproaching
                          ? 'bg-amber-500/10 border-amber-500/40'
                          : 'bg-slate-950 border-slate-800'
                      }`}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-300">Plan Inventory Capacity:</span>
                              <span className="text-xs font-black text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                {currentPlan.name} Plan ({isUnlimited ? 'Unlimited' : `${count} / ${maxAllowed} Used`})
                              </span>
                              {isNearLimit && (
                                <span className="text-[10px] bg-rose-500/20 text-rose-300 font-black px-2 py-0.5 rounded border border-rose-500/30 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-rose-400" /> Plan Limit Reached
                                </span>
                              )}
                              {isApproaching && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30">
                                  Approaching Limit
                                </span>
                              )}
                            </div>

                            {/* Visual Progress Bar */}
                            {!isUnlimited && (
                              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800 mt-2">
                                <div
                                  className={`h-full transition-all duration-500 rounded-full ${
                                    isNearLimit ? 'bg-rose-500' : isApproaching ? 'bg-amber-400' : 'bg-emerald-400'
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setActiveTab('subscription')}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Compare Plans & Upgrade</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Listings Grid */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div>
                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                          <span>Your Current Listings ({sellerListings.length})</span>
                          {selectedItemIds.length > 0 && (
                            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                              {selectedItemIds.length} Selected
                            </span>
                          )}
                        </h4>
                        {sellerListings.length > 0 && (
                          <span className="text-[11px] text-slate-400">
                            Select multiple listings to generate a single continuous thermal print roll or label sheet.
                          </span>
                        )}
                      </div>

                      {sellerListings.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={handleToggleSelectAll}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="Select or deselect all items for bulk printing"
                          >
                            {selectedItemIds.length === sellerListings.length ? (
                              <>
                                <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                                <span>Deselect All</span>
                              </>
                            ) : (
                              <>
                                <Square className="w-3.5 h-3.5 text-slate-400" />
                                <span>Select All ({sellerListings.length})</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenWhatsappExport(selectedItemIds.length > 0 ? selectedItemIds : undefined)}
                            className="px-3.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            title="Export current inventory grid as formatted WhatsApp broadcast message"
                          >
                            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>
                              {selectedItemIds.length > 0
                                ? `Export WhatsApp (${selectedItemIds.length})`
                                : `Export Grid to WhatsApp`}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenBatchQrModal()}
                            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                            title="Bulk Print shelf labels for selected items"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>
                              {selectedItemIds.length > 0
                                ? `Bulk Print Labels (${selectedItemIds.length})`
                                : `Bulk Print All (${sellerListings.length})`}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Bulk Selection Sticky Floating Notification / Bar when items are selected */}
                    {selectedItemIds.length > 0 && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-sm">
                        <div className="flex items-center gap-2 text-amber-300 font-bold">
                          <ListChecks className="w-4 h-4 text-amber-400" />
                          <span>{selectedItemIds.length} of {sellerListings.length} items selected for Bulk Thermal Shelf Label printing</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleClearSelection}
                            className="text-slate-400 hover:text-slate-200 text-[11px] underline cursor-pointer"
                          >
                            Clear
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsappExport(selectedItemIds)}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                            title="Export selected items to formatted WhatsApp payload"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Export WhatsApp ({selectedItemIds.length})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenBatchQrModal()}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Open Bulk Print ({selectedItemIds.length})</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {sellerListings.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sellerListings.map((item) => {
                          const isSelected = selectedItemIds.includes(item.id);
                          return (
                            <div
                              key={item.id}
                              className={`bg-slate-950 p-4 rounded-2xl border transition-all flex flex-col sm:flex-row gap-4 sm:items-center justify-between ${
                                isSelected
                                  ? 'border-amber-500/80 bg-amber-500/[0.03] shadow-md ring-1 ring-amber-500/40'
                                  : 'border-slate-800 hover:border-slate-750'
                              }`}
                            >
                              <div className="flex gap-3 items-center min-w-0">
                                {/* Item Checkbox for Bulk Selection */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleSelectItem(item.id)}
                                  className="shrink-0 text-slate-500 hover:text-amber-400 p-1 cursor-pointer transition-colors"
                                  title={isSelected ? "Deselect item" : "Select item for bulk printing"}
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-5 h-5 text-amber-400" />
                                  ) : (
                                    <Square className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                                  )}
                                </button>

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
                                    {item.partNumber && (
                                      <>
                                        <span>•</span>
                                        <span className="font-mono text-slate-400">OEM: {item.partNumber}</span>
                                      </>
                                    )}
                                    <span>•</span>
                                    <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {item.views}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                <button
                                  onClick={() => handleOpenWhatsappExport([item.id])}
                                  className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors cursor-pointer"
                                  title="Export this listing as formatted WhatsApp message payload"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenQrModal(item)}
                                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                                  title="Open Print Shelf Label UI (Small Thermal & Paper Labels with WhatsApp QR)"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Print Shelf Label</span>
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
                          );
                        })}
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

          {/* TAB: SUBSCRIPTION OVERVIEW (Days Remaining Progress Bar & Historical Payments) */}
          {activeTab === 'subscription_overview' && (
            <div>
              {!activeSeller ? (
                <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center space-y-4">
                  <Building2 className="w-12 h-12 text-amber-400 mx-auto opacity-80" />
                  <h3 className="text-base font-bold text-white">Select a Yard to View Subscription Overview</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Please select an active equipment yard or register a new seller account to track your billing cycle, days remaining, and historical tax invoices.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setActiveTab('switch_account')}
                      className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Select Existing Seller
                    </button>
                    <button
                      onClick={() => setActiveTab('register')}
                      className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Register New Seller
                    </button>
                  </div>
                </div>
              ) : (
                <SubscriptionOverviewTab
                  seller={activeSeller}
                  ownerSettings={ownerSettings}
                  subscriptionPlans={subscriptionPlans && subscriptionPlans.length > 0 ? subscriptionPlans : SUBSCRIPTION_PLANS}
                  getPlanEffectivePricing={getPlanEffectivePricing}
                  onSubmitEftProof={(ref) => {
                    submitPaymentProof(activeSeller.id, ref);
                    showNotice('EFT Payment Proof submitted to App Owner for verification.');
                  }}
                  onNavigateToPlans={() => {
                    setActiveTab('subscription');
                    setSubscriptionSubView('calculator');
                  }}
                  onNavigateToPaymentConfig={() => {
                    setActiveTab('subscription');
                    setSubscriptionSubView('payment_config');
                  }}
                  onSelectPlanUpgrade={(pId) => {
                    handleSelectPlanForActiveSeller(pId as SubscriptionPlanId);
                  }}
                />
              )}
            </div>
          )}

          {/* TAB 2: PLANS & OWNER BANKING DETAILS */}
          {activeTab === 'subscription' && (
            <div className="space-y-8">
              
              {/* SUBVIEW SWITCHER: PAYMENT CONFIG VS CALCULATOR VS MATRIX */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Subscription & Payment Control Center</h4>
                    <p className="text-[11px] text-slate-400">Configure payment method, view bank details, or calculate tier savings</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-auto flex-wrap">
                  <button
                    id="btn-subview-to-overview"
                    type="button"
                    onClick={() => setActiveTab('subscription_overview')}
                    className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-amber-400 hover:text-amber-300 hover:bg-slate-800 border border-amber-500/30"
                    title="View Billing Cycle Progress Bar & Historical Invoices"
                  >
                    <CalendarCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Billing Cycle & Invoices</span>
                  </button>

                  <button
                    id="btn-subview-payment-config"
                    type="button"
                    onClick={() => setSubscriptionSubView('payment_config')}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      subscriptionSubView === 'payment_config'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Payment Methods & Renewal</span>
                    {subscriptionAlert?.shouldAlert && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </button>

                  <button
                    id="btn-subview-calculator"
                    type="button"
                    onClick={() => setSubscriptionSubView('calculator')}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      subscriptionSubView === 'calculator'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>ROI Calculator</span>
                  </button>

                  <button
                    id="btn-subview-matrix"
                    type="button"
                    onClick={() => setSubscriptionSubView('matrix')}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      subscriptionSubView === 'matrix'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Tier Matrix</span>
                  </button>
                </div>
              </div>

              {/* VIEW 1: PAYMENT METHOD CONFIGURATION SCREEN */}
              {subscriptionSubView === 'payment_config' ? (
                activeSeller ? (
                  <PaymentMethodConfigScreen
                    seller={activeSeller}
                    ownerSettings={ownerSettings}
                    subscriptionPlans={subscriptionPlans && subscriptionPlans.length > 0 ? subscriptionPlans : SUBSCRIPTION_PLANS}
                    getPlanEffectivePricing={getPlanEffectivePricing}
                    onSubmitEftProof={(ref) => {
                      submitPaymentProof(activeSeller.id, ref);
                      showNotice('EFT Payment Proof submitted to App Owner for verification.');
                    }}
                    onNavigateToOverview={() => setActiveTab('subscription_overview')}
                    onNavigateToPlans={() => setSubscriptionSubView('calculator')}
                  />
                ) : (
                  <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center space-y-3">
                    <Info className="w-8 h-8 text-amber-400 mx-auto" />
                    <h4 className="text-sm font-bold text-white">Select or Register a Seller Account</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      To configure payment methods, manage recurring renewals, or submit EFT proof, please register your equipment yard or switch to an existing seller profile.
                    </p>
                    <button
                      onClick={() => setActiveTab('register')}
                      className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Register New Yard Now
                    </button>
                  </div>
                )
              ) : subscriptionSubView === 'calculator' ? (
                /* VIEW 2: INTERACTIVE TIER SAVINGS CALCULATOR */
                <TierSavingsCalculator
                  subscriptionPlans={subscriptionPlans && subscriptionPlans.length > 0 ? subscriptionPlans : SUBSCRIPTION_PLANS}
                  activePlanId={activeSeller ? activeSeller.planId : regForm.planId}
                  currentSeller={activeSeller}
                  getPlanEffectivePricing={getPlanEffectivePricing}
                  onSelectPlan={(pId) => {
                    if (activeSeller) {
                      handleSelectPlanForActiveSeller(pId);
                    } else {
                      setRegForm(prev => ({ ...prev, planId: pId }));
                      setActiveTab('register');
                    }
                  }}
                />
              ) : (
                /* VIEW 3: TIERED PLANS COMPARISON TABLE */
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
              )}

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

          {/* TAB: WHATSAPP BULK ARRIVAL BROADCAST TOOL */}
          {activeTab === 'broadcast' && activeSeller && (
            <WhatsappBroadcastTool
              seller={activeSeller}
              sellerListings={sellerListings}
              onOpenInventoryTab={() => setActiveTab('inventory')}
              onOpenExportGridModal={() => handleOpenWhatsappExport()}
            />
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

                  {/* Yard Profile Logo & Branding */}
                  <div className="space-y-2 md:col-span-2 p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-bold flex items-center gap-1.5 text-xs">
                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Yard Profile Logo URL (For Printable Shelf Labels & Badges)</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-normal">Optional</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="url"
                        value={regForm.logoUrl || ''}
                        onChange={(e) => setRegForm({ ...regForm, logoUrl: e.target.value })}
                        placeholder="https://... (direct image link to your company logo)"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                      />
                      {regForm.logoUrl && (
                        <div className="w-10 h-10 rounded-xl bg-white p-1 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                          <img
                            src={regForm.logoUrl}
                            alt="Logo preview"
                            className="max-h-full max-w-full object-contain"
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Quick sample logo presets */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-slate-500 font-bold">Presets:</span>
                      {[
                        { label: '🚜 Heavy Equipment', url: 'https://images.unsplash.com/photo-1579273166152-d725a4e2b755?auto=format&fit=crop&w=300&q=80' },
                        { label: '🚚 Truck & Diesel Spares', url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=300&q=80' },
                        { label: '🚗 Auto Scrap & Dismantler', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=300&q=80' }
                      ].map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setRegForm({ ...regForm, logoUrl: preset.url })}
                          className="text-[10px] bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                      {regForm.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setRegForm({ ...regForm, logoUrl: '' })}
                          className="text-[10px] text-rose-400 hover:text-rose-300 ml-auto cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Choose Subscription Plan Tiered Table */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-amber-400 block border-b border-slate-800 pb-2">
                    Selected Subscription Plan:{' '}
                    <span className="text-white uppercase font-black">
                      {getActivePlan(regForm.planId).name}{' '}
                      {(() => {
                        const pricing = getPlanEffectivePricing(regForm.planId);
                        if (pricing.isDiscountActive && pricing.effectivePrice < pricing.originalPrice) {
                          return `(R${pricing.effectivePrice}/mo • ${pricing.discountPercentage}% OFF Promo)`;
                        }
                        return `(R${pricing.effectivePrice}/mo)`;
                      })()}
                    </span>
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
                    <option value="minibus_taxis">Minibus / Taxi</option>
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

      {/* DEDICATED 'PRINT SHELF LABEL' & THERMAL QR MODAL */}
      {qrModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] max-h-[calc(100dvh-2rem)] overflow-y-auto shadow-2xl text-white my-auto flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white truncate">
                      Print Shelf & Inventory Label
                    </h3>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30 uppercase shrink-0">
                      Thermal & Paper
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    Label for <strong className="text-amber-400">{qrModalItem.title}</strong> • {formatCurrency(qrModalItem.priceZar)}
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
              
              {/* Format Selector Tabs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    Select Label Format & Printer Type:
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Optimized for POS & paper printers
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setQrTagFormat('thermal_58')}
                    className={`p-2.5 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      qrTagFormat === 'thermal_58'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800 font-bold'
                    }`}
                  >
                    <span className="text-xs">58mm Thermal</span>
                    <span className="text-[9px] opacity-80 leading-none">2" Roll / POS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQrTagFormat('thermal_80')}
                    className={`p-2.5 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      qrTagFormat === 'thermal_80'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800 font-bold'
                    }`}
                  >
                    <span className="text-xs">80mm Thermal</span>
                    <span className="text-[9px] opacity-80 leading-none">3" Roll / Zebra</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQrTagFormat('shelf_tag')}
                    className={`p-2.5 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      qrTagFormat === 'shelf_tag'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800 font-bold'
                    }`}
                  >
                    <span className="text-xs">Shelf Lip Tag</span>
                    <span className="text-[9px] opacity-80 leading-none">80x50mm Paper</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQrTagFormat('bin_sticker')}
                    className={`p-2.5 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      qrTagFormat === 'bin_sticker'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800 font-bold'
                    }`}
                  >
                    <span className="text-xs">Bin Sticker</span>
                    <span className="text-[9px] opacity-80 leading-none">Landscape</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQrTagFormat('counter_card')}
                    className={`col-span-2 sm:col-span-1 p-2.5 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      qrTagFormat === 'counter_card'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800 font-bold'
                    }`}
                  >
                    <span className="text-xs">Counter Card</span>
                    <span className="text-[9px] opacity-80 leading-none">Table Flyer</span>
                  </button>
                </div>
              </div>

              {/* Label Content & Thermal Settings Toolbar */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    Label Content & Thermal Print Toggles:
                  </span>
                  <span className="text-[10px] text-amber-400/90 font-medium">
                    Customize fields included on sticker
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={labelOptions.showPrice}
                      onChange={(e) => setLabelOptions(prev => ({ ...prev, showPrice: e.target.checked }))}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-[11px] font-bold">Item Price</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={labelOptions.showPartNumber}
                      onChange={(e) => setLabelOptions(prev => ({ ...prev, showPartNumber: e.target.checked }))}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-[11px] font-bold">Part # / OEM</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={labelOptions.showSellerInfo}
                      onChange={(e) => setLabelOptions(prev => ({ ...prev, showSellerInfo: e.target.checked }))}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-[11px] font-bold">Yard & WA</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-amber-500/30 hover:border-amber-500/60 cursor-pointer text-slate-300 bg-amber-500/5">
                    <input
                      type="checkbox"
                      checked={labelOptions.showYardLogo}
                      onChange={(e) => setLabelOptions(prev => ({ ...prev, showYardLogo: e.target.checked }))}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
                      Yard Logo
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={labelOptions.highContrastThermal}
                      onChange={(e) => setLabelOptions(prev => ({ ...prev, highContrastThermal: e.target.checked }))}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-[11px] font-bold text-amber-400">Pure B&W</span>
                  </label>
                </div>
              </div>

              {/* LIVE PRINTABLE SHELF LABEL PREVIEW */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative">
                <div className="absolute top-2.5 left-3 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <Scissors className="w-3 h-3 text-slate-500" />
                  Live Label Print Preview
                </div>

                {isGeneratingQr ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold">Generating Crisp WhatsApp QR Code...</span>
                  </div>
                ) : (
                  <div
                    id="printable-single-qr-tag"
                    className={`bg-white text-slate-950 rounded-xl shadow-2xl transition-all border-2 border-slate-950 print-qr-tag my-2 ${
                      qrTagFormat === 'thermal_58'
                        ? 'p-3 w-64 flex flex-col items-center text-center space-y-2 print-thermal-58'
                        : qrTagFormat === 'thermal_80'
                        ? 'p-4 w-80 flex flex-col space-y-2.5 print-thermal-80'
                        : qrTagFormat === 'shelf_tag'
                        ? 'p-4 w-72 flex flex-col items-center text-center space-y-2'
                        : qrTagFormat === 'bin_sticker'
                        ? 'p-4 w-96 flex flex-row items-center gap-3'
                        : 'p-6 w-full max-w-lg flex flex-col space-y-3'
                    }`}
                  >
                    {/* 1. 58mm DIRECT THERMAL ROLL LABEL (2" WIDTH) */}
                    {qrTagFormat === 'thermal_58' && (
                      <>
                        <div className="w-full border-b border-dashed border-slate-950 pb-1.5 flex flex-col items-center text-center text-[9px] font-black uppercase text-slate-900 gap-1">
                          <div className="w-full flex items-center justify-between">
                            <span>PART-SMART ZA</span>
                            {labelOptions.showSellerInfo && (
                              <span className="truncate max-w-[120px] font-bold text-slate-800">
                                {activeSeller?.companyName || qrModalItem.sellerName}
                              </span>
                            )}
                          </div>
                          {labelOptions.showYardLogo && (
                            <div className="pt-0.5">
                              {renderYardLogo(qrModalItem.sellerId, true, "max-h-7 max-w-[120px]")}
                            </div>
                          )}
                        </div>

                        {/* Item Title */}
                        <div className="w-full text-center">
                          <h4 className="font-black text-xs text-slate-950 leading-snug line-clamp-2 uppercase tracking-tight">
                            {qrModalItem.title}
                          </h4>
                          <div className="text-[9px] font-bold text-slate-800 mt-0.5">
                            {qrModalItem.make} {qrModalItem.model} {qrModalItem.year ? `(${qrModalItem.year})` : ''}
                          </div>
                        </div>

                        {/* Part Number & Specs */}
                        {labelOptions.showPartNumber && qrModalItem.partNumber && (
                          <div className="w-full bg-slate-100 py-0.5 px-1 rounded border border-slate-300 font-mono text-[9px] font-bold text-slate-950">
                            OEM: {qrModalItem.partNumber}
                          </div>
                        )}

                        {/* Price */}
                        {labelOptions.showPrice && (
                          <div className="w-full py-0.5 border-y border-slate-950 my-0.5">
                            <span className="text-base font-black text-slate-950">
                              {formatCurrency(qrModalItem.priceZar)}
                            </span>
                            <span className="text-[8px] font-bold uppercase ml-1.5 px-1 py-0.2 bg-slate-200 text-slate-900 rounded">
                              {qrModalItem.condition}
                            </span>
                          </div>
                        )}

                        {/* High-Contrast QR Code */}
                        <div className="p-1 bg-white border border-slate-950 rounded-lg">
                          {qrCodeDataUrl && (
                            <img
                              src={qrCodeDataUrl}
                              alt="WhatsApp QR Code"
                              className="w-32 h-32 object-contain mx-auto"
                            />
                          )}
                        </div>

                        {/* Thermal Footer */}
                        <div className="w-full text-center space-y-0.5 pt-0.5 border-t border-dashed border-slate-950">
                          <div className="text-[9px] font-black uppercase text-slate-950">
                            SCAN TO WHATSAPP DESK
                          </div>
                          {labelOptions.showSellerInfo && (
                            <div className="text-[8px] font-mono font-bold text-slate-800">
                              WA: {activeSeller?.whatsapp || qrModalItem.sellerWhatsapp || qrModalItem.sellerPhone}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* 2. 80mm DIRECT THERMAL ROLL LABEL (3" WIDTH) */}
                    {qrTagFormat === 'thermal_80' && (
                      <>
                        <div className="w-full border-b-2 border-slate-950 pb-1 flex items-center justify-between text-[10px] font-black uppercase">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-950">PART-SMART.ZA</span>
                            {labelOptions.showYardLogo && renderYardLogo(qrModalItem.sellerId, true, "max-h-6 max-w-[90px]")}
                          </div>
                          {labelOptions.showSellerInfo && (
                            <span className="truncate max-w-[140px] text-slate-800 font-bold">
                              {activeSeller?.companyName || qrModalItem.sellerName}
                            </span>
                          )}
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 text-left space-y-1">
                            <h4 className="font-black text-sm text-slate-950 leading-tight">
                              {qrModalItem.title}
                            </h4>
                            <div className="text-[10px] text-slate-800 font-bold">
                              {qrModalItem.make} {qrModalItem.model} {qrModalItem.year ? `• ${qrModalItem.year}` : ''}
                            </div>
                            
                            {labelOptions.showPartNumber && qrModalItem.partNumber && (
                              <div className="text-[9px] font-mono font-bold text-slate-950 bg-slate-100 px-1 py-0.5 rounded border border-slate-300 inline-block">
                                OEM: {qrModalItem.partNumber}
                              </div>
                            )}

                            {labelOptions.showPrice && (
                              <div className="pt-1">
                                <div className="text-lg font-black text-slate-950">
                                  {formatCurrency(qrModalItem.priceZar)}
                                </div>
                                <span className="text-[8px] font-bold uppercase bg-slate-200 px-1.5 py-0.5 rounded text-slate-900">
                                  {qrModalItem.condition}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 flex flex-col items-center">
                            <div className="p-1 bg-white border-2 border-slate-950 rounded-lg">
                              {qrCodeDataUrl && (
                                <img
                                  src={qrCodeDataUrl}
                                  alt="WhatsApp QR Code"
                                  className="w-28 h-28 object-contain"
                                />
                              )}
                            </div>
                            <span className="text-[8px] font-black uppercase text-slate-950 mt-0.5">
                              Scan for WA
                            </span>
                          </div>
                        </div>

                        <div className="w-full text-center pt-1 border-t border-slate-950 flex items-center justify-between text-[9px] font-bold text-slate-900">
                          <span>Scan with camera to chat</span>
                          {labelOptions.showSellerInfo && (
                            <span className="font-mono">WA: {activeSeller?.whatsapp || qrModalItem.sellerWhatsapp}</span>
                          )}
                        </div>
                      </>
                    )}

                    {/* 3. STANDARD WAREHOUSE SHELF LIP TAG (PAPER / CARDSTOCK 80x50mm) */}
                    {qrTagFormat === 'shelf_tag' && (
                      <>
                        <div className="w-full border-b border-slate-200 pb-1.5 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">
                              Part-Smart ZA
                            </span>
                            {labelOptions.showYardLogo && renderYardLogo(qrModalItem.sellerId, false, "max-h-6 max-w-[80px] p-0.5 rounded bg-white border border-slate-200")}
                          </div>
                          {labelOptions.showSellerInfo && (
                            <span className="text-[9px] font-bold text-slate-500 truncate max-w-[110px]">
                              {activeSeller?.companyName || qrModalItem.sellerName}
                            </span>
                          )}
                        </div>

                        <div className="w-full text-left">
                          <h4 className="font-black text-xs text-slate-900 leading-tight line-clamp-2">
                            {qrModalItem.title}
                          </h4>
                          {labelOptions.showPartNumber && qrModalItem.partNumber && (
                            <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                              OEM / Part #: <strong className="text-slate-800">{qrModalItem.partNumber}</strong>
                            </div>
                          )}
                          {labelOptions.showPrice && (
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm font-black text-emerald-700">
                                {formatCurrency(qrModalItem.priceZar)}
                              </span>
                              <span className="text-[9px] font-bold uppercase bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {qrModalItem.condition}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* High-Resolution QR Code */}
                        <div className="bg-white p-2 rounded-xl border border-slate-300 shadow-xs my-1">
                          {qrCodeDataUrl && (
                            <img
                              src={qrCodeDataUrl}
                              alt="WhatsApp QR Code"
                              className="w-36 h-36 object-contain mx-auto"
                            />
                          )}
                        </div>

                        <div className="w-full text-center space-y-0.5 pt-1 border-t border-slate-200">
                          <span className="text-[10px] font-black text-emerald-700 flex items-center justify-center gap-1">
                            <Smartphone className="w-3 h-3 text-emerald-600 inline" />
                            Scan with Phone Camera
                          </span>
                          <p className="text-[8px] text-slate-500">
                            Opens direct WhatsApp chat with parts desk
                          </p>
                          {labelOptions.showSellerInfo && (
                            <p className="text-[9px] font-mono text-slate-700 font-bold">
                              WA: {activeSeller?.whatsapp || qrModalItem.sellerWhatsapp || qrModalItem.sellerPhone}
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* 4. BIN & PART ADHESIVE STICKER (LANDSCAPE) */}
                    {qrTagFormat === 'bin_sticker' && (
                      <>
                        <div className="shrink-0 bg-white p-1.5 rounded-xl border border-slate-300 shadow-xs flex flex-col items-center">
                          {qrCodeDataUrl && (
                            <img
                              src={qrCodeDataUrl}
                              alt="WhatsApp QR Code"
                              className="w-28 h-28 object-contain"
                            />
                          )}
                          <div className="text-[8px] text-center font-black uppercase text-emerald-700 mt-0.5">
                            Scan for WA
                          </div>
                        </div>

                        <div className="min-w-0 flex-1 space-y-1 text-left">
                          <div className="flex items-center justify-between gap-2">
                            {labelOptions.showSellerInfo && (
                              <div className="text-[9px] font-black text-amber-600 uppercase tracking-wider truncate">
                                {activeSeller?.companyName || qrModalItem.sellerName}
                              </div>
                            )}
                            {labelOptions.showYardLogo && renderYardLogo(qrModalItem.sellerId, false, "max-h-5 max-w-[80px] p-0.5 rounded bg-white border border-slate-200")}
                          </div>
                          <h4 className="font-black text-xs text-slate-900 leading-snug">
                            {qrModalItem.title}
                          </h4>
                          <div className="text-[10px] text-slate-600 font-medium">
                            <span>{qrModalItem.make} {qrModalItem.model}</span>
                            {labelOptions.showPartNumber && qrModalItem.partNumber && (
                              <span className="font-mono block text-[9px] text-slate-500 font-bold">
                                OEM: {qrModalItem.partNumber}
                              </span>
                            )}
                          </div>
                          {labelOptions.showPrice && (
                            <div className="pt-0.5 flex items-center justify-between border-t border-slate-200">
                              <span className="text-sm font-black text-emerald-700">
                                {formatCurrency(qrModalItem.priceZar)}
                              </span>
                              <span className="text-[9px] font-bold uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                                {qrModalItem.condition}
                              </span>
                            </div>
                          )}
                          {labelOptions.showSellerInfo && (
                            <div className="text-[9px] font-bold text-slate-700 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-emerald-600" />
                              <span>WA: {activeSeller?.whatsapp || qrModalItem.sellerWhatsapp}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* 5. SHOWROOM COUNTER FLYER */}
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
                          <div className="flex items-center gap-2">
                            {labelOptions.showYardLogo && renderYardLogo(qrModalItem.sellerId, false, "max-h-7 max-w-[120px] rounded border border-slate-200 p-0.5 bg-white")}
                            {labelOptions.showSellerInfo && (
                              <span className="text-xs font-bold text-slate-600">
                                {activeSeller?.companyName || qrModalItem.sellerName}
                              </span>
                            )}
                          </div>
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
                              {labelOptions.showPartNumber && qrModalItem.partNumber && (
                                <div><strong>Part No:</strong> <span className="font-mono">{qrModalItem.partNumber}</span></div>
                              )}
                              <div><strong>Location:</strong> {qrModalItem.city}, {qrModalItem.province}</div>
                            </div>
                            {labelOptions.showPrice && (
                              <div className="text-xl font-black text-emerald-700 pt-1">
                                {formatCurrency(qrModalItem.priceZar)}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
                            {qrCodeDataUrl && (
                              <img
                                src={qrCodeDataUrl}
                                alt="WhatsApp Inquiry QR Code"
                                className="w-32 h-32 object-contain"
                              />
                            )}
                            <strong className="text-xs font-black text-slate-900 block">
                              Instant WhatsApp Inquiry
                            </strong>
                            <p className="text-[10px] text-slate-500">
                              Scan with your camera to chat with our parts desk immediately.
                            </p>
                            {labelOptions.showSellerInfo && (
                              <span className="font-mono font-bold text-xs text-emerald-700">
                                {activeSeller?.whatsapp || qrModalItem.sellerWhatsapp}
                              </span>
                            )}
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
                  title="Print shelf tag to thermal printer or paper printer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Shelf Label</span>
                </button>

                <button
                  type="button"
                  onClick={() => qrCodeDataUrl && handleDownloadQrPng(qrModalItem, qrCodeDataUrl)}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700 active:scale-95"
                  title="Download high resolution QR code PNG"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Download QR PNG</span>
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
                      <span>Copy WA Link</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQrModalItem(null);
                    handleOpenBatchQrModal();
                  }}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-amber-500/30 active:scale-95"
                  title="Switch to Batch Print All Inventory Labels"
                >
                  <Layers className="w-4 h-4" />
                  <span>Batch Print All</span>
                </button>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Attach this label to your shelving channels, bins, or part boxes for instant walk-in leads.</span>
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

      {/* BATCH INVENTORY QR & THERMAL SHELF LABELS BULK PRINT MODAL */}
      {batchQrPrintMode && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] max-h-[calc(100dvh-2rem)] overflow-y-auto shadow-2xl text-white my-auto flex flex-col">
            
            {/* Batch Header */}
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">
                      Bulk Shelf Label & Thermal Tag Printing
                    </h3>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30 uppercase shrink-0">
                      Thermal & Paper
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {batchQrItems.length} selected items ({batchQrItems.length * labelOptions.copiesCount} total labels) • <strong className="text-amber-400">{activeSeller?.companyName}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handlePrintCurrentTag}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print {batchQrItems.length * labelOptions.copiesCount} Labels</span>
                </button>
                <button
                  onClick={() => setBatchQrPrintMode(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Batch Controls Toolbar */}
            <div className="p-5 space-y-4 border-b border-slate-800 bg-slate-950/70">
              
              {/* Printer / Label Format Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    Select Thermal Printer Roll or Paper Format:
                  </span>
                  <span className="text-[10px] text-amber-400 font-medium">
                    Single printable page formatted for thermal rolls
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setBatchLabelFormat('thermal_58')}
                    className={`p-2.5 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      batchLabelFormat === 'thermal_58'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800 font-bold'
                    }`}
                  >
                    <span className="text-xs">58mm Thermal Roll</span>
                    <span className="text-[9px] opacity-80 leading-none">2" Continuous / POS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBatchLabelFormat('thermal_80')}
                    className={`p-2.5 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      batchLabelFormat === 'thermal_80'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800 font-bold'
                    }`}
                  >
                    <span className="text-xs">80mm Thermal Roll</span>
                    <span className="text-[9px] opacity-80 leading-none">3" Zebra / Wide Roll</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBatchLabelFormat('shelf_tag')}
                    className={`p-2.5 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      batchLabelFormat === 'shelf_tag'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800 font-bold'
                    }`}
                  >
                    <span className="text-xs">Shelf Lip Tags</span>
                    <span className="text-[9px] opacity-80 leading-none">80x50mm Paper Grid</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBatchLabelFormat('bin_sticker')}
                    className={`p-2.5 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      batchLabelFormat === 'bin_sticker'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800 font-bold'
                    }`}
                  >
                    <span className="text-xs">Bin Adhesive Stickers</span>
                    <span className="text-[9px] opacity-80 leading-none">Landscape Peel Sheet</span>
                  </button>
                </div>
              </div>

              {/* Thermal Toggles & Copies Counter */}
              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5 mr-1">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    Toggles:
                  </span>

                  <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={labelOptions.showPrice}
                      onChange={(e) => setLabelOptions(prev => ({ ...prev, showPrice: e.target.checked }))}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-[11px] font-bold">Price</span>
                  </label>

                  <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={labelOptions.showPartNumber}
                      onChange={(e) => setLabelOptions(prev => ({ ...prev, showPartNumber: e.target.checked }))}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-[11px] font-bold">OEM / Part #</span>
                  </label>

                  <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={labelOptions.showSellerInfo}
                      onChange={(e) => setLabelOptions(prev => ({ ...prev, showSellerInfo: e.target.checked }))}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-[11px] font-bold">Yard WhatsApp</span>
                  </label>

                  <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={labelOptions.showYardLogo}
                      onChange={(e) => setLabelOptions(prev => ({ ...prev, showYardLogo: e.target.checked }))}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-[11px] font-bold flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
                      Yard Logo
                    </span>
                  </label>

                  <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={labelOptions.highContrastThermal}
                      onChange={(e) => setLabelOptions(prev => ({ ...prev, highContrastThermal: e.target.checked }))}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-[11px] font-bold text-amber-400">Pure B&W</span>
                  </label>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold text-[11px]">Copies / item:</span>
                    <select
                      value={labelOptions.copiesCount}
                      onChange={(e) => setLabelOptions(prev => ({ ...prev, copiesCount: Number(e.target.value) }))}
                      className="bg-slate-950 border border-slate-700 text-white font-bold rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                    >
                      <option value={1}>1 copy</option>
                      <option value={2}>2 copies</option>
                      <option value={3}>3 copies</option>
                      <option value={4}>4 copies</option>
                      <option value={5}>5 copies</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handlePrintCurrentTag}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print (⌘P)</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Batch Labels Live Printable Canvas */}
            <div className="p-6 space-y-6 flex-1 bg-slate-950 overflow-y-auto">
              
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    💡 <strong>Thermal Print Preview:</strong> Labels below are styled for direct continuous thermal roll feed with dashed tear lines, pure B&W contrast, and instant WhatsApp QR links.
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 shrink-0">
                  Format: <strong className="text-amber-400 uppercase">{batchLabelFormat.replace('_', ' ')}</strong>
                </div>
              </div>

              {/* Printable container formatted for thermal roll or grid */}
              <div className={`print-only-container ${
                batchLabelFormat === 'thermal_58' || batchLabelFormat === 'thermal_80'
                  ? 'print-thermal-roll-container flex flex-col items-center'
                  : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
              }`}>
                {batchQrItems.map(({ item, qrDataUrl }, itemIdx) => {
                  // Render copies if requested
                  const copies = Array.from({ length: labelOptions.copiesCount }, (_, i) => i);
                  
                  return copies.map((copyIdx) => (
                    <div
                      key={`${item.id}-copy-${copyIdx}`}
                      className={`bg-white text-slate-950 rounded-xl shadow-md transition-all border-2 border-slate-950 print-qr-tag ${
                        batchLabelFormat === 'thermal_58'
                          ? 'p-3 w-64 flex flex-col items-center text-center space-y-2 print-thermal-58'
                          : batchLabelFormat === 'thermal_80'
                          ? 'p-4 w-80 flex flex-col space-y-2.5 print-thermal-80'
                          : batchLabelFormat === 'shelf_tag'
                          ? 'p-4 flex flex-col justify-between space-y-2.5'
                          : 'p-4 flex flex-row items-center gap-3'
                      }`}
                    >
                      {/* 1. 58mm DIRECT THERMAL ROLL LABEL */}
                      {batchLabelFormat === 'thermal_58' && (
                        <>
                          <div className="w-full border-b border-dashed border-slate-950 pb-1.5 flex flex-col items-center text-center text-[9px] font-black uppercase text-slate-900 gap-1">
                            <div className="w-full flex items-center justify-between">
                              <span>PART-SMART ZA</span>
                              {labelOptions.showSellerInfo && (
                                <span className="truncate max-w-[120px] font-bold text-slate-800">
                                  {activeSeller?.companyName || item.sellerName}
                                </span>
                              )}
                            </div>
                            {labelOptions.showYardLogo && (
                              <div className="pt-0.5">
                                {renderYardLogo(item.sellerId, true, "max-h-7 max-w-[120px]")}
                              </div>
                            )}
                          </div>

                          <div className="w-full text-center">
                            <h4 className="font-black text-xs text-slate-950 leading-snug line-clamp-2 uppercase tracking-tight">
                              {item.title}
                            </h4>
                            <div className="text-[9px] font-bold text-slate-800 mt-0.5">
                              {item.make} {item.model} {item.year ? `(${item.year})` : ''}
                            </div>
                          </div>

                          {labelOptions.showPartNumber && item.partNumber && (
                            <div className="w-full bg-slate-100 py-0.5 px-1 rounded border border-slate-300 font-mono text-[9px] font-bold text-slate-950">
                              OEM: {item.partNumber}
                            </div>
                          )}

                          {labelOptions.showPrice && (
                            <div className="w-full py-0.5 border-y border-slate-950 my-0.5">
                              <span className="text-base font-black text-slate-950">
                                {formatCurrency(item.priceZar)}
                              </span>
                              <span className="text-[8px] font-bold uppercase ml-1.5 px-1 py-0.2 bg-slate-200 text-slate-900 rounded">
                                {item.condition}
                              </span>
                            </div>
                          )}

                          <div className="p-1 bg-white border border-slate-950 rounded-lg">
                            <img
                              src={qrDataUrl}
                              alt="WhatsApp QR Code"
                              className="w-32 h-32 object-contain mx-auto"
                            />
                          </div>

                          <div className="w-full text-center space-y-0.5 pt-0.5 border-t border-dashed border-slate-950">
                            <div className="text-[9px] font-black uppercase text-slate-950">
                              SCAN FOR DIRECT WHATSAPP
                            </div>
                            {labelOptions.showSellerInfo && (
                              <div className="text-[8px] font-mono font-bold text-slate-800">
                                WA: {activeSeller?.whatsapp || item.sellerWhatsapp || item.sellerPhone}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* 2. 80mm DIRECT THERMAL ROLL LABEL */}
                      {batchLabelFormat === 'thermal_80' && (
                        <>
                          <div className="w-full border-b-2 border-slate-950 pb-1 flex items-center justify-between text-[10px] font-black uppercase">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-950">PART-SMART.ZA</span>
                              {labelOptions.showYardLogo && renderYardLogo(item.sellerId, true, "max-h-6 max-w-[90px]")}
                            </div>
                            {labelOptions.showSellerInfo && (
                              <span className="truncate max-w-[140px] text-slate-800 font-bold">
                                {activeSeller?.companyName || item.sellerName}
                              </span>
                            )}
                          </div>

                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 text-left space-y-1">
                              <h4 className="font-black text-sm text-slate-950 leading-tight">
                                {item.title}
                              </h4>
                              <div className="text-[10px] text-slate-800 font-bold">
                                {item.make} {item.model} {item.year ? `• ${item.year}` : ''}
                              </div>
                              
                              {labelOptions.showPartNumber && item.partNumber && (
                                <div className="text-[9px] font-mono font-bold text-slate-950 bg-slate-100 px-1 py-0.5 rounded border border-slate-300 inline-block">
                                  OEM: {item.partNumber}
                                </div>
                              )}

                              {labelOptions.showPrice && (
                                <div className="pt-1">
                                  <div className="text-lg font-black text-slate-950">
                                    {formatCurrency(item.priceZar)}
                                  </div>
                                  <span className="text-[8px] font-bold uppercase bg-slate-200 px-1.5 py-0.5 rounded text-slate-900">
                                    {item.condition}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="shrink-0 flex flex-col items-center">
                              <div className="p-1 bg-white border-2 border-slate-950 rounded-lg">
                                <img
                                  src={qrDataUrl}
                                  alt="WhatsApp QR Code"
                                  className="w-28 h-28 object-contain"
                                />
                              </div>
                              <span className="text-[8px] font-black uppercase text-slate-950 mt-0.5">
                                Scan for WA
                              </span>
                            </div>
                          </div>

                          <div className="w-full text-center pt-1 border-t border-slate-950 flex items-center justify-between text-[9px] font-bold text-slate-900">
                            <span>Scan with camera to chat</span>
                            {labelOptions.showSellerInfo && (
                              <span className="font-mono">WA: {activeSeller?.whatsapp || item.sellerWhatsapp}</span>
                            )}
                          </div>
                        </>
                      )}

                      {/* 3. SHELF LIP TAGS (80x50mm Paper Grid) */}
                      {batchLabelFormat === 'shelf_tag' && (
                        <>
                          <div className="border-b border-slate-300 pb-2">
                            <div className="flex items-center justify-between text-[9px] font-black text-amber-600 uppercase">
                              <div className="flex items-center gap-1.5">
                                <span>Part-Smart ZA</span>
                                {labelOptions.showYardLogo && renderYardLogo(item.sellerId, false, "max-h-5 max-w-[70px] p-0.5 rounded bg-white border border-slate-200")}
                              </div>
                              {labelOptions.showSellerInfo && (
                                <span className="text-slate-700 font-bold truncate max-w-[110px]">
                                  {activeSeller?.companyName || item.sellerName}
                                </span>
                              )}
                            </div>
                            <h4 className="font-black text-xs text-slate-950 leading-tight mt-1 line-clamp-2 uppercase">
                              {item.title}
                            </h4>
                            <div className="text-[10px] text-slate-700 mt-0.5 font-medium flex items-center justify-between">
                              <span>{item.make} {item.model}</span>
                              <span className="uppercase font-bold text-[9px] bg-slate-100 px-1 py-0.5 rounded border border-slate-200">{item.condition}</span>
                            </div>
                            {labelOptions.showPartNumber && item.partNumber && (
                              <div className="text-[9px] font-mono text-slate-600 mt-0.5">
                                OEM: <strong className="text-slate-900">{item.partNumber}</strong>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-3 py-1">
                            <div className="min-w-0">
                              {labelOptions.showPrice && (
                                <div className="text-base font-black text-emerald-700">
                                  {formatCurrency(item.priceZar)}
                                </div>
                              )}
                              {labelOptions.showSellerInfo && (
                                <div className="text-[9px] text-slate-700 mt-1 font-bold">
                                  WA: <strong>{activeSeller?.whatsapp || item.sellerWhatsapp}</strong>
                                </div>
                              )}
                              <div className="text-[8px] text-slate-500 font-mono mt-0.5">
                                {item.city}, {item.province}
                              </div>
                            </div>

                            <div className="shrink-0 bg-white p-1 rounded-xl border border-slate-400">
                              <img
                                src={qrDataUrl}
                                alt="QR Code"
                                className="w-20 h-20 object-contain"
                              />
                            </div>
                          </div>

                          <div className="text-center pt-1.5 border-t border-slate-300 text-[8px] text-slate-800 font-bold uppercase tracking-wider">
                            Scan with camera for instant WhatsApp
                          </div>
                        </>
                      )}

                      {/* 4. BIN ADHESIVE STICKERS (Landscape) */}
                      {batchLabelFormat === 'bin_sticker' && (
                        <>
                          <div className="shrink-0 bg-white p-1.5 rounded-xl border border-slate-300 shadow-xs flex flex-col items-center">
                            <img
                              src={qrDataUrl}
                              alt="WhatsApp QR Code"
                              className="w-24 h-24 object-contain"
                            />
                            <div className="text-[8px] text-center font-black uppercase text-emerald-700 mt-0.5">
                              Scan for WA
                            </div>
                          </div>

                          <div className="min-w-0 flex-1 space-y-1 text-left">
                            <div className="flex items-center justify-between gap-2">
                              {labelOptions.showSellerInfo && (
                                <div className="text-[9px] font-black text-amber-600 uppercase tracking-wider truncate">
                                  {activeSeller?.companyName || item.sellerName}
                                </div>
                              )}
                              {labelOptions.showYardLogo && renderYardLogo(item.sellerId, false, "max-h-5 max-w-[70px] p-0.5 rounded bg-white border border-slate-200")}
                            </div>
                            <h4 className="font-black text-xs text-slate-900 leading-snug">
                              {item.title}
                            </h4>
                            <div className="text-[10px] text-slate-600 font-medium">
                              <span>{item.make} {item.model}</span>
                              {labelOptions.showPartNumber && item.partNumber && (
                                <span className="font-mono block text-[9px] text-slate-500 font-bold">
                                  OEM: {item.partNumber}
                                </span>
                              )}
                            </div>
                            {labelOptions.showPrice && (
                              <div className="pt-0.5 flex items-center justify-between border-t border-slate-200">
                                <span className="text-sm font-black text-emerald-700">
                                  {formatCurrency(item.priceZar)}
                                </span>
                                <span className="text-[9px] font-bold uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                                  {item.condition}
                                </span>
                              </div>
                            )}
                            {labelOptions.showSellerInfo && (
                              <div className="text-[9px] font-bold text-slate-700 flex items-center gap-1">
                                <MessageSquare className="w-3 h-3 text-emerald-600" />
                                <span>WA: {activeSeller?.whatsapp || item.sellerWhatsapp}</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                    </div>
                  ));
                })}
              </div>
            </div>

            {/* Batch Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <span>
                  Total <strong>{batchQrItems.length}</strong> items • <strong>{batchQrItems.length * labelOptions.copiesCount}</strong> labels to print.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintCurrentTag}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print All Labels</span>
                </button>
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
        </div>
      )}

      {/* LISTING LIMIT WARNING MODAL */}
      {limitWarningModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-md p-6 space-y-5 text-white shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Listing Limit Reached</h3>
                  <p className="text-xs text-amber-400 font-semibold">
                    {limitWarningModal.planName} Plan ({limitWarningModal.currentCount} / {limitWarningModal.maxAllowed} listings)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLimitWarningModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <p>
                Your scrap yard has reached the maximum of <strong className="text-white">{limitWarningModal.maxAllowed} active listings</strong> allowed under the <strong className="text-amber-400">{limitWarningModal.planName}</strong> plan.
              </p>
              <p className="text-slate-400 text-[11px]">
                Upgrade to a higher tier like <strong className="text-amber-400">Pro (50 listings)</strong> or <strong className="text-emerald-400">Enterprise (Unlimited listings)</strong> to list more truck spares and heavy equipment parts.
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setLimitWarningModal(null);
                  setActiveTab('subscription');
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Crown className="w-4 h-4" />
                <span>View Comparison & Upgrade Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                type="button"
                onClick={() => setLimitWarningModal(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close & Manage Existing Listings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAN UPGRADE CONFIRMATION DIALOG */}
      {upgradeTargetPlan && (
        <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl w-full max-w-lg p-6 space-y-5 text-white shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {upgradeTargetPlan.isUpgrade ? 'Confirm Subscription Upgrade' : 'Switch Subscription Tier'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Yard: <strong className="text-white">{activeSeller?.companyName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUpgradeTargetPlan(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Plan Details & Rate Card */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                    Target Plan
                  </span>
                  <h4 className="text-xl font-black text-white">{upgradeTargetPlan.name} Plan</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{upgradeTargetPlan.description}</p>
                </div>
                <div className="text-right">
                  {upgradeTargetPlan.isDiscountActive && upgradeTargetPlan.price < upgradeTargetPlan.originalPrice ? (
                    <div>
                      <span className="text-xs text-slate-500 line-through font-bold block">
                        R{upgradeTargetPlan.originalPrice}
                      </span>
                      <div className="text-2xl font-black text-amber-400">
                        R{upgradeTargetPlan.price}
                        <span className="text-xs text-slate-400 font-normal">/mo</span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full inline-block mt-0.5">
                        {upgradeTargetPlan.discountPercentage}% OFF Promo
                      </span>
                    </div>
                  ) : (
                    <div className="text-2xl font-black text-white">
                      R{upgradeTargetPlan.price}
                      <span className="text-xs text-slate-400 font-normal">/mo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Key Features Included */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Included in this Tier:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {upgradeTargetPlan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Note about EFT Payment */}
            <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Updating to this plan immediately applies the new listing limits. Please transfer the monthly fee (<strong>R{upgradeTargetPlan.price}</strong>) via EFT using the App Owner banking details.
              </p>
            </div>

            {/* Dialog Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  handleSelectPlanForActiveSeller(upgradeTargetPlan.id);
                  setUpgradeTargetPlan(null);
                  setActiveTab('subscription');
                }}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Switch to {upgradeTargetPlan.name}</span>
              </button>
              
              <button
                type="button"
                onClick={() => setUpgradeTargetPlan(null)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yard Branding & Profile Logo Configuration Modal */}
      {isBrandingModalOpen && activeSeller && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 text-white my-auto shadow-2xl animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Yard Branding & Logo</h3>
                  <p className="text-xs text-slate-400">Configure logo for printable shelf labels & WhatsApp inquiries</p>
                </div>
              </div>
              <button
                onClick={() => setIsBrandingModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Logo Preview & Upload */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="w-20 h-20 rounded-2xl bg-white p-1.5 border-2 border-amber-500/50 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                  {brandingLogoInput.trim() ? (
                    <img
                      src={brandingLogoInput.trim()}
                      alt="Logo preview"
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 text-center">
                      <Building2 className="w-8 h-8 opacity-40" />
                      <span className="text-[9px] font-black text-slate-500 mt-1 uppercase">No Logo</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="font-bold text-white text-sm">{activeSeller.companyName}</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    This logo appears at the top/corner of all printed thermal rolls (58mm/80mm), shelf-lip tags, and adhesive bin stickers.
                  </p>
                  {brandingLogoInput.trim() && (
                    <span className="inline-block text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      ✓ Logo URL Active
                    </span>
                  )}
                </div>
              </div>

              {/* URL Input */}
              <div className="space-y-1.5 text-xs">
                <label className="text-slate-300 font-medium flex items-center justify-between">
                  <span>Direct Image URL (PNG / JPG / WebP / SVG)</span>
                  <span className="text-[10px] text-slate-500">Square or rectangular logo recommended</span>
                </label>
                <input
                  type="url"
                  value={brandingLogoInput}
                  onChange={(e) => setBrandingLogoInput(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Sample Presets */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Quick Industry Logo Presets:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { label: '🚜 Heavy Equipment / Yellow Metal', url: 'https://images.unsplash.com/photo-1579273166152-d725a4e2b755?auto=format&fit=crop&w=300&q=80' },
                    { label: '🚚 Truck & Commercial Diesel', url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=300&q=80' },
                    { label: '🚗 Auto Scrap & Dismantler', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=300&q=80' },
                    { label: '⚙️ Industrial Machine Spares', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80' }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setBrandingLogoInput(preset.url)}
                      className="text-left p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all cursor-pointer group"
                    >
                      <div className="font-bold text-slate-200 group-hover:text-amber-400 text-[11px]">{preset.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  updateSeller({
                    ...activeSeller,
                    logoUrl: brandingLogoInput.trim() || undefined
                  });
                  showNotice('Yard Profile Logo updated successfully! It will now appear on all printed labels.');
                  setIsBrandingModalOpen(false);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Save Yard Logo</span>
              </button>

              {brandingLogoInput && (
                <button
                  type="button"
                  onClick={() => setBrandingLogoInput('')}
                  className="px-3 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/30 cursor-pointer"
                  title="Remove logo"
                >
                  Clear
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsBrandingModalOpen(false)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP INVENTORY EXPORT MODAL */}
      {isWhatsappExportOpen && activeSeller && (
        <WhatsappInventoryExportModal
          seller={activeSeller}
          inventory={sellerListings}
          preSelectedIds={whatsappExportPreSelectedIds}
          onClose={() => setIsWhatsappExportOpen(false)}
          onOpenBroadcastTool={() => {
            setIsWhatsappExportOpen(false);
            setActiveTab('broadcast');
          }}
        />
      )}

    </div>
  );
};

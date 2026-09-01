import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit,
  Save,
  ShieldAlert,
  Key,
  Users,
  DollarSign,
  Info,
  Send,
  Sparkles,
  Check,
  Search,
  Filter,
  CheckSquare,
  Square,
  HardHat,
  Truck,
  Car,
  Layers,
  AlertOctagon,
  Eye,
  MapPin,
  MessageSquare,
  Clock,
  Phone,
  ExternalLink,
  RotateCcw,
  Calendar,
  Zap,
  Tag,
  Percent,
  BadgePercent,
  Sliders,
  Plus,
  Flame,
  ArrowRight,
  Gift,
  TrendingUp,
  BarChart3,
  Receipt,
  FileText,
  ShieldCheck,
  Download,
  Printer,
  Mail,
  QrCode,
  Copy
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SubscriptionRevenueChart } from './SubscriptionRevenueChart';
import { TaxInvoiceModal } from './TaxInvoiceModal';
import { downloadInvoicePdf, generatePaymentConfirmationEmailContent } from '../lib/pdfInvoiceGenerator';
import {
  OwnerBankingDetails,
  OwnerTaxInvoiceSettings,
  Seller,
  SubscriptionStatus,
  SubscriptionPlanId,
  SubscriptionPlan,
  SubscriptionPromoCampaign,
  SubscriptionPaymentRecord,
  InventoryItem,
  CategoryType
} from '../types';
import { SUBSCRIPTION_PLANS } from '../data/initialData';
import { CATEGORY_VISUALS } from '../data/categoryImages';
import { isLocalAppEnvironment } from '../lib/env';
import { generateWhatsappInquiryUrl, formatOutOfOfficeNotice, buildWhatsappInquiryText } from '../lib/whatsapp';

interface OwnerAdminModalProps {
  onClose: () => void;
}

export const OwnerAdminModal: React.FC<OwnerAdminModalProps> = ({ onClose }) => {
  const {
    ownerSettings,
    subscriptionPlans,
    promotionalCampaign,
    updateSubscriptionPlans,
    updateSingleSubscriptionPlan,
    updatePromotionalCampaign,
    getPlanEffectivePricing,
    isOwnerAdminLoggedIn,
    loginOwner,
    logoutOwner,
    updateOwnerPassword,
    updateOwnerBankingDetails,
    updateOwnerWhatsappSettings,
    updateOwnerTaxInvoiceSettings,
    updateSellerOutOfOffice,
    sellers,
    updateSellerStatus,
    updateSeller,
    deleteSeller,
    inventory,
    deleteInventoryItem,
    deleteMultipleInventoryItems
  } = useApp();

  // Login form state
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active Admin Tab
  const [adminTab, setAdminTab] = useState<'sellers' | 'pricing' | 'tax_invoice' | 'analytics' | 'outofoffice' | 'inventory' | 'unpaid' | 'banking' | 'security'>('sellers');

  // Action status message
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Automated Tax / VAT Invoicing Settings State
  const [taxInvoiceForm, setTaxInvoiceForm] = useState<OwnerTaxInvoiceSettings>(() => {
    if (ownerSettings.taxInvoiceSettings) {
      return { ...ownerSettings.taxInvoiceSettings };
    }
    return {
      enabled: true,
      autoAttachToConfirmationEmail: true,
      autoDispatchOnApproval: true,
      vatRegistrationNumber: '4980123984',
      companyTaxNumber: '9840219481',
      legalEntityName: 'Part-Smart ZA Proprietary Limited',
      tradingName: 'Part-Smart ZA Heavy Commercial & Auto Spares Network',
      cipcRegistrationNumber: '2021/849201/07',
      registeredAddress: '14 Auto Spares Crescent, Apex Industrial, Benoni, 1501, Gauteng, South Africa',
      billingContactEmail: 'accounts@partsmart.co.za',
      billingContactPhone: '+27 11 892 4000',
      vatRatePercent: 15,
      invoiceNumberPrefix: 'INV-PSZA-',
      nextInvoiceSequence: 1049,
      complianceNoticeText: 'Tax Invoice issued in accordance with Section 20(4) of the Value-Added Tax Act No. 89 of 1991 of the Republic of South Africa.',
      emailSubjectTemplate: 'Tax Invoice & Payment Confirmation: Part-Smart ZA Subscription [InvoiceNumber]',
      emailBodyTemplate: 'Dear [SellerContact],\n\nThank you for renewing your heavy equipment & auto parts listing subscription for [YardName].\n\nYour payment of [TotalAmount] for the [PlanName] billing cycle has been verified and applied.\n\nPlease find your SARS-compliant electronic tax invoice ([InvoiceNumber]) attached to this email for your company accounting and VAT records.\n\nWarm regards,\nPart-Smart ZA Billing & Accounts Team'
    };
  });

  const [taxSaveSuccess, setTaxSaveSuccess] = useState(false);
  const [taxPreviewSellerId, setTaxPreviewSellerId] = useState<string>(sellers[0]?.id || '');
  const [activeTaxModalPayment, setActiveTaxModalPayment] = useState<SubscriptionPaymentRecord | null>(null);
  const [activeTaxModalSeller, setActiveTaxModalSeller] = useState<Seller | null>(null);
  const [isDownloadingTaxPdf, setIsDownloadingTaxPdf] = useState(false);

  // Sync tax invoice form when owner settings change
  useEffect(() => {
    if (ownerSettings.taxInvoiceSettings) {
      setTaxInvoiceForm({ ...ownerSettings.taxInvoiceSettings });
    }
  }, [ownerSettings.taxInvoiceSettings]);

  // Pricing & Promotional Campaigns Management State
  const [plansForm, setPlansForm] = useState<SubscriptionPlan[]>(() => {
    if (ownerSettings.subscriptionPlans && ownerSettings.subscriptionPlans.length > 0) {
      return JSON.parse(JSON.stringify(ownerSettings.subscriptionPlans));
    }
    return JSON.parse(JSON.stringify(SUBSCRIPTION_PLANS));
  });

  const [campaignForm, setCampaignForm] = useState<SubscriptionPromoCampaign>(() => {
    if (ownerSettings.promotionalCampaign) {
      return { ...ownerSettings.promotionalCampaign };
    }
    return {
      enabled: false,
      campaignTitle: 'Yard Booster Launch Special',
      headline: 'Special Scrapyard Promotion: Up to 50% OFF Subscription Rates',
      badgeText: '🔥 PROMO DISCOUNT',
      announcementText: 'Discounted monthly advertising packages for auto scrap yards, commercial truck breakers & plant dismantlers across South Africa.',
      discountPercentage: 30,
      expiresAt: ''
    };
  });

  const [selectedPlanTab, setSelectedPlanTab] = useState<SubscriptionPlanId>('pro');
  const [pricingSaveSuccess, setPricingSaveSuccess] = useState(false);
  const [newFeatureText, setNewFeatureText] = useState('');

  // Keep pricing form synced if owner settings reload
  useEffect(() => {
    if (ownerSettings.subscriptionPlans && ownerSettings.subscriptionPlans.length > 0) {
      setPlansForm(JSON.parse(JSON.stringify(ownerSettings.subscriptionPlans)));
    }
    if (ownerSettings.promotionalCampaign) {
      setCampaignForm({ ...ownerSettings.promotionalCampaign });
    }
  }, [ownerSettings.subscriptionPlans, ownerSettings.promotionalCampaign]);

  // Banking Details Form state
  const [bankForm, setBankForm] = useState<OwnerBankingDetails>({
    ...ownerSettings.bankingDetails
  });
  const [bankSaveSuccess, setBankSaveSuccess] = useState(false);

  // Security Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [passSaveSuccess, setPassSaveSuccess] = useState(false);

  // Out-of-Office & WhatsApp Auto-Reply Management State
  const [selectedOofSellerId, setSelectedOofSellerId] = useState<string>(sellers[0]?.id || '');
  const [oofSearch, setOofSearch] = useState('');
  const [oofStatusFilter, setOofStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [oofSaveSuccess, setOofSaveSuccess] = useState(false);
  const [globalOofSaveSuccess, setGlobalOofSaveSuccess] = useState(false);

  // Global platform defaults state
  const [globalDefaultTemplate, setGlobalDefaultTemplate] = useState(
    ownerSettings.whatsappAutoReply?.defaultOutOfOfficeTemplate ||
    'Our scrap yard sales desk is currently closed or out of office. All spare part enquiries will be prioritised once trading opens. For urgent commercial breakdown emergencies, please leave your vehicle VIN and engine code.'
  );
  const [globalEmergencyPhone, setGlobalEmergencyPhone] = useState(
    ownerSettings.whatsappAutoReply?.platformEmergencyPhone || '+27 82 459 1102'
  );

  // Selected seller object
  const currentOofSeller = useMemo(() => {
    return sellers.find(s => s.id === selectedOofSellerId) || sellers[0] || null;
  }, [sellers, selectedOofSellerId]);

  // Form states for the selected yard's Out-of-Office settings
  const [yardOofEnabled, setYardOofEnabled] = useState<boolean>(currentOofSeller?.outOfOfficeEnabled || false);
  const [yardOofMessage, setYardOofMessage] = useState<string>(currentOofSeller?.outOfOfficeMessage || '');
  const [yardOofReturnDate, setYardOofReturnDate] = useState<string>(currentOofSeller?.outOfOfficeReturnDate || '');

  // Keep yard form synced when selected seller changes
  React.useEffect(() => {
    if (currentOofSeller) {
      setYardOofEnabled(!!currentOofSeller.outOfOfficeEnabled);
      setYardOofMessage(currentOofSeller.outOfOfficeMessage || '');
      setYardOofReturnDate(currentOofSeller.outOfOfficeReturnDate || '');
    }
  }, [currentOofSeller?.id]);

  // Out-of-office active count
  const activeOofCount = useMemo(() => {
    return sellers.filter(s => s.outOfOfficeEnabled).length;
  }, [sellers]);

  // Sellers Filter State
  const [sellerSearch, setSellerSearch] = useState('');
  const [sellerStatusFilter, setSellerStatusFilter] = useState<string>('all');
  const [sellerProvinceFilter, setSellerProvinceFilter] = useState<string>('all');

  // Inventory Moderation Filter State
  const [invSearch, setInvSearch] = useState('');
  const [invCategoryFilter, setInvCategoryFilter] = useState<string>('all');
  const [invSellerFilter, setInvSellerFilter] = useState<string>('all');
  const [invConditionFilter, setInvConditionFilter] = useState<string>('all');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // In-App Deletion Confirmation States (bypasses browser window.confirm blocking)
  const [sellerPendingDelete, setSellerPendingDelete] = useState<Seller | null>(null);
  const [itemPendingDelete, setItemPendingDelete] = useState<InventoryItem | null>(null);
  const [batchDeletePending, setBatchDeletePending] = useState<boolean>(false);

  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setActionNotice({ type, message });
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = loginOwner(passwordInput.trim());
    if (!success) {
      setLoginError('Incorrect password. Default owner password is "admin123".');
    } else {
      showNotice('Authenticated as Part-Smart-ZA Platform Owner.');
    }
  };

  // Filtered sellers for Out-of-Office console
  const filteredOofSellers = useMemo(() => {
    return sellers.filter(s => {
      const q = oofSearch.toLowerCase();
      const matchesSearch =
        !q ||
        s.companyName.toLowerCase().includes(q) ||
        s.contactName.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.province.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (oofStatusFilter === 'active') return !!s.outOfOfficeEnabled;
      if (oofStatusFilter === 'inactive') return !s.outOfOfficeEnabled;
      return true;
    });
  }, [sellers, oofSearch, oofStatusFilter]);

  // Handle Save Yard Out-of-Office
  const handleSaveYardOof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOofSeller) return;
    updateSellerOutOfOffice(
      currentOofSeller.id,
      yardOofEnabled,
      yardOofMessage.trim(),
      yardOofReturnDate.trim()
    );
    setOofSaveSuccess(true);
    showNotice(`WhatsApp Auto-Reply settings saved for ${currentOofSeller.companyName}.`);
    setTimeout(() => setOofSaveSuccess(false), 3000);
  };

  // Handle Save Global Platform Defaults
  const handleSaveGlobalOofDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    updateOwnerWhatsappSettings({
      enabled: true,
      platformEmergencyPhone: globalEmergencyPhone.trim(),
      defaultOutOfOfficeTemplate: globalDefaultTemplate.trim()
    });
    setGlobalOofSaveSuccess(true);
    showNotice('Global WhatsApp default template & emergency standby phone saved.');
    setTimeout(() => setGlobalOofSaveSuccess(false), 3000);
  };

  // Apply a quick preset template to the active yard form
  const applyPresetTemplate = (presetMsg: string, presetDate?: string) => {
    setYardOofMessage(presetMsg);
    if (presetDate) setYardOofReturnDate(presetDate);
    if (!yardOofEnabled) setYardOofEnabled(true);
    showNotice('Preset template loaded into editor. Click "Save Yard Settings" to apply.');
  };

  // Sample listing for live simulator
  const sampleYardItem = useMemo(() => {
    if (!currentOofSeller) return null;
    return inventory.find(i => i.sellerId === currentOofSeller.id) || inventory[0] || null;
  }, [inventory, currentOofSeller]);

  // Preview Seller with live draft settings
  const simulatedSellerPreview: Seller | null = useMemo(() => {
    if (!currentOofSeller) return null;
    return {
      ...currentOofSeller,
      outOfOfficeEnabled: yardOofEnabled,
      outOfOfficeMessage: yardOofMessage,
      outOfOfficeReturnDate: yardOofReturnDate
    };
  }, [currentOofSeller, yardOofEnabled, yardOofMessage, yardOofReturnDate]);

  // Computed simulated WhatsApp inquiry text
  const simulatedInquiryText = useMemo(() => {
    if (!sampleYardItem || !simulatedSellerPreview) return '';
    return buildWhatsappInquiryText(sampleYardItem, simulatedSellerPreview);
  }, [sampleYardItem, simulatedSellerPreview]);

  // Computed simulated WhatsApp link
  const simulatedWhatsappUrl = useMemo(() => {
    if (!sampleYardItem || !simulatedSellerPreview) return '#';
    return generateWhatsappInquiryUrl(sampleYardItem, simulatedSellerPreview);
  }, [sampleYardItem, simulatedSellerPreview]);

  // Save Banking Details
  const handleSaveBanking = (e: React.FormEvent) => {
    e.preventDefault();
    updateOwnerBankingDetails(bankForm);
    setBankSaveSuccess(true);
    showNotice('Owner banking details updated and synchronized with seller portal.');
    setTimeout(() => setBankSaveSuccess(false), 3000);
  };

  // Save New Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    updateOwnerPassword(newPassword.trim());
    setPassSaveSuccess(true);
    setNewPassword('');
    showNotice('Owner admin password updated successfully.');
    setTimeout(() => setPassSaveSuccess(false), 3000);
  };

  // Owner approve / activate payment
  const handleApproveSeller = (sellerId: string) => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    updateSellerStatus(sellerId, 'active', nextMonth.toISOString());
    showNotice('Seller subscription approved and marked ACTIVE for 30 days.');
  };

  // Owner mark seller unpaid
  const handleMarkUnpaid = (sellerId: string) => {
    updateSellerStatus(sellerId, 'unpaid');
    showNotice('Seller marked as UNPAID.');
  };

  // OWNER REQUEST SELLER DELETION
  const handleDeleteSeller = (seller: Seller) => {
    setSellerPendingDelete(seller);
  };

  // EXECUTE CONFIRMED SELLER DELETION
  const executeConfirmDeleteSeller = () => {
    if (!sellerPendingDelete) return;
    const seller = sellerPendingDelete;
    const sellerItemCount = inventory.filter((item) => item.sellerId === seller.id).length;
    
    deleteSeller(seller.id, true);
    setSellerPendingDelete(null);
    showNotice(`Seller "${seller.companyName}" and ${sellerItemCount} listing(s) have been deleted.`);
  };

  // OWNER REQUEST SINGLE INVENTORY ITEM DELETION
  const handleDeleteSingleItem = (item: InventoryItem) => {
    setItemPendingDelete(item);
  };

  // EXECUTE CONFIRMED SINGLE INVENTORY ITEM DELETION
  const executeConfirmDeleteSingleItem = () => {
    if (!itemPendingDelete) return;
    const item = itemPendingDelete;
    deleteInventoryItem(item.id);
    setSelectedItemIds((prev) => prev.filter((id) => id !== item.id));
    setItemPendingDelete(null);
    showNotice(`Listing "${item.title}" was deleted.`);
  };

  // OWNER REQUEST BATCH DELETE SELECTED ITEMS
  const handleBatchDeleteItems = () => {
    if (selectedItemIds.length === 0) return;
    setBatchDeletePending(true);
  };

  // EXECUTE CONFIRMED BATCH DELETE
  const executeConfirmBatchDelete = () => {
    if (selectedItemIds.length === 0) {
      setBatchDeletePending(false);
      return;
    }
    const count = selectedItemIds.length;
    deleteMultipleInventoryItems(selectedItemIds);
    setSelectedItemIds([]);
    setBatchDeletePending(false);
    showNotice(`${count} inventory listing(s) successfully removed from the app.`);
  };

  // Toggle Item Selection
  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  // Filter and sort sellers
  const filteredSellers = useMemo(() => {
    return sellers
      .filter((s) => {
        const matchesSearch =
          s.companyName.toLowerCase().includes(sellerSearch.toLowerCase()) ||
          s.email.toLowerCase().includes(sellerSearch.toLowerCase()) ||
          s.contactName.toLowerCase().includes(sellerSearch.toLowerCase()) ||
          s.city.toLowerCase().includes(sellerSearch.toLowerCase()) ||
          s.province.toLowerCase().includes(sellerSearch.toLowerCase());

        const matchesStatus = sellerStatusFilter === 'all' || s.subscriptionStatus === sellerStatusFilter;
        const matchesProvince = sellerProvinceFilter === 'all' || s.province.toLowerCase() === sellerProvinceFilter.toLowerCase();

        return matchesSearch && matchesStatus && matchesProvince;
      })
      .sort((a, b) => {
        if (a.province !== b.province) return a.province.localeCompare(b.province);
        if (a.city !== b.city) return a.city.localeCompare(b.city);
        return a.companyName.localeCompare(b.companyName);
      });
  }, [sellers, sellerSearch, sellerStatusFilter, sellerProvinceFilter]);

  // Filter inventory items for moderation
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const q = invSearch.toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.make.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        (item.partNumber && item.partNumber.toLowerCase().includes(q)) ||
        (item.oemNumber && item.oemNumber.toLowerCase().includes(q)) ||
        item.sellerName.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        item.province.toLowerCase().includes(q);

      const matchesCat = invCategoryFilter === 'all' || item.category === invCategoryFilter;
      const matchesSeller = invSellerFilter === 'all' || item.sellerId === invSellerFilter;
      const matchesCond = invConditionFilter === 'all' || item.condition === invConditionFilter;

      return matchesSearch && matchesCat && matchesSeller && matchesCond;
    });
  }, [inventory, invSearch, invCategoryFilter, invSellerFilter, invConditionFilter]);

  // Select all filtered items toggle
  const areAllFilteredSelected =
    filteredInventory.length > 0 &&
    filteredInventory.every((item) => selectedItemIds.includes(item.id));

  const handleToggleSelectAllFiltered = () => {
    if (areAllFilteredSelected) {
      const filteredIdSet = new Set(filteredInventory.map((i) => i.id));
      setSelectedItemIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const newIds = new Set([...selectedItemIds, ...filteredInventory.map((i) => i.id)]);
      setSelectedItemIds(Array.from(newIds));
    }
  };

  // Calculate unpaid sellers & items
  const unpaidSellers = sellers.filter(
    (s) => s.subscriptionStatus === 'unpaid' || s.subscriptionStatus === 'pending_verification'
  );
  const unpaidSellerIds = unpaidSellers.map((s) => s.id);
  const unpaidItems = inventory.filter((item) => unpaidSellerIds.includes(item.sellerId));

  // Revenue calculation
  const activeSellersList = sellers.filter((s) => s.subscriptionStatus === 'active');
  const monthlyRevenue = activeSellersList.reduce((acc, s) => {
    const pricing = getPlanEffectivePricing(s.planId);
    return acc + (pricing ? pricing.effectivePrice : 0);
  }, 0);

  // Pricing & Promotional Discount Handlers
  const handleUpdatePlanField = <K extends keyof SubscriptionPlan>(
    planId: SubscriptionPlanId,
    field: K,
    value: SubscriptionPlan[K]
  ) => {
    setPlansForm((prev) =>
      prev.map((p) => {
        if (p.id === planId) {
          const updated = { ...p, [field]: value };
          if (field === 'discountPercentage' && typeof value === 'number') {
            const base = updated.priceZar || 450;
            if (value > 0) {
              updated.promoPriceZar = Math.round(base * (1 - value / 100));
            } else {
              updated.promoPriceZar = undefined;
            }
          }
          if (field === 'priceZar' && typeof value === 'number') {
            if (updated.discountPercentage && updated.discountPercentage > 0) {
              updated.promoPriceZar = Math.round(value * (1 - updated.discountPercentage / 100));
            }
          }
          return updated;
        }
        return p;
      })
    );
  };

  const handleTogglePlanDiscount = (planId: SubscriptionPlanId) => {
    setPlansForm((prev) =>
      prev.map((p) => {
        if (p.id === planId) {
          const nextActive = !p.isDiscountActive;
          const defaultPct = (p.discountPercentage && p.discountPercentage > 0) ? p.discountPercentage : 30;
          return {
            ...p,
            isDiscountActive: nextActive,
            discountPercentage: nextActive ? defaultPct : (p.discountPercentage || 0),
            promotionalBadge: nextActive ? (p.promotionalBadge || `🔥 ${defaultPct}% OFF PROMO`) : undefined,
            promoPriceZar: nextActive ? Math.round(p.priceZar * (1 - defaultPct / 100)) : undefined
          };
        }
        return p;
      })
    );
  };

  const handleAddFeatureToPlan = (planId: SubscriptionPlanId) => {
    if (!newFeatureText.trim()) return;
    setPlansForm((prev) =>
      prev.map((p) => {
        if (p.id === planId) {
          return {
            ...p,
            features: [...p.features, newFeatureText.trim()]
          };
        }
        return p;
      })
    );
    setNewFeatureText('');
  };

  const handleRemoveFeatureFromPlan = (planId: SubscriptionPlanId, featureIndex: number) => {
    setPlansForm((prev) =>
      prev.map((p) => {
        if (p.id === planId) {
          return {
            ...p,
            features: p.features.filter((_, idx) => idx !== featureIndex)
          };
        }
        return p;
      })
    );
  };

  // Quick Promotional Presets
  const applyGlobalPreset50Percent = () => {
    setPlansForm((prev) =>
      prev.map((p) => ({
        ...p,
        isDiscountActive: true,
        discountPercentage: 50,
        promoPriceZar: Math.round(p.priceZar * 0.5),
        promotionalBadge: '🔥 50% LAUNCH DEAL',
        promoNotice: 'Special 50% promotional rate for South African scrap yards & dismantlers.'
      }))
    );
    setCampaignForm({
      enabled: true,
      campaignTitle: 'Spring Yard Booster 50% OFF Promotion',
      headline: '🔥 50% OFF All Monthly Yard Subscription Plans!',
      badgeText: 'LIMITED LAUNCH PROMO',
      announcementText: 'Claim 50% off your monthly advertising package. List your heavy machinery, commercial truck spares, and bakkie inventory for half price.',
      discountPercentage: 50,
      expiresAt: 'Limited Time Offer'
    });
  };

  const applyGlobalPreset30Percent = () => {
    setPlansForm((prev) =>
      prev.map((p) => ({
        ...p,
        isDiscountActive: p.id !== 'basic',
        discountPercentage: 30,
        promoPriceZar: Math.round(p.priceZar * 0.7),
        promotionalBadge: p.id !== 'basic' ? '🔥 30% OFF PROMO' : p.promotionalBadge,
        promoNotice: p.id !== 'basic' ? 'Special 30% discount on Pro & Enterprise tiers.' : undefined
      }))
    );
    setCampaignForm({
      enabled: true,
      campaignTitle: 'Pro & Enterprise Yard Upgrade Boost',
      headline: 'Special Scrapyard Booster: 30% OFF Pro & Enterprise Tiers',
      badgeText: 'YARD BOOSTER',
      announcementText: 'Boost your scrap yard sales with 30% off high-volume listing packages and nationwide search priority.',
      discountPercentage: 30,
      expiresAt: 'Valid this month'
    });
  };

  const applyFlatRateLaunchSpecial = () => {
    setPlansForm((prev) =>
      prev.map((p) => {
        if (p.id === 'basic') {
          return {
            ...p,
            isDiscountActive: true,
            discountPercentage: 56,
            promoPriceZar: 199,
            promotionalBadge: '⚡ R199 LAUNCH SPECIAL',
            promoNotice: 'Special introductory flat rate: R199/mo for 10 listings.'
          };
        }
        if (p.id === 'pro') {
          return {
            ...p,
            isDiscountActive: true,
            discountPercentage: 53,
            promoPriceZar: 399,
            promotionalBadge: '⚡ R399 FLASHSALE',
            promoNotice: 'Special introductory rate: R399/mo for 50 listings + featured badge.'
          };
        }
        return {
          ...p,
          isDiscountActive: true,
          discountPercentage: 46,
          promoPriceZar: 999,
          promotionalBadge: '⚡ R999 VIP PROMO',
          promoNotice: 'Special unlimited listings rate: R999/mo for fleet yards.'
        };
      })
    );
    setCampaignForm({
      enabled: true,
      campaignTitle: 'PartSmartZA Flat-Rate Launch Special',
      headline: '⚡ First Month Flat-Rate Yard Launch Special (From R199/mo)',
      badgeText: 'FLAT-RATE PROMO',
      announcementText: 'Special introductory rates starting at just R199 per month for scrap yards and breaker yards.',
      discountPercentage: 50,
      expiresAt: 'First 50 Yards Only'
    });
  };

  const resetAllDiscountsToStandard = () => {
    setPlansForm((prev) =>
      prev.map((p) => ({
        ...p,
        isDiscountActive: false,
        discountPercentage: 0,
        promoPriceZar: undefined,
        promotionalBadge: p.id === 'pro' ? 'Most Popular' : p.id === 'enterprise' ? 'Maximum Reach' : 'Essential',
        promoNotice: undefined
      }))
    );
    setCampaignForm((prev) => ({
      ...prev,
      enabled: false
    }));
  };

  const handleSaveAllPricingAndCampaign = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateSubscriptionPlans(plansForm);
    updatePromotionalCampaign(campaignForm);
    setPricingSaveSuccess(true);
    setActionNotice({
      type: 'success',
      message: 'Subscription prices, promotional discounts, and campaign banners have been updated & published live!'
    });
    setTimeout(() => {
      setPricingSaveSuccess(false);
    }, 4000);
  };

  // Tax Invoice Handlers
  const handleSaveTaxInvoiceSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateOwnerTaxInvoiceSettings(taxInvoiceForm);
    setTaxSaveSuccess(true);
    setActionNotice({
      type: 'success',
      message: 'Automated Tax / VAT Invoice settings, SARS profile & email attachment rules saved successfully!'
    });
    setTimeout(() => {
      setTaxSaveSuccess(false);
    }, 4000);
  };

  const applyVatPreset15Percent = () => {
    setTaxInvoiceForm((prev) => ({
      ...prev,
      enabled: true,
      vatRatePercent: 15,
      complianceNoticeText: 'Tax Invoice issued in accordance with Section 20(4) of the Value-Added Tax Act No. 89 of 1991 of the Republic of South Africa.'
    }));
  };

  const applyZeroRatedPreset = () => {
    setTaxInvoiceForm((prev) => ({
      ...prev,
      enabled: true,
      vatRatePercent: 0,
      complianceNoticeText: 'Zero-rated supply in terms of Section 11 of the Value-Added Tax Act No. 89 of 1991.'
    }));
  };

  const applyExemptPreset = () => {
    setTaxInvoiceForm((prev) => ({
      ...prev,
      enabled: true,
      vatRatePercent: 0,
      complianceNoticeText: 'Exempt supply / non-VAT vendor under Section 12 of the Value-Added Tax Act No. 89 of 1991.'
    }));
  };

  const openTaxInvoiceModalForSeller = (seller: Seller) => {
    const pricing = getPlanEffectivePricing(seller.planId);
    const amount = pricing.effectivePrice;
    const vatRate = taxInvoiceForm.vatRatePercent || 15;
    const vatZar = Math.round((amount * vatRate / (100 + vatRate)) * 100) / 100;
    const prefix = taxInvoiceForm.invoiceNumberPrefix || 'INV-PSZA-';
    
    // Check if seller already has payments in localStorage
    let record: SubscriptionPaymentRecord | null = null;
    try {
      const raw = localStorage.getItem(`part_smart_subscription_payments_${seller.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          record = parsed[0];
        }
      }
    } catch {}

    if (!record) {
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      record = {
        id: `pay-${seller.id}-${Date.now()}`,
        sellerId: seller.id,
        sellerName: seller.companyName,
        invoiceNumber: `${prefix}${taxInvoiceForm.nextInvoiceSequence || 1049}`,
        paymentDate: seller.paymentProofSubmittedAt || now.toISOString(),
        billingCycleStart: now.toISOString(),
        billingCycleEnd: seller.subscriptionDueDate || nextMonth.toISOString(),
        planId: seller.planId,
        planName: pricing.name || 'Equipment Plan',
        amountZar: amount,
        vatZar: vatZar,
        paymentMethod: 'Instant EFT',
        reference: seller.lastPaymentRef || `EFT-${Math.floor(100000 + Math.random() * 900000)}-${seller.id.slice(0, 4).toUpperCase()}`,
        status: seller.subscriptionStatus === 'active' ? 'verified' : 'pending',
        taxInvoiceAttached: taxInvoiceForm.autoAttachToConfirmationEmail !== false,
        emailDispatchedAt: now.toISOString(),
        emailRecipient: seller.email,
        vatRatePercent: vatRate,
        supplierVatNumber: taxInvoiceForm.vatRegistrationNumber
      };
    }

    setActiveTaxModalSeller(seller);
    setActiveTaxModalPayment(record);
  };

  const handleDownloadSampleTaxPdf = async (seller: Seller) => {
    try {
      setIsDownloadingTaxPdf(true);
      const pricing = getPlanEffectivePricing(seller.planId);
      const amount = pricing.effectivePrice;
      const vatRate = taxInvoiceForm.vatRatePercent || 15;
      const vatZar = Math.round((amount * vatRate / (100 + vatRate)) * 100) / 100;
      const prefix = taxInvoiceForm.invoiceNumberPrefix || 'INV-PSZA-';
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const samplePayment: SubscriptionPaymentRecord = {
        id: `sample-${seller.id}`,
        sellerId: seller.id,
        sellerName: seller.companyName,
        invoiceNumber: `${prefix}${taxInvoiceForm.nextInvoiceSequence || 1049}`,
        paymentDate: now.toISOString(),
        billingCycleStart: now.toISOString(),
        billingCycleEnd: nextMonth.toISOString(),
        planId: seller.planId,
        planName: pricing.name || 'Pro Equipment Plan',
        amountZar: amount,
        vatZar: vatZar,
        paymentMethod: 'Instant EFT',
        reference: seller.lastPaymentRef || `EFT-892100-${seller.id.slice(0, 4).toUpperCase()}`,
        status: 'verified',
        taxInvoiceAttached: true,
        emailDispatchedAt: now.toISOString(),
        emailRecipient: seller.email,
        vatRatePercent: vatRate,
        supplierVatNumber: taxInvoiceForm.vatRegistrationNumber
      };

      await downloadInvoicePdf({
        seller,
        payment: samplePayment,
        ownerSettings: {
          ...ownerSettings,
          taxInvoiceSettings: taxInvoiceForm
        }
      });

      setActionNotice({
        type: 'success',
        message: `Sample Tax Invoice PDF (${samplePayment.invoiceNumber}) downloaded successfully!`
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloadingTaxPdf(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[92vh] overflow-y-auto shadow-2xl text-white my-auto flex flex-col">
        
        {/* Top Header */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold">
                  Part-Smart-ZA App Owner Console
                </h2>
                {isLocalAppEnvironment() ? (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    Local Dev Mode
                  </span>
                ) : (
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    Public Mode
                  </span>
                )}
                {isOwnerAdminLoggedIn && (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    Authenticated
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Delete irrelevant sellers & inventory, manage banking details, and verify monthly subscriptions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOwnerAdminLoggedIn && (
              <button
                onClick={logoutOwner}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Lock
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Notification Ribbon */}
        {actionNotice && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
              actionNotice.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionNotice.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{actionNotice.message}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* IF NOT LOGGED IN: SHOW PASSWORD LOCK SCREEN */}
        {!isOwnerAdminLoggedIn ? (
          <div className="p-8 max-w-md mx-auto w-full my-8 space-y-6 bg-slate-950 rounded-3xl border border-slate-800 text-center">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">Owner Security Authentication</h3>
              <p className="text-xs text-slate-400">
                Enter your admin password to access the seller deletion, inventory moderation tools, and owner banking settings.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
              {loginError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Owner Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <p className="text-[10px] text-amber-400/80 pt-1">
                  💡 Default App Owner Password: <strong className="font-mono text-amber-400">admin123</strong>
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Unlock Owner Console
              </button>
            </form>
          </div>
        ) : (
          /* UNLOCKED OWNER ADMIN PANELS */
          <div className="flex-1 flex flex-col">
            
            {/* Owner Metrics Ribbon */}
            <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setAdminTab('analytics')}
                className="bg-slate-900 hover:bg-slate-850 p-3 rounded-xl border border-slate-800 hover:border-emerald-500/50 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Est. Monthly Revenue</span>
                  <span className="text-[10px] text-emerald-400 font-bold group-hover:underline flex items-center gap-0.5">
                    Trends <TrendingUp className="w-3 h-3" />
                  </span>
                </div>
                <div className="text-base font-black text-emerald-400 mt-0.5">{formatCurrency(monthlyRevenue)}</div>
              </button>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Registered Sellers</span>
                <div className="text-base font-black text-white mt-0.5">{sellers.length} Total Yards</div>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Active Inventory Items</span>
                <div className="text-base font-black text-amber-400 mt-0.5">{inventory.length} Listed Parts</div>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Unpaid / Expired</span>
                <div className="text-base font-black text-rose-400 mt-0.5">
                  {unpaidSellers.length} Yards ({unpaidItems.length} items)
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-slate-950/60 px-6 py-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setAdminTab('sellers')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  adminTab === 'sellers'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Manage & Delete Sellers ({sellers.length})
              </button>

              <button
                id="btn-admin-tab-analytics"
                onClick={() => setAdminTab('analytics')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  adminTab === 'analytics'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Revenue Trends & Analytics</span>
              </button>

              <button
                onClick={() => setAdminTab('pricing')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  adminTab === 'pricing'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <BadgePercent className="w-3.5 h-3.5 text-amber-400" />
                <span>Subscription Pricing & Promos</span>
                {plansForm.some(p => p.isDiscountActive) && (
                  <span className="bg-orange-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full ml-1 animate-pulse">
                    PROMO ACTIVE
                  </span>
                )}
              </button>

              <button
                id="btn-admin-tab-tax-invoices"
                onClick={() => setAdminTab('tax_invoice')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  adminTab === 'tax_invoice'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                <span>Automated Tax / VAT Invoicing</span>
                {taxInvoiceForm.enabled && (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-1.5 py-0.2 rounded-full ml-1">
                    {taxInvoiceForm.vatRatePercent}% VAT
                  </span>
                )}
              </button>

              <button
                onClick={() => setAdminTab('outofoffice')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  adminTab === 'outofoffice'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Auto-Reply & Out-of-Office</span>
                {activeOofCount > 0 && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full ml-1">
                    {activeOofCount} Active
                  </span>
                )}
              </button>

              <button
                onClick={() => setAdminTab('inventory')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  adminTab === 'inventory'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Inventory Moderation & Deletion ({inventory.length})
              </button>

              <button
                onClick={() => setAdminTab('unpaid')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  adminTab === 'unpaid'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Unpaid Yards Review ({unpaidSellers.length})
              </button>

              <button
                onClick={() => setAdminTab('banking')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  adminTab === 'banking'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Owner Banking Details
              </button>

              <button
                onClick={() => setAdminTab('security')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  adminTab === 'security'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Key className="w-3.5 h-3.5" /> Password & Security
              </button>
            </div>

            {/* TAB BODY */}
            <div className="p-6 flex-1 space-y-6">

              {/* ========================================================================= */}
              {/* TAB 1: MANAGE & DELETE SELLERS */}
              {/* ========================================================================= */}
              {adminTab === 'sellers' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={sellerSearch}
                          onChange={(e) => setSellerSearch(e.target.value)}
                          placeholder="Search sellers by yard name, city, email..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <select
                        value={sellerStatusFilter}
                        onChange={(e) => setSellerStatusFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active Subscriptions</option>
                        <option value="unpaid">Unpaid / Expired</option>
                        <option value="pending_verification">Pending EFT Review</option>
                      </select>
                    </div>

                    <div className="text-xs text-slate-400">
                      Showing <strong>{filteredSellers.length}</strong> of {sellers.length} registered sellers
                    </div>
                  </div>

                  {/* Sellers List */}
                  <div className="space-y-3">
                    {filteredSellers.length > 0 ? (
                      filteredSellers.map((s) => {
                        const sellerListings = inventory.filter((item) => item.sellerId === s.id);
                        return (
                          <div
                            key={s.id}
                            className={`p-4 rounded-2xl border transition-all ${
                              s.subscriptionStatus === 'unpaid'
                                ? 'bg-rose-950/15 border-rose-500/30'
                                : s.subscriptionStatus === 'pending_verification'
                                ? 'bg-amber-950/15 border-amber-500/30'
                                : 'bg-slate-950 border-slate-800'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              
                              <div className="space-y-1.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-sm text-white">{s.companyName}</h4>
                                  
                                  {s.subscriptionStatus === 'active' ? (
                                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                      ACTIVE
                                    </span>
                                  ) : s.subscriptionStatus === 'pending_verification' ? (
                                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                      PENDING EFT PROOF
                                    </span>
                                  ) : (
                                    <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                      UNPAID
                                    </span>
                                  )}

                                  <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
                                    {sellerListings.length} Active Listings
                                  </span>

                                  <span className="text-[10px] text-amber-400 font-semibold">
                                    Plan: {s.planId}
                                  </span>

                                  {s.outOfOfficeEnabled ? (
                                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                      🏖️ Out-of-Office Active
                                    </span>
                                  ) : (
                                    <span className="bg-slate-800/80 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-medium">
                                      🟢 Online
                                    </span>
                                  )}
                                </div>

                                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                                  <span>Contact: <strong className="text-slate-200">{s.contactName}</strong> ({s.phone})</span>
                                  <span>•</span>
                                  <span>Email: <strong className="text-slate-200">{s.email}</strong></span>
                                  <span>•</span>
                                  <span>Location: <strong className="text-slate-200">{s.city}, {s.province}</strong></span>
                                </div>

                                {s.outOfOfficeEnabled && s.outOfOfficeMessage && (
                                  <div className="bg-amber-950/30 border border-amber-500/20 rounded-lg px-2.5 py-1 text-[11px] text-amber-200/90 flex items-start gap-1.5 mt-1">
                                    <span className="shrink-0 text-xs">🏖️</span>
                                    <span className="line-clamp-1 italic">"{s.outOfOfficeMessage}"</span>
                                    {s.outOfOfficeReturnDate && (
                                      <span className="text-amber-400 font-bold ml-auto shrink-0 text-[10px]">
                                        Returns: {s.outOfOfficeReturnDate}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {s.lastPaymentRef && (
                                  <div className="text-[11px] font-mono text-emerald-400">
                                    Submitted EFT Reference: <strong>{s.lastPaymentRef}</strong>
                                  </div>
                                )}
                              </div>

                              {/* Owner Actions for Seller */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Quick Tax Invoice Button */}
                                <button
                                  type="button"
                                  onClick={() => openTaxInvoiceModalForSeller(s)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-amber-300 hover:text-white border border-slate-700 hover:border-amber-500/40 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                                  title="View, print or download official SARS Tax Invoice for this seller"
                                >
                                  <Receipt className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Tax Invoice</span>
                                </button>

                                {/* Quick Out-of-Office Config Button */}
                                <button
                                  onClick={() => {
                                    setSelectedOofSellerId(s.id);
                                    setAdminTab('outofoffice');
                                  }}
                                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border ${
                                    s.outOfOfficeEnabled
                                      ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border-amber-500/40'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                                  }`}
                                  title="Configure custom WhatsApp Out-of-Office auto-reply for this scrap yard"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Auto-Reply</span>
                                </button>

                                {s.subscriptionStatus !== 'active' ? (
                                  <button
                                    onClick={() => handleApproveSeller(s.id)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow flex items-center gap-1 cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Activate
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleMarkUnpaid(s.id)}
                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
                                  >
                                    Mark Unpaid
                                  </button>
                                )}

                                {/* DELETE SELLER BUTTON */}
                                <button
                                  onClick={() => handleDeleteSeller(s)}
                                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                                  title="Permanently delete seller and all their listings"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Seller & Listings</span>
                                </button>
                              </div>

                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400">
                        No sellers found matching the current search criteria.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: INVENTORY MODERATION & DELETION */}
              {/* ========================================================================= */}
              {adminTab === 'inventory' && (
                <div className="space-y-4">
                  {/* Info Header */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-400" />
                        <span>All Inventory Listings Moderation</span>
                        <span className="text-xs text-slate-400">({inventory.length} Total on Platform)</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Search and delete any inappropriate, sold, non-automotive, or spam items from Part-Smart-ZA.
                      </p>
                    </div>

                    {/* Batch Action Bar */}
                    {selectedItemIds.length > 0 && (
                      <div className="flex items-center gap-2 bg-rose-950/40 border border-rose-500/40 p-2 rounded-xl">
                        <span className="text-xs text-rose-300 font-bold px-2">
                          {selectedItemIds.length} item(s) selected
                        </span>
                        <button
                          onClick={handleBatchDeleteItems}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-lg flex items-center gap-1 cursor-pointer shadow"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Selected ({selectedItemIds.length})</span>
                        </button>
                        <button
                          onClick={() => setSelectedItemIds([])}
                          className="px-2 py-1 text-slate-400 hover:text-white text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Filter Toolbar */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={invSearch}
                        onChange={(e) => setInvSearch(e.target.value)}
                        placeholder="Search part, make, OEM #, title..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <select
                      value={invCategoryFilter}
                      onChange={(e) => setInvCategoryFilter(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white cursor-pointer"
                    >
                      <option value="all">All Machinery & Vehicle Categories</option>
                      <option value="heavy_equipment">Heavy Equipment & Earthmoving</option>
                      <option value="trucks">Trucks & Commercial</option>
                      <option value="minibus_taxis">Minibus / Taxi</option>
                      <option value="cars">Passenger Cars & Bakkies</option>
                    </select>

                    <select
                      value={invSellerFilter}
                      onChange={(e) => setInvSellerFilter(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white cursor-pointer truncate"
                    >
                      <option value="all">All Seller Yards ({sellers.length})</option>
                      {sellers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.companyName} ({s.city})
                        </option>
                      ))}
                    </select>

                    <select
                      value={invConditionFilter}
                      onChange={(e) => setInvConditionFilter(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white cursor-pointer"
                    >
                      <option value="all">All Conditions</option>
                      <option value="reconditioned">Reconditioned</option>
                      <option value="used">Used</option>
                      <option value="new">Brand New</option>
                      <option value="stripping_spares">Stripping for Spares</option>
                    </select>
                  </div>

                  {/* Select All Toggle Bar */}
                  <div className="flex items-center justify-between px-2 text-xs text-slate-400">
                    <button
                      onClick={handleToggleSelectAllFiltered}
                      className="flex items-center gap-1.5 hover:text-white cursor-pointer font-semibold"
                    >
                      {areAllFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                      <span>Select all {filteredInventory.length} filtered items</span>
                    </button>

                    <span>Showing {filteredInventory.length} listing(s)</span>
                  </div>

                  {/* Inventory Items Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                    {filteredInventory.length > 0 ? (
                      filteredInventory.map((item) => {
                        const isSelected = selectedItemIds.includes(item.id);
                        const itemSeller = sellers.find((s) => s.id === item.sellerId);
                        const isSellerActive = itemSeller?.subscriptionStatus === 'active';

                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                              isSelected
                                ? 'bg-amber-950/20 border-amber-500/50'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={() => toggleSelectItem(item.id)}
                              className="mt-1 text-slate-400 hover:text-amber-400 cursor-pointer shrink-0"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-amber-400" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-600" />
                              )}
                            </button>

                            {/* Thumbnail */}
                            <img
                              src={item.images && item.images[0] ? item.images[0] : (CATEGORY_VISUALS[item.category]?.image || CATEGORY_VISUALS.heavy_equipment.image)}
                              alt=""
                              className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-800"
                              referrerPolicy="no-referrer"
                            />

                            {/* Item Info */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-bold text-xs text-white truncate">{item.title}</h4>
                                <span className="font-black text-amber-400 text-xs shrink-0">
                                  {formatCurrency(item.priceZar)}
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                <span className="text-slate-300 font-semibold">{item.make} {item.model}</span>
                                {item.year && <span>({item.year})</span>}
                                {item.partNumber && (
                                  <span className="font-mono bg-slate-900 px-1.5 py-0.2 rounded text-[10px]">
                                    #{item.partNumber}
                                  </span>
                                )}
                              </div>

                              <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                                <div className="flex items-center gap-1.5 truncate">
                                  <Building2 className="w-3 h-3 text-slate-400" />
                                  <span className={isSellerActive ? 'text-slate-300' : 'text-rose-400 font-semibold'}>
                                    {item.sellerName}
                                  </span>
                                  <span>• {item.city}</span>
                                </div>

                                <span className="bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold">
                                  {item.condition}
                                </span>
                              </div>
                            </div>

                            {/* Delete Action Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteSingleItem(item)}
                              className="p-2 bg-rose-600/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 rounded-xl transition-colors cursor-pointer shrink-0 self-center"
                              title="Delete this listing from Part-Smart-ZA"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-full p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400">
                        No inventory listings found matching the specified filters.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 3: UNPAID YARDS & LISTINGS REVIEW */}
              {/* ========================================================================= */}
              {adminTab === 'unpaid' && (
                <div className="space-y-4">
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-xs text-slate-300 space-y-1">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Unpaid & Pending Yards Management</span>
                    </span>
                    <p>
                      Below are sellers whose subscriptions are currently unpaid or awaiting proof of payment verification. You can approve their payments or permanently delete them and their listings.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {unpaidSellers.length > 0 ? (
                      unpaidSellers.map((s) => {
                        const sellerListings = inventory.filter((item) => item.sellerId === s.id);
                        return (
                          <div
                            key={s.id}
                            className="bg-slate-950 p-4 rounded-2xl border border-rose-500/30 flex flex-wrap items-center justify-between gap-4"
                          >
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-white">{s.companyName}</h4>
                                <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  {s.subscriptionStatus === 'pending_verification' ? 'PENDING PROOF' : 'UNPAID'}
                                </span>
                                <span className="text-xs text-slate-400">
                                  ({sellerListings.length} listings in database)
                                </span>
                              </div>

                              <div className="text-xs text-slate-400">
                                Contact: {s.contactName} ({s.phone}) | Email: {s.email} | Location: {s.city}, {s.province}
                              </div>

                              {s.lastPaymentRef && (
                                <div className="text-xs font-mono text-emerald-400">
                                  Submitted Proof Ref: <strong>{s.lastPaymentRef}</strong>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApproveSeller(s.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve Payment
                              </button>

                              <button
                                onClick={() => handleDeleteSeller(s)}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete Seller & All Items
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400">
                        🎉 All registered seller yards are up-to-date with active subscriptions!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB: WHATSAPP AUTO-REPLY & OUT-OF-OFFICE MANAGEMENT */}
              {/* ========================================================================= */}
              {adminTab === 'outofoffice' && (
                <div className="space-y-6 max-w-6xl mx-auto">
                  {/* Top Intro Card */}
                  <div className="bg-gradient-to-r from-emerald-950/40 via-slate-950 to-amber-950/30 border border-emerald-500/30 rounded-2xl p-5 shadow-lg">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-black text-base text-white flex items-center gap-2">
                              WhatsApp Auto-Reply & Out-of-Office Management
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold uppercase">
                                Real-Time Sync
                              </span>
                            </h3>
                            <p className="text-xs text-slate-300">
                              Configure yard-specific out-of-office notices, after-hours return dates, and holiday standby notices. Appended automatically to generated WhatsApp inquiries.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Out-of-Office</span>
                          <span className="text-sm font-black text-amber-400">{activeOofCount} / {sellers.length} Yards</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Global Platform Default Settings Section */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> Platform Global WhatsApp Fallback Settings
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          These default templates are used as a platform-wide baseline when new yards configure their out-of-office messages.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveGlobalOofDefaults}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow cursor-pointer flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Global Defaults
                      </button>
                    </div>

                    {globalOofSaveSuccess && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-2.5 rounded-xl text-xs flex items-center gap-2">
                        <Check className="w-4 h-4" /> Global WhatsApp settings saved!
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1 md:col-span-1">
                        <label className="text-slate-300 font-bold flex items-center gap-1">
                          <Phone className="w-3 h-3 text-amber-400" /> Platform Emergency Standby Phone
                        </label>
                        <input
                          type="text"
                          value={globalEmergencyPhone}
                          onChange={(e) => setGlobalEmergencyPhone(e.target.value)}
                          placeholder="+27 82 459 1102"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                        />
                        <span className="text-[10px] text-slate-500">Standby escalation line for heavy breakdown logistics.</span>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-slate-300 font-bold flex items-center justify-between">
                          <span>Default Auto-Reply Notice Template</span>
                          <button
                            type="button"
                            onClick={() => setGlobalDefaultTemplate('Our scrap yard sales desk is currently closed or out of office. All spare part enquiries will be prioritised once trading opens. For urgent commercial breakdown emergencies, please leave your vehicle VIN and engine code.')}
                            className="text-[10px] text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <RotateCcw className="w-2.5 h-2.5" /> Reset Template
                          </button>
                        </label>
                        <textarea
                          rows={2}
                          value={globalDefaultTemplate}
                          onChange={(e) => setGlobalDefaultTemplate(e.target.value)}
                          placeholder="Default message template..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Main Yard-by-Yard Management Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Yard Selector (5 cols) */}
                    <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col max-h-[750px]">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-amber-400" /> Select Scrap Yard
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {filteredOofSellers.length} of {sellers.length}
                        </span>
                      </div>

                      {/* Search and Filters */}
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={oofSearch}
                            onChange={(e) => setOofSearch(e.target.value)}
                            placeholder="Search yard name, city, phone..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="flex items-center gap-1 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setOofStatusFilter('all')}
                            className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                              oofStatusFilter === 'all'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            All ({sellers.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setOofStatusFilter('active')}
                            className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all flex items-center gap-1 ${
                              oofStatusFilter === 'active'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-900 text-amber-400 hover:bg-slate-800'
                            }`}
                          >
                            🏖️ Out-of-Office ({activeOofCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setOofStatusFilter('inactive')}
                            className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                              oofStatusFilter === 'inactive'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            🟢 Online ({sellers.length - activeOofCount})
                          </button>
                        </div>
                      </div>

                      {/* Yard List Items */}
                      <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
                        {filteredOofSellers.length > 0 ? (
                          filteredOofSellers.map((seller) => {
                            const isSelected = currentOofSeller?.id === seller.id;
                            const isOof = seller.outOfOfficeEnabled;
                            const yardItemCount = inventory.filter(i => i.sellerId === seller.id).length;

                            return (
                              <button
                                key={seller.id}
                                type="button"
                                onClick={() => setSelectedOofSellerId(seller.id)}
                                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                  isSelected
                                    ? 'bg-amber-500/15 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                                    : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                                }`}
                              >
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-xs text-white truncate">
                                      {seller.companyName}
                                    </span>
                                    {isOof ? (
                                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] px-1.5 py-0.2 rounded font-bold">
                                        🏖️ OOF
                                      </span>
                                    ) : (
                                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] px-1.5 py-0.2 rounded font-bold">
                                        ONLINE
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                    <span>{seller.city}, {seller.province}</span>
                                    <span>•</span>
                                    <span>{yardItemCount} Parts</span>
                                  </div>

                                  {isOof && seller.outOfOfficeReturnDate && (
                                    <div className="text-[10px] text-amber-400/90 font-medium">
                                      Returns: <strong>{seller.outOfOfficeReturnDate}</strong>
                                    </div>
                                  )}
                                </div>

                                <div className="shrink-0 text-slate-500">
                                  {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-6 text-center text-xs text-slate-500">
                            No scrap yards match your filter.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Yard Out-of-Office Configuration & Live Simulator (7 cols) */}
                    <div className="lg:col-span-7 space-y-4">
                      {currentOofSeller ? (
                        <form onSubmit={handleSaveYardOof} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-5">
                          {/* Active Yard Header */}
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h3 className="font-black text-sm text-white">{currentOofSeller.companyName}</h3>
                                <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-amber-400">
                                  {currentOofSeller.id}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                                <span>Contact: <strong className="text-slate-200">{currentOofSeller.contactName}</strong></span>
                                <span>•</span>
                                <span>WhatsApp: <strong className="text-emerald-400 font-mono">{currentOofSeller.phone}</strong></span>
                              </p>
                            </div>

                            <button
                              type="submit"
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" /> Save Yard Settings
                            </button>
                          </div>

                          {oofSaveSuccess && (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2">
                              <Check className="w-4 h-4" /> Out-of-Office settings saved and applied to WhatsApp inquiries!
                            </div>
                          )}

                          {/* 1. Out-of-Office Active Toggle Switch */}
                          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-4">
                            <div className="space-y-0.5">
                              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>Out-of-Office Auto-Reply Status</span>
                              </label>
                              <p className="text-[11px] text-slate-400">
                                When enabled, buyers submitting WhatsApp inquiries for this yard will see your custom notice appended.
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
                              {yardOofEnabled ? (
                                <>
                                  <span>🏖️ Active (Out-of-Office)</span>
                                </>
                              ) : (
                                <>
                                  <span>🟢 Normal (Online)</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* 2. Expected Return / Reopen Date Input */}
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
                              placeholder="e.g. Monday at 08:00, Tomorrow morning, After Easter Weekend"
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
                                  className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
                                >
                                  {pill}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 3. Custom Auto-Reply Message Textarea */}
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <label className="text-slate-300 font-bold flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Custom Out-of-Office WhatsApp Message</span>
                              </label>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {yardOofMessage.length} characters
                              </span>
                            </div>

                            <textarea
                              rows={3}
                              value={yardOofMessage}
                              onChange={(e) => setYardOofMessage(e.target.value)}
                              placeholder="Enter the message buyers will see when contacting this yard while out of office..."
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          {/* 4. One-Click Scenario Presets */}
                          <div className="space-y-2">
                            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                              <Zap className="w-3 h-3" /> 1-Click Common SA Yard Scenario Presets:
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() => applyPresetTemplate(
                                  'Our scrap yard sales counter is closed for the weekend / after trading hours. All inquiries will be processed first thing Monday morning at 08:00.',
                                  'Monday 08:00'
                                )}
                                className="text-left p-2.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all cursor-pointer group"
                              >
                                <div className="font-bold text-slate-200 group-hover:text-amber-400 flex items-center gap-1">
                                  <span>🌙 Weekend & After-Hours</span>
                                </div>
                                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                  Closed for trading hours, resumes Monday 08:00.
                                </p>
                              </button>

                              <button
                                type="button"
                                onClick={() => applyPresetTemplate(
                                  'We are closed for the South African public holiday. Courier dispatches and warehouse loading will resume on the next business day.',
                                  'Next Business Day'
                                )}
                                className="text-left p-2.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all cursor-pointer group"
                              >
                                <div className="font-bold text-slate-200 group-hover:text-amber-400 flex items-center gap-1">
                                  <span>🇿🇦 SA Public Holiday</span>
                                </div>
                                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                  Holiday closure with courier dispatch note.
                                </p>
                              </button>

                              <button
                                type="button"
                                onClick={() => applyPresetTemplate(
                                  'Our yard is currently operating on generator backup during loadshedding. Part inquiries are monitored via our mobile standby desk.',
                                  'Within 2 hours'
                                )}
                                className="text-left p-2.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all cursor-pointer group"
                              >
                                <div className="font-bold text-slate-200 group-hover:text-amber-400 flex items-center gap-1">
                                  <span>⚡ Loadshedding Backup</span>
                                </div>
                                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                  Operating on standby generator desk.
                                </p>
                              </button>

                              <button
                                type="button"
                                onClick={() => applyPresetTemplate(
                                  'Yard counter closed. For critical fleet breakdown emergencies (Engines, Transmissions, Final Drives), please WhatsApp our standby technician directly.',
                                  'Standby 24/7'
                                )}
                                className="text-left p-2.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all cursor-pointer group"
                              >
                                <div className="font-bold text-slate-200 group-hover:text-amber-400 flex items-center gap-1">
                                  <span>🚜 Heavy Fleet Emergency</span>
                                </div>
                                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                  Emergency escalation for commercial breakdowns.
                                </p>
                              </button>
                            </div>
                          </div>

                          {/* 5. Live WhatsApp Chat Message Simulator */}
                          <div className="space-y-2 pt-2 border-t border-slate-800">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Live WhatsApp Message Preview (What Buyers Send)</span>
                              </span>

                              {sampleYardItem && (
                                <a
                                  href={simulatedWhatsappUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <span>Test Deep Link</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>

                            {/* WhatsApp Container */}
                            <div className="bg-[#0b141a] rounded-2xl border border-slate-800 p-4 space-y-3 font-sans shadow-inner">
                              {/* Simulated Chat Header */}
                              <div className="flex items-center justify-between pb-2 border-b border-[#202c33] text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">
                                    {currentOofSeller.companyName.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-100 flex items-center gap-1 text-xs">
                                      <span>{currentOofSeller.companyName}</span>
                                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-bold">
                                        BUSINESS
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-emerald-400">
                                      {yardOofEnabled ? '🏖️ Out of office notice active' : '🟢 Online'}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-[10px] text-slate-400 font-mono">
                                  {currentOofSeller.phone}
                                </div>
                              </div>

                              {/* WhatsApp Message Bubble */}
                              <div className="flex justify-end">
                                <div className="bg-[#005c4b] text-slate-100 rounded-2xl rounded-tr-sm p-3 max-w-md text-xs space-y-2 shadow">
                                  <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                                    {simulatedInquiryText || 'Select a yard to preview message...'}
                                  </div>

                                  <div className="flex items-center justify-end gap-1 text-[9px] text-slate-300">
                                    <span>Just now</span>
                                    <span className="text-sky-300 font-bold">✓✓</span>
                                  </div>
                                </div>
                              </div>

                              {/* Out-of-Office Banner Note inside simulator */}
                              {yardOofEnabled && (
                                <div className="bg-[#1f2c34] border border-amber-500/40 rounded-xl p-2.5 text-[11px] text-amber-200/90 flex items-start gap-2">
                                  <span className="text-sm">🏖️</span>
                                  <div>
                                    <strong className="text-amber-400 block font-bold">
                                      Auto-Reply Active for {currentOofSeller.companyName}:
                                    </strong>
                                    <span>
                                      Buyers will see your custom notice appended automatically before sending their message.
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </form>
                      ) : (
                        <div className="p-12 text-center bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400">
                          Please select a scrap yard from the list on the left to configure WhatsApp auto-reply settings.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 4: OWNER BANKING DETAILS */}
              {/* ========================================================================= */}
              {adminTab === 'banking' && (
                <form onSubmit={handleSaveBanking} className="space-y-6 max-w-3xl mx-auto bg-slate-950 p-6 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="font-bold text-base text-amber-400">Configure Owner Banking Details</h3>
                      <p className="text-xs text-slate-400">
                        These details are displayed to sellers in their portal for monthly EFT subscription payments.
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Banking Info
                    </button>
                  </div>

                  {bankSaveSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2">
                      <Check className="w-4 h-4" /> Banking details updated successfully!
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">Bank Name *</label>
                      <input
                        type="text"
                        required
                        value={bankForm.bankName}
                        onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                        placeholder="e.g. First National Bank (FNB)"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">Account Holder Name *</label>
                      <input
                        type="text"
                        required
                        value={bankForm.accountHolder}
                        onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                        placeholder="e.g. Part-Smart ZA (Pty) Ltd"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">Account Number *</label>
                      <input
                        type="text"
                        required
                        value={bankForm.accountNumber}
                        onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                        placeholder="e.g. 62849102384"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">Branch Code *</label>
                      <input
                        type="text"
                        required
                        value={bankForm.branchCode}
                        onChange={(e) => setBankForm({ ...bankForm, branchCode: e.target.value })}
                        placeholder="e.g. 250655"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">Account Type</label>
                      <input
                        type="text"
                        value={bankForm.accountType}
                        onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value })}
                        placeholder="e.g. Business Cheque Account"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">SWIFT Code (Optional)</label>
                      <input
                        type="text"
                        value={bankForm.swiftCode || ''}
                        onChange={(e) => setBankForm({ ...bankForm, swiftCode: e.target.value })}
                        placeholder="e.g. FIRNZAJJ"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-slate-300 font-bold">Required EFT Payment Reference Format</label>
                      <input
                        type="text"
                        value={bankForm.paymentReferenceFormat}
                        onChange={(e) => setBankForm({ ...bankForm, paymentReferenceFormat: e.target.value })}
                        placeholder="e.g. PS-[COMPANY-NAME] or PS-[SELLER-ID]"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-slate-300 font-bold">Additional Instructions for Sellers</label>
                      <textarea
                        rows={3}
                        value={bankForm.additionalInstructions}
                        onChange={(e) => setBankForm({ ...bankForm, additionalInstructions: e.target.value })}
                        placeholder="Instructions regarding proof of payment emails or verification timeline..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                </form>
              )}

              {/* ========================================================================= */}
              {/* TAB 5: CHANGE OWNER PASSWORD */}
              {/* ========================================================================= */}
              {adminTab === 'security' && (
                <form onSubmit={handleChangePassword} className="max-w-md mx-auto space-y-4 bg-slate-950 p-6 rounded-2xl border border-slate-800">
                  <h3 className="text-sm font-bold text-amber-400 border-b border-slate-800 pb-2">
                    Change App Owner Admin Password
                  </h3>

                  {passSaveSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs">
                      Password changed successfully!
                    </div>
                  )}

                  <div className="space-y-1 text-xs">
                    <label className="text-slate-300 font-bold">New Owner Password</label>
                    <input
                      type="text"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new owner password..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Update Password
                  </button>
                </form>
              )}

              {/* ========================================================================= */}
              {/* TAB: SUBSCRIPTION PRICING & PROMOTIONS MANAGEMENT */}
              {/* ========================================================================= */}
              {adminTab === 'pricing' && (
                <div className="space-y-8 max-w-5xl mx-auto">
                  
                  {/* Pricing Top Banner */}
                  <div className="bg-gradient-to-r from-amber-950/50 via-slate-950 to-orange-950/40 border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl flex items-center justify-center font-black shrink-0 shadow-lg">
                          <BadgePercent className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-black text-white">Subscription Pricing & Discounts</h3>
                            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              Owner Controls
                            </span>
                            {plansForm.some(p => p.isDiscountActive) && (
                              <span className="bg-orange-500/20 text-orange-400 border border-orange-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Flame className="w-3 h-3 animate-pulse" /> Promo Discounts Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">
                            Modify monthly subscription prices, create limited-time launch discounts, and manage plan advertising limits to attract scrap yards and equipment breakers.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <button
                          type="button"
                          onClick={() => setAdminTab('analytics')}
                          className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          <span>View Revenue Trends</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveAllPricingAndCampaign()}
                          className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                        >
                          <Save className="w-4 h-4" />
                          <span>Publish Changes Live</span>
                        </button>
                      </div>
                    </div>

                    {pricingSaveSuccess && (
                      <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 p-3.5 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span><strong>Changes Live!</strong> Subscription prices and promotional campaigns have been updated and synchronized with Firestore.</span>
                      </div>
                    )}
                  </div>

                  {/* 1. GLOBAL PROMOTIONAL CAMPAIGN & ANNOUNCEMENTS */}
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                      <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          <Gift className="w-4 h-4 text-amber-400" />
                          Platform-Wide Promotional Campaign Banner
                        </h4>
                        <p className="text-xs text-slate-400">
                          Display a prominent promotional announcement banner on the Seller Portal and subscription pricing tables.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setCampaignForm(prev => ({ ...prev, enabled: !prev.enabled }))}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 border ${
                          campaignForm.enabled
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-2 ring-emerald-500/20'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${campaignForm.enabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                        <span>{campaignForm.enabled ? '🟢 Campaign Active' : '⚪ Campaign Inactive'}</span>
                      </button>
                    </div>

                    {/* Quick Preset Promotion Buttons */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" /> One-Click Promotional Presets:
                        </label>
                        <span className="text-[10px] text-slate-500">Applies pre-calculated promo rates across plans</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        <button
                          type="button"
                          onClick={applyGlobalPreset50Percent}
                          className="p-3 bg-slate-900/80 hover:bg-slate-900 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl text-left transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-amber-400 group-hover:text-amber-300">🚀 50% Launch Deal</span>
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">ALL</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Sets 50% discount on all plans (R225 / R425 / R925).
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={applyGlobalPreset30Percent}
                          className="p-3 bg-slate-900/80 hover:bg-slate-900 border border-orange-500/30 hover:border-orange-500/60 rounded-2xl text-left transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-orange-400 group-hover:text-orange-300">🌸 30% Pro & Dealer</span>
                            <span className="text-[9px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded font-mono font-bold">TIER 2+3</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Discounts Pro to R595 & Enterprise to R1,295.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={applyFlatRateLaunchSpecial}
                          className="p-3 bg-slate-900/80 hover:bg-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl text-left transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-emerald-400 group-hover:text-emerald-300">⚡ R199 Flash Promo</span>
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">FLAT</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            R199 Basic / R399 Pro / R999 Unlimited.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={resetAllDiscountsToStandard}
                          className="p-3 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl text-left transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-300 group-hover:text-white">🔄 Standard Prices</span>
                            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">RESET</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Disables all discounts; restores regular R450 / R850 / R1850.
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Campaign Settings Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                      <div className="space-y-1">
                        <label className="text-slate-300 font-bold">Campaign Headline</label>
                        <input
                          type="text"
                          value={campaignForm.headline}
                          onChange={(e) => setCampaignForm({ ...campaignForm, headline: e.target.value })}
                          placeholder="e.g. Special Launch Promotion: Up to 50% OFF Subscription Rates"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-300 font-bold">Promotional Badge Text</label>
                        <input
                          type="text"
                          value={campaignForm.badgeText || ''}
                          onChange={(e) => setCampaignForm({ ...campaignForm, badgeText: e.target.value })}
                          placeholder="e.g. 🔥 SPRING PROMO DEAL"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-slate-300 font-bold">Campaign Sub-Announcement Notice</label>
                        <textarea
                          rows={2}
                          value={campaignForm.announcementText || ''}
                          onChange={(e) => setCampaignForm({ ...campaignForm, announcementText: e.target.value })}
                          placeholder="Detailed promotional offer details displayed in the seller portal..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-300 font-bold">Validity / Expiry Notice (Optional)</label>
                        <input
                          type="text"
                          value={campaignForm.expiresAt || ''}
                          onChange={(e) => setCampaignForm({ ...campaignForm, expiresAt: e.target.value })}
                          placeholder="e.g. Valid until 30 Sept 2026 or First 50 Scrap Yards"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. INDIVIDUAL SUBSCRIPTION PLANS EDITOR */}
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-amber-400" />
                          Individual Plan Price & Discount Editor
                        </h4>
                        <p className="text-xs text-slate-400">
                          Configure regular monthly pricing, active discounts, listing limits, and feature lists per tier.
                        </p>
                      </div>

                      {/* Tier Select Tabs */}
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                        {plansForm.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedPlanTab(p.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              selectedPlanTab === p.id
                                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <span>{p.name}</span>
                            {p.isDiscountActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Active Selected Plan Editor Card */}
                    {plansForm
                      .filter((p) => p.id === selectedPlanTab)
                      .map((plan) => {
                        const basePrice = plan.priceZar || 450;
                        const isDiscountActive = Boolean(plan.isDiscountActive);
                        const discountPct = plan.discountPercentage || 0;
                        const calculatedPromo = Math.round(basePrice * (1 - discountPct / 100));
                        const finalPrice = isDiscountActive
                          ? (plan.promoPriceZar !== undefined && plan.promoPriceZar > 0 ? plan.promoPriceZar : calculatedPromo)
                          : basePrice;
                        const savings = Math.max(0, basePrice - finalPrice);

                        return (
                          <div key={plan.id} className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
                            
                            {/* Plan Header Bar */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-base font-black text-white uppercase tracking-wider">{plan.name} Tier</span>
                                  {isDiscountActive ? (
                                    <span className="bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                                      {plan.promotionalBadge || `🔥 ${discountPct}% DISCOUNT`}
                                    </span>
                                  ) : (
                                    <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                      Standard Rate
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400">{plan.description}</p>
                              </div>

                              {/* Discount Active Switch */}
                              <button
                                type="button"
                                onClick={() => handleTogglePlanDiscount(plan.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 border shrink-0 ${
                                  isDiscountActive
                                    ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-500/30'
                                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                                }`}
                              >
                                {isDiscountActive ? '🔥 Discount Enabled' : '⚪ Standard (No Discount)'}
                              </button>
                            </div>

                            {/* Plan Fields Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                              
                              {/* 1. Base Price */}
                              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
                                <label className="text-slate-300 font-bold flex items-center justify-between">
                                  <span>Regular Base Monthly Price</span>
                                  <span className="text-[10px] text-slate-500 font-mono">ZAR</span>
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-amber-400 font-black text-sm">R</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="10"
                                    value={plan.priceZar}
                                    onChange={(e) => handleUpdatePlanField(plan.id, 'priceZar', Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-white font-black text-sm focus:outline-none focus:border-amber-500"
                                  />
                                </div>
                                <p className="text-[10px] text-slate-500">
                                  Original regular subscription fee charged per calendar month.
                                </p>
                              </div>

                              {/* 2. Promotional Discount Percentage */}
                              <div className={`p-4 rounded-2xl border transition-all space-y-2 ${
                                isDiscountActive ? 'bg-orange-950/20 border-orange-500/40' : 'bg-slate-900/90 border-slate-800'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <label className="text-slate-300 font-bold">Promotional Discount (%)</label>
                                  <span className={`font-black font-mono text-sm ${isDiscountActive ? 'text-orange-400' : 'text-slate-500'}`}>
                                    {discountPct}% OFF
                                  </span>
                                </div>

                                <div className="flex items-center gap-3">
                                  <input
                                    type="range"
                                    min="0"
                                    max="90"
                                    step="5"
                                    disabled={!isDiscountActive}
                                    value={discountPct}
                                    onChange={(e) => handleUpdatePlanField(plan.id, 'discountPercentage', Number(e.target.value))}
                                    className="flex-1 accent-amber-500 cursor-pointer disabled:opacity-40"
                                  />
                                  <input
                                    type="number"
                                    min="0"
                                    max="90"
                                    disabled={!isDiscountActive}
                                    value={discountPct}
                                    onChange={(e) => handleUpdatePlanField(plan.id, 'discountPercentage', Number(e.target.value))}
                                    className="w-16 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-center font-bold text-white text-xs disabled:opacity-40"
                                  />
                                </div>

                                <p className="text-[10px] text-slate-400">
                                  {isDiscountActive
                                    ? `Calculates to R${calculatedPromo} / month (Saves R${basePrice - calculatedPromo})`
                                    : 'Enable discount switch above to apply percentage reduction.'}
                                </p>
                              </div>

                              {/* 3. Direct Custom Promo Price Override */}
                              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
                                <label className="text-slate-300 font-bold flex items-center justify-between">
                                  <span>Custom Override Price (Optional)</span>
                                  <span className="text-[10px] text-slate-500 font-mono">ZAR</span>
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-emerald-400 font-black text-sm">R</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="10"
                                    disabled={!isDiscountActive}
                                    value={plan.promoPriceZar !== undefined ? plan.promoPriceZar : ''}
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? undefined : Number(e.target.value);
                                      handleUpdatePlanField(plan.id, 'promoPriceZar', val);
                                    }}
                                    placeholder={`Auto: R${calculatedPromo}`}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-white font-black text-sm focus:outline-none focus:border-amber-500 disabled:opacity-40"
                                  />
                                </div>
                                <p className="text-[10px] text-slate-500">
                                  Set a custom flat promotional rate (e.g. R199) or leave blank to use % calculation.
                                </p>
                              </div>

                              {/* 4. Active Listings Limit */}
                              <div className="space-y-1">
                                <label className="text-slate-300 font-bold">Max Active Inventory Listings Limit</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={plan.maxListings}
                                  onChange={(e) => handleUpdatePlanField(plan.id, 'maxListings', Number(e.target.value))}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                                />
                                <span className="text-[10px] text-slate-500">Enter 9999 for unlimited listings.</span>
                              </div>

                              {/* 5. Custom Promo Badge */}
                              <div className="space-y-1">
                                <label className="text-slate-300 font-bold">Promotional Card Badge Text</label>
                                <input
                                  type="text"
                                  value={plan.promotionalBadge || ''}
                                  onChange={(e) => handleUpdatePlanField(plan.id, 'promotionalBadge', e.target.value)}
                                  placeholder="e.g. 🔥 50% LAUNCH DEAL or MOST POPULAR"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                                />
                              </div>

                              {/* 6. Promotional Sub-Notice */}
                              <div className="space-y-1">
                                <label className="text-slate-300 font-bold">Promotional Sub-Notice / Terms</label>
                                <input
                                  type="text"
                                  value={plan.promoNotice || ''}
                                  onChange={(e) => handleUpdatePlanField(plan.id, 'promoNotice', e.target.value)}
                                  placeholder="e.g. Special promotional rate for new auto breakers"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                />
                              </div>

                              {/* 7. Plan Description */}
                              <div className="space-y-1 md:col-span-3">
                                <label className="text-slate-300 font-bold">Plan Description for Scrap Yards</label>
                                <textarea
                                  rows={2}
                                  value={plan.description}
                                  onChange={(e) => handleUpdatePlanField(plan.id, 'description', e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                                />
                              </div>
                            </div>

                            {/* Plan Feature Items List Manager */}
                            <div className="space-y-3 pt-2 border-t border-slate-800/80">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Plan Features & Perks Checklist:
                                </label>
                                <span className="text-[10px] text-slate-500">{plan.features.length} features listed</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {plan.features.map((feat, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2"
                                  >
                                    <div className="flex items-center gap-2 text-slate-200">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                      <span className="text-[11px]">{feat}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveFeatureFromPlan(plan.id, idx)}
                                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                                      title="Remove feature"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              {/* Add Feature Input */}
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  value={newFeatureText}
                                  onChange={(e) => setNewFeatureText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddFeatureToPlan(plan.id);
                                    }
                                  }}
                                  placeholder="Type a new feature bullet and click Add..."
                                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddFeatureToPlan(plan.id)}
                                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add Feature</span>
                                </button>
                              </div>
                            </div>

                            {/* Real-Time Scrap Yard Preview Card */}
                            <div className="bg-slate-900/60 p-5 rounded-2xl border border-dashed border-amber-500/40 space-y-3">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                                  <Eye className="w-3.5 h-3.5" /> Live Scrap Yard View Preview:
                                </span>
                                <span className="text-slate-400 text-[10px]">
                                  This is how scrap yard owners will see the {plan.name} plan on Part-Smart-ZA
                                </span>
                              </div>

                              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 max-w-md mx-auto">
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-base text-white uppercase">{plan.name} Plan</span>
                                  {plan.promotionalBadge && (
                                    <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                      {plan.promotionalBadge}
                                    </span>
                                  )}
                                </div>

                                <div className="space-y-0.5">
                                  {isDiscountActive && finalPrice < basePrice ? (
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                      <span className="text-slate-500 line-through text-base font-bold">R{basePrice}</span>
                                      <span className="text-2xl font-black text-amber-400">R{finalPrice}</span>
                                      <span className="text-xs text-slate-400">/ month</span>
                                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full ml-auto">
                                        Save R{savings}/mo
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-2xl font-black text-white">R{basePrice}</span>
                                      <span className="text-xs text-slate-400">/ month</span>
                                    </div>
                                  )}
                                  {plan.promoNotice && isDiscountActive && (
                                    <p className="text-[10px] text-amber-400 font-medium pt-0.5">{plan.promoNotice}</p>
                                  )}
                                </div>

                                <div className="text-xs text-amber-400 font-bold">
                                  {plan.maxListings >= 9999 ? 'Unlimited Active Listings' : `${plan.maxListings} Active Listings Limit`}
                                </div>

                                <ul className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                                  {plan.features.slice(0, 4).map((f, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                      <span className="text-[11px]">{f}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                  </div>

                  {/* Bottom Save & Publish Bar */}
                  <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-slate-400">
                      <strong className="text-white">Ready to activate?</strong> Saving will instantly update the subscription prices and live promo banners across the entire application and database.
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveAllPricingAndCampaign()}
                      className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save & Publish All Subscription Pricing</span>
                    </button>
                  </div>

                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB: AUTOMATED TAX / VAT INVOICE SETTINGS & SARS COMPLIANCE */}
              {/* ========================================================================= */}
              {adminTab === 'tax_invoice' && (
                <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-200">
                  
                  {/* Top Tax / VAT Header Banner */}
                  <div className="bg-gradient-to-r from-amber-950/40 via-slate-950 to-emerald-950/30 border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl flex items-center justify-center font-black shrink-0 shadow-lg">
                          <Receipt className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-black text-white">Automated Tax / VAT Invoicing</h3>
                            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              SARS Section 20(4)
                            </span>
                            {taxInvoiceForm.enabled ? (
                              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Invoicing Engine Active ({taxInvoiceForm.vatRatePercent}% VAT)
                              </span>
                            ) : (
                              <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">
                            Automatically generate and attach SARS-compliant tax invoices to subscription payment confirmations and seller approval emails.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <button
                          type="button"
                          onClick={() => {
                            const sampleSeller = sellers.find(s => s.id === taxPreviewSellerId) || sellers[0];
                            if (sampleSeller) openTaxInvoiceModalForSeller(sampleSeller);
                          }}
                          className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <Eye className="w-4 h-4 text-amber-400" />
                          <span>Preview Invoice</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveTaxInvoiceSettings()}
                          className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save Invoice Settings</span>
                        </button>
                      </div>
                    </div>

                    {taxSaveSuccess && (
                      <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 p-3.5 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span><strong>Settings Saved!</strong> Automated tax invoicing, VAT rules, and email dispatch triggers are synchronized.</span>
                      </div>
                    )}
                  </div>

                  {/* 1. MASTER AUTOMATION TOGGLES */}
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
                    <h4 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Automated Invoicing & Email Attachment Triggers
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Toggle 1: Enable Engine */}
                      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>Tax Invoicing Engine</span>
                          </label>
                          <p className="text-[11px] text-slate-400">
                            Enables automated SARS Section 20(4) tax invoice numbering, calculations, and PDF generation.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTaxInvoiceForm(prev => ({ ...prev, enabled: !prev.enabled }))}
                          className={`w-full py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                            taxInvoiceForm.enabled
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-2 ring-emerald-500/20'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${taxInvoiceForm.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                          <span>{taxInvoiceForm.enabled ? 'Enabled' : 'Disabled'}</span>
                        </button>
                      </div>

                      {/* Toggle 2: Auto-attach to Payment Confirmation */}
                      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>Auto-Attach to Confirmation Email</span>
                          </label>
                          <p className="text-[11px] text-slate-400">
                            Automatically generates and attaches the official PDF receipt/invoice whenever payment is verified.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTaxInvoiceForm(prev => ({ ...prev, autoAttachToConfirmationEmail: !prev.autoAttachToConfirmationEmail }))}
                          className={`w-full py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                            taxInvoiceForm.autoAttachToConfirmationEmail
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-2 ring-emerald-500/20'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${taxInvoiceForm.autoAttachToConfirmationEmail ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                          <span>{taxInvoiceForm.autoAttachToConfirmationEmail ? 'Auto-Attach Active' : 'Do Not Attach'}</span>
                        </button>
                      </div>

                      {/* Toggle 3: Auto-dispatch on Approval */}
                      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>Auto-Dispatch on Seller Activation</span>
                          </label>
                          <p className="text-[11px] text-slate-400">
                            Triggers immediate invoice generation & email notification when approving a seller in the console.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTaxInvoiceForm(prev => ({ ...prev, autoDispatchOnApproval: !prev.autoDispatchOnApproval }))}
                          className={`w-full py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                            taxInvoiceForm.autoDispatchOnApproval
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-2 ring-emerald-500/20'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${taxInvoiceForm.autoDispatchOnApproval ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                          <span>{taxInvoiceForm.autoDispatchOnApproval ? 'Dispatch on Approval' : 'Manual Approval Only'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. ONE-CLICK VAT RATE & STATUTORY PRESETS */}
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5" /> One-Click VAT & Tax Presets:
                      </label>
                      <span className="text-[10px] text-slate-500">Applies official South African tax presets</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={applyVatPreset15Percent}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer group ${
                          taxInvoiceForm.vatRatePercent === 15
                            ? 'bg-amber-500/10 border-amber-500 text-white'
                            : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/40 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-400">🇿🇦 15% SARS Standard VAT</span>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">Standard</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Standard rate for VAT-registered South African enterprises (VAT Act Section 7).
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={applyZeroRatedPreset}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer group ${
                          taxInvoiceForm.vatRatePercent === 0 && taxInvoiceForm.complianceNoticeText?.includes('Section 11')
                            ? 'bg-amber-500/10 border-amber-500 text-white'
                            : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/40 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-400">📦 0% Zero-Rated Supply</span>
                          <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">Section 11</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Cross-border services, SADC export services, and zero-rated supplies.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={applyExemptPreset}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer group ${
                          taxInvoiceForm.vatRatePercent === 0 && taxInvoiceForm.complianceNoticeText?.includes('Section 12')
                            ? 'bg-amber-500/10 border-amber-500 text-white'
                            : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/40 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-400">🚫 Exempt / Non-VAT Vendor</span>
                          <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">Turnover &lt; R1m</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          For sole proprietors or entities below the mandatory R1m VAT threshold.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* 3. SARS LEGAL ENTITY & SUPPLIER DETAILS */}
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-lg">
                    <h4 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                      <Building2 className="w-4 h-4 text-amber-400" />
                      Platform Supplier Legal Entity Profile (Printed on Invoices)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-slate-300 font-bold">Registered Legal Entity Name</label>
                        <input
                          type="text"
                          value={taxInvoiceForm.legalEntityName}
                          onChange={(e) => setTaxInvoiceForm({ ...taxInvoiceForm, legalEntityName: e.target.value })}
                          placeholder="e.g. Part-Smart ZA Proprietary Limited"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-300 font-bold">Trading Name / Brand</label>
                        <input
                          type="text"
                          value={taxInvoiceForm.tradingName || ''}
                          onChange={(e) => setTaxInvoiceForm({ ...taxInvoiceForm, tradingName: e.target.value })}
                          placeholder="e.g. Part-Smart ZA Heavy Commercial & Auto Spares Network"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-300 font-bold flex items-center justify-between">
                          <span>SARS VAT Registration Number (10 Digits)</span>
                          <span className="text-[10px] text-amber-400 font-mono">Section 20(4)(a)</span>
                        </label>
                        <input
                          type="text"
                          value={taxInvoiceForm.vatRegistrationNumber}
                          onChange={(e) => setTaxInvoiceForm({ ...taxInvoiceForm, vatRegistrationNumber: e.target.value })}
                          placeholder="e.g. 4980123984"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-300 font-bold flex items-center justify-between">
                          <span>CIPC Company Registration Number</span>
                          <span className="text-[10px] text-slate-500 font-mono">South Africa</span>
                        </label>
                        <input
                          type="text"
                          value={taxInvoiceForm.cipcRegistrationNumber || ''}
                          onChange={(e) => setTaxInvoiceForm({ ...taxInvoiceForm, cipcRegistrationNumber: e.target.value })}
                          placeholder="e.g. 2021/849201/07"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-300 font-bold">SARS Income Tax Reference Number</label>
                        <input
                          type="text"
                          value={taxInvoiceForm.companyTaxNumber || ''}
                          onChange={(e) => setTaxInvoiceForm({ ...taxInvoiceForm, companyTaxNumber: e.target.value })}
                          placeholder="e.g. 9840219481"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-300 font-bold">Accounts / Billing Email Address</label>
                        <input
                          type="email"
                          value={taxInvoiceForm.billingContactEmail || ''}
                          onChange={(e) => setTaxInvoiceForm({ ...taxInvoiceForm, billingContactEmail: e.target.value })}
                          placeholder="e.g. accounts@partsmart.co.za"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-slate-300 font-bold">Registered Legal & Physical Address</label>
                        <input
                          type="text"
                          value={taxInvoiceForm.registeredAddress || ''}
                          onChange={(e) => setTaxInvoiceForm({ ...taxInvoiceForm, registeredAddress: e.target.value })}
                          placeholder="e.g. 14 Auto Spares Crescent, Apex Industrial, Benoni, 1501, Gauteng, South Africa"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. INVOICE NUMBERING & STATUTORY NOTICE */}
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-lg">
                    <h4 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                      <FileText className="w-4 h-4 text-amber-400" />
                      Invoice Number Sequence & Statutory Notice
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-slate-300 font-bold">Invoice Number Prefix</label>
                        <input
                          type="text"
                          value={taxInvoiceForm.invoiceNumberPrefix}
                          onChange={(e) => setTaxInvoiceForm({ ...taxInvoiceForm, invoiceNumberPrefix: e.target.value })}
                          placeholder="e.g. INV-PSZA-"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                        />
                        <span className="text-[10px] text-slate-500">e.g. INV-PSZA-</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-300 font-bold">Next Sequence Number</label>
                        <input
                          type="number"
                          min="1000"
                          value={taxInvoiceForm.nextInvoiceSequence}
                          onChange={(e) => setTaxInvoiceForm({ ...taxInvoiceForm, nextInvoiceSequence: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                        />
                        <span className="text-[10px] text-slate-500">Next invoice: {taxInvoiceForm.invoiceNumberPrefix}{taxInvoiceForm.nextInvoiceSequence}</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-300 font-bold">Applicable VAT Rate (%)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={taxInvoiceForm.vatRatePercent}
                            onChange={(e) => setTaxInvoiceForm({ ...taxInvoiceForm, vatRatePercent: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                          />
                          <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold">%</span>
                        </div>
                        <span className="text-[10px] text-slate-500">South Africa standard: 15%</span>
                      </div>

                      <div className="space-y-1 md:col-span-3">
                        <label className="text-slate-300 font-bold">Official SARS Statutory Compliance Footnote</label>
                        <textarea
                          rows={2}
                          value={taxInvoiceForm.complianceNoticeText || ''}
                          onChange={(e) => setTaxInvoiceForm({ ...taxInvoiceForm, complianceNoticeText: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. EMAIL NOTIFICATION & ATTACHMENT TEMPLATE */}
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-lg">
                    <h4 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                      <Mail className="w-4 h-4 text-emerald-400" />
                      Payment Confirmation Email & Tax Invoice Dispatch Template
                    </h4>

                    <div className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-slate-300 font-bold flex items-center justify-between">
                          <span>Email Subject Line Template</span>
                          <span className="text-[10px] text-slate-400">Supports [InvoiceNumber], [YardName], [PlanName]</span>
                        </label>
                        <input
                          type="text"
                          value={taxInvoiceForm.emailSubjectTemplate}
                          onChange={(e) => setTaxInvoiceForm({ ...taxInvoiceForm, emailSubjectTemplate: e.target.value })}
                          placeholder="e.g. Tax Invoice & Payment Confirmation: Part-Smart ZA Subscription [InvoiceNumber]"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-300 font-bold flex items-center justify-between">
                          <span>Email Body Content (Dispatched with Attached PDF)</span>
                          <span className="text-[10px] text-slate-400">Tokens: [SellerContact], [YardName], [TotalAmount], [PlanName], [InvoiceNumber]</span>
                        </label>
                        <textarea
                          rows={6}
                          value={taxInvoiceForm.emailBodyTemplate}
                          onChange={(e) => setTaxInvoiceForm({ ...taxInvoiceForm, emailBodyTemplate: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-500 leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 6. LIVE INTERACTIVE INVOICE & EMAIL SIMULATOR */}
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-lg">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          <Eye className="w-4 h-4 text-amber-400" />
                          Live Email & Invoice Attachment Simulator
                        </h4>
                        <p className="text-xs text-slate-400">
                          Select a scrap yard to test dynamic calculation, email dispatch rendering, and download a sample tax PDF.
                        </p>
                      </div>

                      {/* Select Seller for Simulator */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-bold">Preview Yard:</span>
                        <select
                          value={taxPreviewSellerId}
                          onChange={(e) => setTaxPreviewSellerId(e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white cursor-pointer"
                        >
                          {sellers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.companyName} ({s.planId.toUpperCase()} Plan)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {(() => {
                      const sampleSeller = sellers.find(s => s.id === taxPreviewSellerId) || sellers[0];
                      if (!sampleSeller) return null;
                      const pricing = getPlanEffectivePricing(sampleSeller.planId);
                      const amount = pricing.effectivePrice;
                      const vatRate = taxInvoiceForm.vatRatePercent || 15;
                      const vatZar = Math.round((amount * vatRate / (100 + vatRate)) * 100) / 100;
                      const invNumber = `${taxInvoiceForm.invoiceNumberPrefix || 'INV-PSZA-'}${taxInvoiceForm.nextInvoiceSequence || 1049}`;
                      
                      const simulatedSubject = (taxInvoiceForm.emailSubjectTemplate || 'Tax Invoice & Payment Confirmation: [InvoiceNumber]')
                        .replace(/\[InvoiceNumber\]/g, invNumber)
                        .replace(/\[YardName\]/g, sampleSeller.companyName)
                        .replace(/\[PlanName\]/g, pricing.name || 'Equipment Plan');

                      const simulatedBody = (taxInvoiceForm.emailBodyTemplate || '')
                        .replace(/\[SellerContact\]/g, sampleSeller.contactName)
                        .replace(/\[YardName\]/g, sampleSeller.companyName)
                        .replace(/\[TotalAmount\]/g, `R${amount.toFixed(2)}`)
                        .replace(/\[PlanName\]/g, pricing.name || 'Equipment Plan')
                        .replace(/\[InvoiceNumber\]/g, invNumber)
                        .replace(/\[VatAmount\]/g, `R${vatZar.toFixed(2)}`);

                      return (
                        <div className="space-y-4">
                          {/* Financial Breakdown Pill */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">Selected Plan</span>
                              <span className="font-bold text-white text-sm">{pricing.name}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Amount (Incl. VAT)</span>
                              <span className="font-black text-amber-400 text-base">R{amount}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">VAT Amount ({vatRate}%)</span>
                              <span className="font-mono text-emerald-400 font-bold">R{vatZar.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">Exclusive Subtotal</span>
                              <span className="font-mono text-slate-300">R{(amount - vatZar).toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Simulated Email Client Container */}
                          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-inner">
                            {/* Email Header */}
                            <div className="space-y-1.5 border-b border-slate-800 pb-3 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500 font-bold w-14">From:</span>
                                <span className="text-slate-200 font-medium">Part-Smart ZA Accounts &lt;{taxInvoiceForm.billingContactEmail || 'accounts@partsmart.co.za'}&gt;</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500 font-bold w-14">To:</span>
                                <span className="text-slate-200 font-medium">{sampleSeller.contactName} &lt;{sampleSeller.email}&gt;</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500 font-bold w-14">Subject:</span>
                                <span className="text-amber-400 font-bold">{simulatedSubject}</span>
                              </div>
                            </div>

                            {/* Email Body */}
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-sans text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                              {simulatedBody}
                            </div>

                            {/* Attached PDF Badge */}
                            {taxInvoiceForm.autoAttachToConfirmationEmail && (
                              <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
                                    PDF
                                  </div>
                                  <div>
                                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                      <span>{invNumber}.pdf</span>
                                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                                        SARS Tax Invoice
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      Compliant electronic tax invoice (Section 20(4))
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadSampleTaxPdf(sampleSeller)}
                                    disabled={isDownloadingTaxPdf}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>{isDownloadingTaxPdf ? 'Generating PDF...' : 'Download Sample PDF'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openTaxInvoiceModalForSeller(sampleSeller)}
                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Interactive View</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Bottom Save & Apply Bar */}
                  <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-slate-400">
                      <strong className="text-white">Ready to save?</strong> These tax and invoicing rules will immediately apply to all seller payment receipts, verification emails, and portal downloads.
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveTaxInvoiceSettings()}
                      className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save & Apply All Tax Invoice Settings</span>
                    </button>
                  </div>

                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB: REVENUE TRENDS & ANALYTICS DATA VISUALIZATION */}
              {/* ========================================================================= */}
              {adminTab === 'analytics' && (
                <div className="space-y-6 max-w-6xl mx-auto">
                  <SubscriptionRevenueChart
                    sellers={sellers}
                    subscriptionPlans={plansForm}
                    getPlanEffectivePricing={getPlanEffectivePricing}
                  />
                </div>
              )}

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* IN-APP CONFIRMATION MODALS (Guaranteed to work without browser popups) */}
        {/* ========================================================================= */}

        {/* 1. SELLER DELETION CONFIRMATION MODAL */}
        {sellerPendingDelete && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-white">Permanently Delete Seller?</h3>
                <p className="text-xs text-slate-400">
                  This action will permanently delete the seller account and remove all their inventory listings from Part-Smart-ZA.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Company / Yard:</span>
                  <span className="font-bold text-white">{sellerPendingDelete.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="text-slate-200">{sellerPendingDelete.city}, {sellerPendingDelete.province}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contact:</span>
                  <span className="text-slate-200">{sellerPendingDelete.contactName} ({sellerPendingDelete.phone})</span>
                </div>
                <div className="flex justify-between border-t border-slate-800/80 pt-2">
                  <span className="text-slate-400">Associated Listings:</span>
                  <span className="font-bold text-rose-400">
                    {inventory.filter((item) => item.sellerId === sellerPendingDelete.id).length} parts will be removed
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSellerPendingDelete(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeConfirmDeleteSeller}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-950/50 flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Seller</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. SINGLE INVENTORY ITEM DELETION CONFIRMATION MODAL */}
        {itemPendingDelete && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-white">Delete Inventory Listing?</h3>
                <p className="text-xs text-slate-400">
                  This part will be permanently removed from the search engine and all buyers.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-white">{itemPendingDelete.title}</div>
                <div className="flex justify-between text-slate-400">
                  <span>Make / Model:</span>
                  <span className="text-slate-200">{itemPendingDelete.make} {itemPendingDelete.model} ({itemPendingDelete.year})</span>
                </div>
                {itemPendingDelete.partNumber && (
                  <div className="flex justify-between text-slate-400">
                    <span>Part / OEM:</span>
                    <span className="text-amber-400 font-mono">#{itemPendingDelete.partNumber}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Seller:</span>
                  <span className="text-slate-200">{itemPendingDelete.sellerName}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setItemPendingDelete(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeConfirmDeleteSingleItem}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Part</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. BATCH INVENTORY DELETION CONFIRMATION MODAL */}
        {batchDeletePending && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-white">Batch Delete {selectedItemIds.length} Listings?</h3>
                <p className="text-xs text-slate-400">
                  Are you sure you want to permanently delete all {selectedItemIds.length} selected inventory listings from Part-Smart-ZA?
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBatchDeletePending(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeConfirmBatchDelete}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete All ({selectedItemIds.length})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. SELLER TAX INVOICE PREVIEW & PRINT MODAL */}
        {activeTaxModalPayment && (
          <TaxInvoiceModal
            payment={activeTaxModalPayment}
            seller={activeTaxModalSeller}
            ownerSettings={{
              ...ownerSettings,
              taxInvoiceSettings: taxInvoiceForm
            }}
            onClose={() => {
              setActiveTaxModalPayment(null);
              setActiveTaxModalSeller(null);
            }}
          />
        )}

      </div>
    </div>
  );
};

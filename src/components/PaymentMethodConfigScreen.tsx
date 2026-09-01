import React, { useState, useMemo, useEffect } from 'react';
import {
  CreditCard,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Copy,
  Check,
  Send,
  ShieldCheck,
  Zap,
  Bell,
  Calendar,
  Lock,
  ArrowRight,
  Sparkles,
  Smartphone,
  Info,
  RefreshCw,
  FileText,
  Download,
  Printer,
  History,
  Receipt,
  QrCode,
  Mail
} from 'lucide-react';
import { Seller, OwnerSettings, SubscriptionPlan, SubscriptionPlanId, SubscriptionPaymentRecord } from '../types';
import { TaxInvoiceModal } from './TaxInvoiceModal';
import { downloadInvoicePdf } from '../lib/pdfInvoiceGenerator';

interface PaymentMethodConfigScreenProps {
  seller: Seller;
  ownerSettings: OwnerSettings;
  subscriptionPlans: SubscriptionPlan[];
  getPlanEffectivePricing: (planId: SubscriptionPlanId) => {
    name: string;
    effectivePrice: number;
    originalPrice: number;
    discountPercentage: number;
    isDiscountActive: boolean;
    promotionalBadge?: string;
    savingsZar: number;
  };
  onSubmitEftProof: (reference: string) => void;
  onNavigateToOverview?: () => void;
  onNavigateToPlans?: () => void;
}

export const PaymentMethodConfigScreen: React.FC<PaymentMethodConfigScreenProps> = ({
  seller,
  ownerSettings,
  subscriptionPlans,
  getPlanEffectivePricing,
  onSubmitEftProof,
  onNavigateToOverview,
  onNavigateToPlans
}) => {
  const effectivePricing = useMemo(() => {
    return getPlanEffectivePricing(seller.planId);
  }, [seller.planId, getPlanEffectivePricing]);

  // Payment method selection: 'eft' | 'card' | 'whatsapp'
  const [selectedMethod, setSelectedMethod] = useState<'eft' | 'card' | 'whatsapp'>('eft');

  // EFT form state
  const [eftRefInput, setEftRefInput] = useState(seller.lastPaymentRef || '');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // Card configuration state (simulated PCI-compliant saved method)
  const [cardDetails, setCardDetails] = useState({
    cardholderName: seller.contactName || seller.companyName,
    cardNumber: '•••• •••• •••• 4289',
    expiryDate: '08/28',
    cvv: '•••',
    autoRenew: true
  });
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [isProcessingCardPayment, setIsProcessingCardPayment] = useState(false);

  // Notification preferences
  const [notifyPreferences, setNotifyPreferences] = useState({
    email7Days: true,
    urgent3DaysAlert: true,
    whatsappRenewalPing: true,
    smsReceipt: true
  });
  const [savedPrefsNotice, setSavedPrefsNotice] = useState(false);

  // Historical Payment Records state
  const [payments, setPayments] = useState<SubscriptionPaymentRecord[]>(() => {
    const storageKey = `part_smart_subscription_payments_${seller.id}`;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    // Default historical invoices for seller records
    const pricing = getPlanEffectivePricing(seller.planId);
    const amount = pricing.effectivePrice;
    const vatRate = ownerSettings.taxInvoiceSettings?.vatRatePercent || 15;
    const vatZar = Math.round((amount * vatRate / (100 + vatRate)) * 100) / 100;
    const prefix = ownerSettings.taxInvoiceSettings?.invoiceNumberPrefix || 'INV-PSZA-';
    
    const now = new Date();
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const prevMonth = new Date(now);
    prevMonth.setMonth(prevMonth.getMonth() - 2);

    const initialList: SubscriptionPaymentRecord[] = [
      {
        id: `pay-${seller.id}-1`,
        sellerId: seller.id,
        sellerName: seller.companyName,
        invoiceNumber: `${prefix}1048`,
        paymentDate: seller.paymentProofSubmittedAt || lastMonth.toISOString(),
        billingCycleStart: lastMonth.toISOString(),
        billingCycleEnd: seller.subscriptionDueDate || now.toISOString(),
        planId: seller.planId,
        planName: pricing.name || 'Equipment Plan',
        amountZar: amount,
        vatZar: vatZar,
        paymentMethod: 'Instant EFT',
        reference: seller.lastPaymentRef || `EFT-891240-${seller.id.slice(0, 4).toUpperCase()}`,
        status: seller.subscriptionStatus === 'active' ? 'verified' : 'pending',
        taxInvoiceAttached: true,
        emailDispatchedAt: lastMonth.toISOString(),
        emailRecipient: seller.email,
        vatRatePercent: vatRate,
        supplierVatNumber: ownerSettings.taxInvoiceSettings?.vatRegistrationNumber || '4980123984'
      },
      {
        id: `pay-${seller.id}-2`,
        sellerId: seller.id,
        sellerName: seller.companyName,
        invoiceNumber: `${prefix}1035`,
        paymentDate: prevMonth.toISOString(),
        billingCycleStart: prevMonth.toISOString(),
        billingCycleEnd: lastMonth.toISOString(),
        planId: seller.planId,
        planName: pricing.name || 'Equipment Plan',
        amountZar: amount,
        vatZar: vatZar,
        paymentMethod: 'Instant EFT',
        reference: `EFT-776210-${seller.id.slice(0, 4).toUpperCase()}`,
        status: 'verified',
        taxInvoiceAttached: true,
        emailDispatchedAt: prevMonth.toISOString(),
        emailRecipient: seller.email,
        vatRatePercent: vatRate,
        supplierVatNumber: ownerSettings.taxInvoiceSettings?.vatRegistrationNumber || '4980123984'
      }
    ];

    try {
      localStorage.setItem(storageKey, JSON.stringify(initialList));
    } catch {}

    return initialList;
  });

  const [activeModalPayment, setActiveModalPayment] = useState<SubscriptionPaymentRecord | null>(null);
  const [downloadingPaymentId, setDownloadingPaymentId] = useState<string | null>(null);

  // Sync payments if localStorage changes
  useEffect(() => {
    const storageKey = `part_smart_subscription_payments_${seller.id}`;
    const syncPayments = () => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setPayments(parsed);
        }
      } catch {}
    };
    syncPayments();
    window.addEventListener('storage', syncPayments);
    return () => window.removeEventListener('storage', syncPayments);
  }, [seller.id]);

  const handleDownloadPdf = async (paymentRecord: SubscriptionPaymentRecord) => {
    try {
      setDownloadingPaymentId(paymentRecord.id);
      await downloadInvoicePdf({
        seller,
        payment: paymentRecord,
        ownerSettings
      });
      setFeedbackNotice({
        type: 'success',
        message: `Tax Invoice PDF (${paymentRecord.invoiceNumber}) downloaded successfully for your accounting records!`
      });
      setTimeout(() => setFeedbackNotice(null), 4000);
    } catch (err) {
      console.error('Error downloading invoice:', err);
    } finally {
      setDownloadingPaymentId(null);
    }
  };

  // Compute days remaining and expiry status
  const cycleInfo = useMemo(() => {
    const now = new Date();
    const dueDate = seller.subscriptionDueDate ? new Date(seller.subscriptionDueDate) : new Date(now.getTime() + 15 * 86400000);
    const diffMs = dueDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    const isOverdue = seller.subscriptionStatus === 'unpaid' || daysRemaining <= 0;
    const isExpiringSoon = daysRemaining <= 3 && daysRemaining > 0;
    const isPending = seller.subscriptionStatus === 'pending_verification';

    return {
      dueDate,
      daysRemaining,
      isOverdue,
      isExpiringSoon,
      isPending,
      formattedDueDate: dueDate.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
    };
  }, [seller.subscriptionDueDate, seller.subscriptionStatus]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setFeedbackNotice({
      type: 'success',
      message: `Copied ${fieldName} to clipboard: ${text}`
    });
    setTimeout(() => {
      setCopiedField(null);
      setFeedbackNotice(null);
    }, 3000);
  };

  const handleEftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eftRefInput.trim()) return;

    onSubmitEftProof(eftRefInput.trim());
    setFeedbackNotice({
      type: 'success',
      message: `EFT Reference "${eftRefInput.trim()}" submitted for verification. Your listing visibility is protected!`
    });
    setTimeout(() => setFeedbackNotice(null), 5000);
  };

  const handleProcessCardPayment = () => {
    setIsProcessingCardPayment(true);
    setTimeout(() => {
      setIsProcessingCardPayment(false);
      const generatedRef = `CARD-${Math.floor(100000 + Math.random() * 900000)}-${seller.id.toUpperCase()}`;
      onSubmitEftProof(generatedRef);
      setFeedbackNotice({
        type: 'success',
        message: `Card payment of R${effectivePricing.effectivePrice} settled successfully! Authorization code: ${generatedRef}`
      });
    }, 1500);
  };

  const handleSavePreferences = () => {
    setSavedPrefsNotice(true);
    setFeedbackNotice({
      type: 'success',
      message: 'Renewal alert notification preferences updated successfully.'
    });
    setTimeout(() => {
      setSavedPrefsNotice(false);
      setFeedbackNotice(null);
    }, 3500);
  };

  const generatedEftRef = `PS-${seller.companyName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}-${new Date().toLocaleDateString('en-ZA', { month: 'short' }).toUpperCase()}`;

  return (
    <div className="space-y-6">
      
      {/* Toast Notice */}
      {feedbackNotice && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-xl animate-fadeIn ${
            feedbackNotice.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-blue-950/80 border-blue-500/50 text-blue-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-900 rounded-lg cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. TOP HERO: SUBSCRIPTION STANDING & EXPIRY STATUS */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-400" />
                Payment Method & Billing Configuration
              </span>

              {cycleInfo.isExpiringSoon ? (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  RENEWAL DUE IN {cycleInfo.daysRemaining} DAY{cycleInfo.daysRemaining === 1 ? '' : 'S'}
                </span>
              ) : cycleInfo.isOverdue ? (
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/50 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  SUBSCRIPTION OVERDUE / UNPAID
                </span>
              ) : cycleInfo.isPending ? (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  EFT PAYMENT PENDING VERIFICATION
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ACTIVE & GOOD STANDING
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {effectivePricing.name} Plan
              </h2>
              <span className="text-amber-400 text-lg font-black">
                R{effectivePricing.effectivePrice}
                <span className="text-xs text-slate-400 font-normal"> / month (incl. VAT)</span>
              </span>
              {effectivePricing.isDiscountActive && (
                <span className="bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px] font-black px-2 py-0.5 rounded-lg">
                  {effectivePricing.promotionalBadge || `${effectivePricing.discountPercentage}% PROMO ACTIVE`}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Yard: <strong className="text-white">{seller.companyName}</strong> • Due Date: <strong className="text-amber-400">{cycleInfo.formattedDueDate}</strong> • Default Reference: <span className="font-mono text-emerald-400 font-bold">{seller.lastPaymentRef || generatedEftRef}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            {onNavigateToOverview && (
              <button
                id="btn-goto-overview-from-payment"
                type="button"
                onClick={onNavigateToOverview}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>View Tax Invoices</span>
              </button>
            )}
            {onNavigateToPlans && (
              <button
                id="btn-goto-plans-from-payment"
                type="button"
                onClick={onNavigateToPlans}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Change Tier</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* 2. PAYMENT METHOD SELECTOR TABS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Select Primary Payment Method</span>
            </h3>
            <p className="text-xs text-slate-400">Choose how your yard settles monthly advertising subscriptions</p>
          </div>
          <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" /> Instant Reconciliation & SARS Tax Receipts
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Method 1: Direct EFT */}
          <button
            id="btn-method-eft"
            type="button"
            onClick={() => setSelectedMethod('eft')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              selectedMethod === 'eft'
                ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              {selectedMethod === 'eft' && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  SELECTED
                </span>
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Direct Bank EFT / Wire</h4>
              <p className="text-[11px] text-slate-400 leading-snug">FNB Business Cheque Account with proof of payment reference upload.</p>
            </div>
            <span className="text-[10px] font-bold text-amber-400">RECOMMENDED FOR YARDS</span>
          </button>

          {/* Method 2: Automated Card / Instant EFT */}
          <button
            id="btn-method-card"
            type="button"
            onClick={() => setSelectedMethod('card')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              selectedMethod === 'card'
                ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <CreditCard className="w-4 h-4" />
              </div>
              {selectedMethod === 'card' && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  SELECTED
                </span>
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Card & Auto-Renewal</h4>
              <p className="text-[11px] text-slate-400 leading-snug">Visa / Mastercard debit or credit card with automated cycle renewal.</p>
            </div>
            <span className="text-[10px] font-bold text-blue-400">ZERO DOWNTIME GUARANTEE</span>
          </button>

          {/* Method 3: WhatsApp Accounts Concierge */}
          <button
            id="btn-method-whatsapp"
            type="button"
            onClick={() => setSelectedMethod('whatsapp')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              selectedMethod === 'whatsapp'
                ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Smartphone className="w-4 h-4" />
              </div>
              {selectedMethod === 'whatsapp' && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  SELECTED
                </span>
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">WhatsApp Accounts Desk</h4>
              <p className="text-[11px] text-slate-400 leading-snug">Direct line to Part-Smart ZA billing team for customized trade invoices.</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-400">OFFICIAL SUPPORT CHANNEL</span>
          </button>

        </div>
      </div>

      {/* 3. METHOD CONTENT CONFIGURATION PANELS */}

      {/* PANEL 1: DIRECT EFT & APP OWNER BANKING DETAILS */}
      {selectedMethod === 'eft' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          
          {/* Left: App Owner FNB Banking Details */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-950 p-6 rounded-3xl border-2 border-amber-500/40 space-y-4 shadow-xl">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Official App Owner Banking Details</h3>
                    <p className="text-[11px] text-slate-400">Transfer monthly fees directly to Part-Smart ZA (Pty) Ltd</p>
                  </div>
                </div>
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded">
                  FNB EFT
                </span>
              </div>

              {/* Banking Grid with one-click copy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                
                {/* Bank Name */}
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Bank</span>
                    <span className="font-bold text-white">{ownerSettings.bankingDetails.bankName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(ownerSettings.bankingDetails.bankName, 'Bank Name')}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                    title="Copy Bank Name"
                  >
                    {copiedField === 'Bank Name' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Account Holder */}
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Account Holder</span>
                    <span className="font-bold text-white truncate max-w-[140px] block">{ownerSettings.bankingDetails.accountHolder}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(ownerSettings.bankingDetails.accountHolder, 'Account Holder')}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                    title="Copy Account Holder"
                  >
                    {copiedField === 'Account Holder' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Account Number */}
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between sm:col-span-2 bg-gradient-to-r from-amber-500/5 via-slate-900 to-slate-900">
                  <div>
                    <span className="text-[10px] text-amber-400 uppercase font-extrabold block">Account Number (Cheque)</span>
                    <span className="font-mono font-black text-amber-300 text-base">{ownerSettings.bankingDetails.accountNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(ownerSettings.bankingDetails.accountNumber, 'Account Number')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    title="Copy Account Number"
                  >
                    {copiedField === 'Account Number' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Number</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Branch Code */}
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Branch Code</span>
                    <span className="font-mono font-bold text-white">{ownerSettings.bankingDetails.branchCode} (Universal)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(ownerSettings.bankingDetails.branchCode, 'Branch Code')}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                    title="Copy Branch Code"
                  >
                    {copiedField === 'Branch Code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Beneficiary Reference Generator */}
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Your Custom Reference</span>
                    <span className="font-mono font-bold text-emerald-400">{generatedEftRef}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedEftRef, 'EFT Reference')}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                    title="Copy Reference"
                  >
                    {copiedField === 'EFT Reference' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-xs text-slate-300 space-y-1">
                <span className="font-bold text-amber-400 block flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Banking Note:
                </span>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  {ownerSettings.bankingDetails.additionalInstructions}
                </p>
              </div>

            </div>
          </div>

          {/* Right: Submit Proof & Verification Status */}
          <div className="lg:col-span-5 space-y-4">
            
            <form onSubmit={handleEftSubmit} className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
                  <Send className="w-4 h-4" /> Submit EFT Payment Proof Reference
                </h4>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Enter your bank reference code or transaction ID below after making the transfer to verify your cycle renewal.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-300 font-semibold block">EFT Payment Reference / POP Code</label>
                <div className="relative">
                  <input
                    id="input-eft-ref"
                    type="text"
                    value={eftRefInput}
                    onChange={(e) => setEftRefInput(e.target.value)}
                    placeholder={`e.g. ${generatedEftRef} or FNB-89210`}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                  {eftRefInput && (
                    <button
                      type="button"
                      onClick={() => setEftRefInput('')}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-white text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <button
                id="btn-submit-eft-proof"
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Submit Reference & Renew Listing</span>
              </button>

              {seller.lastPaymentRef && (
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Last Registered Reference:</span>
                  <span className="font-mono font-bold text-emerald-400 block">{seller.lastPaymentRef}</span>
                  <span className="text-[10px] text-slate-500">
                    Status: {seller.subscriptionStatus === 'active' ? 'Verified by Admin' : 'Pending Reconciliation'}
                  </span>
                </div>
              )}
            </form>

            {/* Support Desk Reminder */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
              <span className="font-bold text-slate-200 block flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Continuous Listing Protection
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Submitting your EFT reference instantly protects your heavy equipment & auto parts listings from expiry de-indexing while the billing team reconciles bank feeds.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* PANEL 2: AUTOMATED CARD & INSTANT EFT GATEWAY */}
      {selectedMethod === 'card' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Saved Payment Card & Auto-Debit</h3>
                    <p className="text-[11px] text-slate-400">Manage credit/debit cards for uninterrupted listing uptime</p>
                  </div>
                </div>
                <span className="bg-blue-500/20 text-blue-300 text-[10px] font-black px-2 py-0.5 rounded border border-blue-500/30">
                  PCI-DSS SECURE
                </span>
              </div>

              {/* Visual Card Representation */}
              <div className="bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-950 p-5 rounded-2xl border border-blue-500/30 text-white space-y-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs tracking-wider text-slate-400">PART-SMART TRADE CARD</span>
                  <span className="font-black text-amber-400 text-sm tracking-widest">VISA / MC</span>
                </div>

                <div className="font-mono text-lg font-bold tracking-widest text-slate-200">
                  {cardDetails.cardNumber}
                </div>

                <div className="flex items-end justify-between text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">Cardholder</span>
                    <span className="font-bold text-white">{cardDetails.cardholderName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 uppercase block">Expires</span>
                    <span className="font-mono font-bold text-white">{cardDetails.expiryDate}</span>
                  </div>
                </div>
              </div>

              {/* Auto Renew Switch */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-white block flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Automated Monthly Cycle Renewal
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Automatically charge R{effectivePricing.effectivePrice} on the due date ({cycleInfo.formattedDueDate}) to avoid manual EFT submission.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCardDetails(prev => ({ ...prev, autoRenew: !prev.autoRenew }))}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    cardDetails.autoRenew ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-slate-950 absolute top-1 transition-transform ${
                      cardDetails.autoRenew ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Instant Test Settle Button */}
              <div className="space-y-2">
                <button
                  id="btn-process-card-settlement"
                  type="button"
                  onClick={handleProcessCardPayment}
                  disabled={isProcessingCardPayment}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 disabled:opacity-60"
                >
                  {isProcessingCardPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authorizing Secure Transaction with Bank...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Settle R{effectivePricing.effectivePrice} with Card Now</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-slate-500 text-center">
                  Protected by 256-bit bank grade encryption. A South African Tax Invoice will be generated automatically.
                </p>
              </div>

            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <h4 className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-400" /> Update Card Billing Information
              </h4>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardDetails.cardholderName}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, cardholderName: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Card Number</label>
                  <input
                    type="text"
                    value={cardDetails.cardNumber}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                    placeholder="4532 •••• •••• ••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      value={cardDetails.expiryDate}
                      onChange={(e) => setCardDetails(prev => ({ ...prev, expiryDate: e.target.value }))}
                      placeholder="MM/YY"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">CVV</label>
                    <input
                      type="password"
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                      placeholder="•••"
                      maxLength={4}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFeedbackNotice({
                      type: 'success',
                      message: 'Payment card details saved securely for future auto-renewals.'
                    });
                  }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
                >
                  Save Card Details
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* PANEL 3: WHATSAPP ACCOUNTS CONCIERGE */}
      {selectedMethod === 'whatsapp' && (
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Part-Smart ZA Accounts & Billing Concierge</h3>
                <p className="text-xs text-slate-400">Direct WhatsApp support for trade accounts, custom debit orders, or invoice assistance</p>
              </div>
            </div>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-black px-3 py-1 rounded-full border border-emerald-500/30">
              OPEN 07:30 - 17:00
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Billing Enquiries Email</span>
              <span className="font-mono text-amber-400 font-bold text-sm block">accounts@partsmart.co.za</span>
              <p className="text-[11px] text-slate-400">Send proof of payments, PO numbers, or monthly statement reconciliation requests.</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Direct Accounts Line</span>
              <span className="font-mono text-emerald-400 font-bold text-sm block">+27 11 892 4000</span>
              <p className="text-[11px] text-slate-400">Dedicated accounts support desk for commercial scrapyards and heavy plant suppliers.</p>
            </div>
          </div>

          <div className="pt-2">
            <a
              href={`https://wa.me/27824591102?text=${encodeURIComponent(
                `Hi Part-Smart Accounts Team,\n\nI would like assistance with my yard subscription payment:\n• Yard: ${seller.companyName}\n• Current Plan: ${effectivePricing.name} (R${effectivePricing.effectivePrice}/mo)\n• Due Date: ${cycleInfo.formattedDueDate}\n• Reference: ${seller.lastPaymentRef || generatedEftRef}\n\nPlease confirm our trade invoice status.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Chat to Accounts Team on WhatsApp Now</span>
            </a>
          </div>
        </div>
      )}

      {/* 4. RENEWAL NOTIFICATION & EXPIRY ALERT PREFERENCES */}
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-white">Subscription Expiry & Renewal Alert Settings</h3>
          </div>
          <span className="text-[10px] text-slate-500">Configured for {seller.email || 'Registered Email'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          
          <label className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 cursor-pointer hover:border-slate-700">
            <div>
              <span className="font-bold text-white block">7-Day Prior Renewal Notice</span>
              <span className="text-[11px] text-slate-400">Receive advance billing invoice reminder before cycle closes.</span>
            </div>
            <input
              type="checkbox"
              checked={notifyPreferences.email7Days}
              onChange={(e) => setNotifyPreferences(prev => ({ ...prev, email7Days: e.target.checked }))}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </label>

          <label className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 cursor-pointer hover:border-slate-700">
            <div>
              <span className="font-bold text-amber-300 block">3-Day Urgent Visual Alert Banner</span>
              <span className="text-[11px] text-slate-400">High-priority warning banner in Seller Portal and immediate renewal link.</span>
            </div>
            <input
              type="checkbox"
              checked={notifyPreferences.urgent3DaysAlert}
              onChange={(e) => setNotifyPreferences(prev => ({ ...prev, urgent3DaysAlert: e.target.checked }))}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </label>

          <label className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 cursor-pointer hover:border-slate-700">
            <div>
              <span className="font-bold text-emerald-300 block">WhatsApp Renewal Ping</span>
              <span className="text-[11px] text-slate-400">Direct WhatsApp notification with quick EFT reference to your phone.</span>
            </div>
            <input
              type="checkbox"
              checked={notifyPreferences.whatsappRenewalPing}
              onChange={(e) => setNotifyPreferences(prev => ({ ...prev, whatsappRenewalPing: e.target.checked }))}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </label>

          <label className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 cursor-pointer hover:border-slate-700">
            <div>
              <span className="font-bold text-slate-200 block">Electronic Tax Invoice Receipts</span>
              <span className="text-[11px] text-slate-400">Automatic PDF receipt generation on every settled transaction.</span>
            </div>
            <input
              type="checkbox"
              checked={notifyPreferences.smsReceipt}
              onChange={(e) => setNotifyPreferences(prev => ({ ...prev, smsReceipt: e.target.checked }))}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </label>

        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleSavePreferences}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Save Alert Preferences</span>
          </button>

          {savedPrefsNotice && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Preferences saved!
            </span>
          )}
        </div>
      </div>

      {/* 5. HISTORICAL PAYMENT LIST & TAX/VAT INVOICE RECEIPTS */}
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                Historical Payment Records & Tax Invoices
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  {payments.length} Invoices
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Official Section 20(4) VAT Act electronic receipts & payment confirmation records for {seller.companyName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              SARS VAT Registered ({ownerSettings.taxInvoiceSettings?.vatRegistrationNumber || '4980123984'})
            </span>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-xs font-bold text-slate-400">No payment receipts on record yet</div>
            <p className="text-[11px] text-slate-500">
              Your automated SARS-compliant tax invoices will appear here immediately once your first subscription payment is settled.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => {
              const exVat = p.amountZar - p.vatZar;
              const isDownloading = downloadingPaymentId === p.id;

              return (
                <div
                  key={p.id}
                  className="bg-slate-900/90 hover:bg-slate-900 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-amber-400 text-xs">
                        {p.invoiceNumber}
                      </span>

                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> {p.status === 'verified' ? 'Paid & Reconciled' : 'Pending Verification'}
                      </span>

                      <span className="text-[11px] text-slate-300 font-semibold">
                        {p.planName}
                      </span>

                      {p.taxInvoiceAttached !== false && (
                        <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] px-1.5 py-0.2 rounded font-medium flex items-center gap-1">
                          <Mail className="w-2.5 h-2.5" /> Email Attached
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>Date: <strong className="text-slate-200">{new Date(p.paymentDate).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}</strong></span>
                      <span>&bull;</span>
                      <span>Ref: <strong className="text-slate-200 font-mono">{p.reference}</strong></span>
                      <span>&bull;</span>
                      <span>Method: <strong className="text-slate-200">{p.paymentMethod}</strong></span>
                      <span>&bull;</span>
                      <span>Cycle: <strong className="text-slate-300">{new Date(p.billingCycleStart).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })} - {new Date(p.billingCycleEnd).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
                    </div>
                  </div>

                  {/* Financial Breakdown & Action Buttons */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                    <div className="text-left md:text-right">
                      <div className="text-sm font-black text-white">
                        R{p.amountZar.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Excl: R{exVat.toFixed(2)} + 15% VAT (R{p.vatZar.toFixed(2)})
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Download PDF Receipt Icon/Button */}
                      <button
                        type="button"
                        id={`btn-download-pdf-${p.id}`}
                        onClick={() => handleDownloadPdf(p)}
                        disabled={isDownloading}
                        className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                        title="Download clean print-ready PDF Tax Invoice for your records"
                      >
                        {isDownloading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">Download PDF Receipt</span>
                        <span className="sm:hidden">PDF</span>
                      </button>

                      {/* View Interactive Modal Button */}
                      <button
                        type="button"
                        id={`btn-view-invoice-${p.id}`}
                        onClick={() => setActiveModalPayment(p)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl transition-colors cursor-pointer border border-slate-700"
                        title="View SARS Tax Invoice details & email confirmation"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RENDER FULL TAX INVOICE MODAL WHEN TRIGGERED */}
      {activeModalPayment && (
        <TaxInvoiceModal
          seller={seller}
          payment={activeModalPayment}
          ownerSettings={ownerSettings}
          isOpen={true}
          onClose={() => setActiveModalPayment(null)}
        />
      )}

    </div>
  );
};

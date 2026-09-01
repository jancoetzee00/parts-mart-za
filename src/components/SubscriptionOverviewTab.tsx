import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  Send,
  Copy,
  Check,
  Zap,
  ArrowRight,
  ShieldCheck,
  Star,
  Layers,
  Flame,
  Printer,
  Download,
  FileText,
  TrendingUp,
  Receipt,
  ExternalLink,
  ChevronRight,
  Sliders,
  DollarSign,
  Building2,
  CalendarCheck,
  RefreshCw,
  Info,
  X
} from 'lucide-react';
import { Seller, SubscriptionPlan, SubscriptionPaymentRecord, OwnerSettings } from '../types';
import { downloadInvoicePdf } from '../lib/pdfInvoiceGenerator';

interface SubscriptionOverviewTabProps {
  seller: Seller;
  ownerSettings: OwnerSettings;
  subscriptionPlans: SubscriptionPlan[];
  getPlanEffectivePricing: (planInput: string | SubscriptionPlan) => any;
  onSubmitEftProof: (reference: string) => void;
  onNavigateToPlans: () => void;
  onNavigateToPaymentConfig?: () => void;
  onSelectPlanUpgrade?: (planId: string) => void;
}

// Generate realistic historical payments for sellers if not in localStorage
function getInitialPaymentsForSeller(seller: Seller, effectivePrice: number): SubscriptionPaymentRecord[] {
  const planName = seller.planId === 'enterprise' || seller.planId === 'dealer_unlimited'
    ? 'Enterprise Unlimited Dealer'
    : seller.planId === 'pro'
    ? 'Pro Equipment & Spares Yard'
    : 'Basic Yard Starter';

  const baseAmount = effectivePrice > 0 ? effectivePrice : (seller.planId === 'enterprise' ? 1850 : seller.planId === 'pro' ? 850 : 450);
  const vat = Math.round((baseAmount * 15 / 115) * 100) / 100;

  // Derive historical records based on seller id
  const payments: SubscriptionPaymentRecord[] = [];

  // August 2026 (Recent)
  if (seller.subscriptionStatus === 'active' || seller.lastPaymentRef) {
    payments.push({
      id: `pay-${seller.id}-2026-08`,
      sellerId: seller.id,
      sellerName: seller.companyName,
      invoiceNumber: `INV-2026-08-${seller.id.replace(/\D/g, '') || '101'}`,
      paymentDate: '2026-08-01T08:30:00.000Z',
      billingCycleStart: '2026-08-01T00:00:00.000Z',
      billingCycleEnd: '2026-09-01T00:00:00.000Z',
      planId: seller.planId,
      planName,
      amountZar: baseAmount,
      vatZar: vat,
      paymentMethod: 'Instant EFT',
      reference: seller.lastPaymentRef || `PS-${seller.companyName.substring(0, 8).toUpperCase()}-AUG26`,
      status: seller.subscriptionStatus === 'pending_verification' ? 'pending' : 'verified',
      notes: 'Monthly yard advertising subscription with featured province placement.'
    });
  }

  // July 2026
  payments.push({
    id: `pay-${seller.id}-2026-07`,
    sellerId: seller.id,
    sellerName: seller.companyName,
    invoiceNumber: `INV-2026-07-${seller.id.replace(/\D/g, '') || '098'}`,
    paymentDate: '2026-07-01T09:14:00.000Z',
    billingCycleStart: '2026-07-01T00:00:00.000Z',
    billingCycleEnd: '2026-08-01T00:00:00.000Z',
    planId: seller.planId,
    planName,
    amountZar: baseAmount,
    vatZar: vat,
    paymentMethod: 'EFT',
    reference: `FNB-EFT-${seller.id.toUpperCase()}-JUL26`,
    status: 'verified',
    notes: 'Monthly yard advertising subscription.'
  });

  // June 2026
  payments.push({
    id: `pay-${seller.id}-2026-06`,
    sellerId: seller.id,
    sellerName: seller.companyName,
    invoiceNumber: `INV-2026-06-${seller.id.replace(/\D/g, '') || '085'}`,
    paymentDate: '2026-06-01T11:22:00.000Z',
    billingCycleStart: '2026-06-01T00:00:00.000Z',
    billingCycleEnd: '2026-07-01T00:00:00.000Z',
    planId: seller.planId,
    planName,
    amountZar: baseAmount,
    vatZar: vat,
    paymentMethod: 'EFT',
    reference: `PS-REF-JUN26-${seller.id.toUpperCase()}`,
    status: 'verified',
    notes: 'Monthly yard advertising subscription.'
  });

  // May 2026
  payments.push({
    id: `pay-${seller.id}-2026-05`,
    sellerId: seller.id,
    sellerName: seller.companyName,
    invoiceNumber: `INV-2026-05-${seller.id.replace(/\D/g, '') || '072'}`,
    paymentDate: '2026-05-01T14:05:00.000Z',
    billingCycleStart: '2026-05-01T00:00:00.000Z',
    billingCycleEnd: '2026-06-01T00:00:00.000Z',
    planId: seller.planId,
    planName,
    amountZar: baseAmount,
    vatZar: vat,
    paymentMethod: 'Card',
    reference: `CARD-AUTH-MAY26-${seller.id.toUpperCase()}`,
    status: 'verified',
    notes: 'Monthly yard advertising subscription.'
  });

  return payments;
}

export const SubscriptionOverviewTab: React.FC<SubscriptionOverviewTabProps> = ({
  seller,
  ownerSettings,
  subscriptionPlans,
  getPlanEffectivePricing,
  onSubmitEftProof,
  onNavigateToPlans,
  onNavigateToPaymentConfig,
  onSelectPlanUpgrade
}) => {
  // Pricing
  const effectivePricing = useMemo(() => {
    return getPlanEffectivePricing(seller.planId);
  }, [seller.planId, getPlanEffectivePricing]);

  // Payment storage key
  const storageKey = `partsmart_seller_payments_${seller.id}`;

  // Payments State
  const [payments, setPayments] = useState<SubscriptionPaymentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return getInitialPaymentsForSeller(seller, effectivePricing.effectivePrice);
  });

  // Sync if seller changes or if payment proof is submitted
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setPayments(JSON.parse(saved));
      } else {
        const initial = getInitialPaymentsForSeller(seller, effectivePricing.effectivePrice);
        setPayments(initial);
        localStorage.setItem(storageKey, JSON.stringify(initial));
      }
    } catch {
      setPayments(getInitialPaymentsForSeller(seller, effectivePricing.effectivePrice));
    }
  }, [seller.id, storageKey, effectivePricing.effectivePrice]);

  // If seller has a lastPaymentRef that isn't represented in payments, add it as pending
  useEffect(() => {
    if (seller.lastPaymentRef) {
      setPayments(prev => {
        const hasRef = prev.some(p => p.reference === seller.lastPaymentRef);
        if (!hasRef) {
          const planName = effectivePricing.name || 'Pro Equipment Plan';
          const newRecord: SubscriptionPaymentRecord = {
            id: `pay-${seller.id}-${Date.now()}`,
            sellerId: seller.id,
            sellerName: seller.companyName,
            invoiceNumber: `INV-2026-${new Date().getMonth() + 1}-${Math.floor(1000 + Math.random() * 9000)}`,
            paymentDate: seller.paymentProofSubmittedAt || new Date().toISOString(),
            billingCycleStart: new Date().toISOString(),
            billingCycleEnd: seller.subscriptionDueDate,
            planId: seller.planId,
            planName,
            amountZar: effectivePricing.effectivePrice,
            vatZar: Math.round((effectivePricing.effectivePrice * 15 / 115) * 100) / 100,
            paymentMethod: 'Instant EFT',
            reference: seller.lastPaymentRef!,
            status: seller.subscriptionStatus === 'pending_verification' ? 'pending' : 'verified',
            notes: 'Submitted EFT payment reference pending account verification.'
          };
          const updated = [newRecord, ...prev];
          try {
            localStorage.setItem(storageKey, JSON.stringify(updated));
          } catch {}
          return updated;
        }
        return prev;
      });
    }
  }, [seller.lastPaymentRef, seller.paymentProofSubmittedAt, seller.subscriptionStatus]);

  // Quick EFT Submit State inside tab
  const [isEftModalOpen, setIsEftModalOpen] = useState(false);
  const [quickEftRef, setQuickEftRef] = useState('');
  const [copiedBankField, setCopiedBankField] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Selected Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<SubscriptionPaymentRecord | null>(null);

  // PDF Generation State
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);

  // Download PDF Receipt function
  const handleDownloadPdf = async (payment: SubscriptionPaymentRecord) => {
    try {
      setDownloadingPdfId(payment.id);
      await downloadInvoicePdf({
        seller,
        payment,
        ownerSettings
      });
      setDownloadSuccessId(payment.id);
      setNotice(`Tax Invoice & Receipt (${payment.invoiceNumber}) downloaded as print-ready PDF.`);
      setTimeout(() => {
        setDownloadSuccessId(null);
      }, 3500);
    } catch (err) {
      console.error('Error generating PDF receipt:', err);
      setNotice('Could not generate PDF receipt. Please use Print Tax Invoice or try again.');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending'>('all');

  // Format ZAR currency
  const formatZar = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  // ==========================================
  // BILLING CYCLE PROGRESS CALCULATIONS
  // ==========================================
  const cycleMetrics = useMemo(() => {
    const now = new Date();
    // Default or parse due date
    const dueDate = seller.subscriptionDueDate ? new Date(seller.subscriptionDueDate) : new Date(now.getTime() + 15 * 86400000);
    
    // Cycle length is standard 30 days
    const totalCycleDays = 30;
    
    // Cycle start date is 30 days before due date
    const startDate = new Date(dueDate.getTime() - totalCycleDays * 86400000);
    
    // Difference between dueDate and now in milliseconds
    const diffMs = dueDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    // Calculate days elapsed (capped between 0 and totalCycleDays)
    const daysElapsed = Math.max(0, Math.min(totalCycleDays, totalCycleDays - daysRemaining));
    
    // Percent completed (0 to 100)
    let percentElapsed = Math.round((daysElapsed / totalCycleDays) * 100);
    if (daysRemaining <= 0) percentElapsed = 100;
    if (daysRemaining >= totalCycleDays) percentElapsed = 0;
    
    const percentRemaining = Math.max(0, Math.min(100, 100 - percentElapsed));

    // Status category for color coding
    let urgencyLevel: 'healthy' | 'upcoming' | 'critical' | 'expired' = 'healthy';
    if (seller.subscriptionStatus === 'unpaid' || daysRemaining <= 0) {
      urgencyLevel = 'expired';
    } else if (daysRemaining <= 3) {
      urgencyLevel = 'critical';
    } else if (daysRemaining <= 10) {
      urgencyLevel = 'upcoming';
    }

    return {
      dueDate,
      startDate,
      totalCycleDays,
      daysRemaining,
      daysElapsed,
      percentElapsed,
      percentRemaining,
      urgencyLevel
    };
  }, [seller.subscriptionDueDate, seller.subscriptionStatus]);

  // Copy helper
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBankField(fieldName);
    setTimeout(() => setCopiedBankField(null), 2500);
  };

  // Submit quick EFT proof
  const handleQuickEftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEftRef.trim()) return;

    onSubmitEftProof(quickEftRef.trim());
    setIsEftModalOpen(false);
    setNotice(`EFT reference "${quickEftRef.trim()}" submitted successfully! Awaiting owner confirmation.`);
    setQuickEftRef('');
    setTimeout(() => setNotice(null), 4000);
  };

  // Filtered Payments List
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.invoiceNumber.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q) ||
        p.planName.toLowerCase().includes(q) ||
        p.paymentMethod.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [payments, statusFilter, searchQuery]);

  // Total amount spent
  const totalPaidZar = useMemo(() => {
    return payments
      .filter(p => p.status === 'verified')
      .reduce((acc, curr) => acc + curr.amountZar, 0);
  }, [payments]);

  return (
    <div className="space-y-6">
      
      {/* Toast Notice */}
      {notice && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP HEADER: PLAN & BILLING STATUS BANNER */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          {/* Left info: Plan & Yard */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Seller Subscription Overview
              </span>

              {seller.subscriptionStatus === 'active' ? (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ACTIVE & GOOD STANDING
                </span>
              ) : seller.subscriptionStatus === 'pending_verification' ? (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  EFT PAYMENT PENDING VERIFICATION
                </span>
              ) : (
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  SUBSCRIPTION EXPIRED / UNPAID
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {effectivePricing.name} Plan
              </h2>
              <span className="text-amber-400 text-lg font-black">
                {formatZar(effectivePricing.effectivePrice)}
                <span className="text-xs text-slate-400 font-normal"> / month</span>
              </span>

              {effectivePricing.isDiscountActive && effectivePricing.savingsZar > 0 && (
                <span className="bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px] font-black px-2 py-0.5 rounded-lg">
                  {effectivePricing.promotionalBadge || `${effectivePricing.discountPercentage}% PROMO APPLIED`}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              {seller.companyName} • {seller.city}, {seller.province} • Account Reference: <span className="font-mono text-emerald-400 font-bold">{seller.lastPaymentRef || `PS-${seller.id.toUpperCase()}`}</span>
            </p>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
            {onNavigateToPaymentConfig && (
              <button
                id="btn-overview-to-payment-config"
                type="button"
                onClick={onNavigateToPaymentConfig}
                className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
                title="Configure Primary Payment Method, EFT Banking & Card Details"
              >
                <CreditCard className="w-4 h-4" />
                <span>Payment Settings</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsEftModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Renew / Pay via EFT</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToPlans}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Upgrade Plan</span>
            </button>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. BILLING CYCLE PROGRESS BAR & REMAINING DAYS WIDGET */}
      {/* ======================================================== */}
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        
        {/* Progress Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${
                cycleMetrics.urgencyLevel === 'healthy'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : cycleMetrics.urgencyLevel === 'upcoming'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              <Calendar className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>Current Billing Cycle Schedule</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({cycleMetrics.totalCycleDays} Day Monthly Cycle)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Cycle Period: <strong className="text-slate-200">{cycleMetrics.startDate.toLocaleDateString('en-ZA')}</strong> to <strong className="text-slate-200">{cycleMetrics.dueDate.toLocaleDateString('en-ZA')}</strong>
              </p>
            </div>
          </div>

          {/* Highlight Badge: Days Remaining */}
          <div
            className={`px-4 py-2 rounded-2xl border text-right self-start sm:self-center ${
              cycleMetrics.urgencyLevel === 'healthy'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : cycleMetrics.urgencyLevel === 'upcoming'
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="text-lg font-black leading-tight">
              {cycleMetrics.daysRemaining > 0 ? (
                <span>{cycleMetrics.daysRemaining} Days Left</span>
              ) : (
                <span>Renewal Overdue</span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              {cycleMetrics.daysRemaining > 0 ? 'Until Next Renewal' : 'Please Submit EFT Proof'}
            </div>
          </div>
        </div>

        {/* The Visual Progress Bar */}
        <div className="space-y-3">
          
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Cycle Progress:</span>
              <strong className="text-white">{cycleMetrics.daysElapsed} of {cycleMetrics.totalCycleDays} Days Elapsed ({cycleMetrics.percentElapsed}%)</strong>
            </span>

            <span
              className={`font-mono text-xs font-bold ${
                cycleMetrics.urgencyLevel === 'healthy'
                  ? 'text-emerald-400'
                  : cycleMetrics.urgencyLevel === 'upcoming'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {cycleMetrics.percentRemaining}% Cycle Remaining
            </span>
          </div>

          {/* Progress Bar Track & Fill */}
          <div className="relative w-full h-5 bg-slate-900 rounded-full border border-slate-800 overflow-hidden shadow-inner p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 relative ${
                cycleMetrics.urgencyLevel === 'healthy'
                  ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 shadow-lg shadow-emerald-500/30'
                  : cycleMetrics.urgencyLevel === 'upcoming'
                  ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 shadow-lg shadow-amber-500/30'
                  : 'bg-gradient-to-r from-rose-600 via-rose-500 to-red-400 shadow-lg shadow-rose-500/30'
              }`}
              style={{ width: `${Math.max(4, Math.min(100, cycleMetrics.percentElapsed))}%` }}
            >
              {/* Animated glossy sheen */}
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse opacity-40" />
            </div>
          </div>

          {/* Timeline Milestones Markers */}
          <div className="grid grid-cols-4 gap-2 pt-1 text-[11px]">
            <div className="text-left">
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Cycle Start</span>
              <span className="font-semibold text-slate-300">{cycleMetrics.startDate.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}</span>
            </div>

            <div className="text-center">
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Mid-Cycle Check</span>
              <span className="font-semibold text-slate-400">Day 15</span>
            </div>

            <div className="text-center">
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Renewal Notice</span>
              <span className="font-semibold text-amber-400/80">7 Days Prior</span>
            </div>

            <div className="text-right">
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Renewal Due</span>
              <span className="font-bold text-amber-400">{cycleMetrics.dueDate.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>

        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-amber-400" /> Next Invoice Amount
            </span>
            <div className="text-base font-black text-white">
              {formatZar(effectivePricing.effectivePrice)}
            </div>
            <span className="text-[10px] text-slate-500 block">Due on {cycleMetrics.dueDate.toLocaleDateString('en-ZA')}</span>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
              <CalendarCheck className="w-3 h-3 text-emerald-400" /> Active Days in Cycle
            </span>
            <div className="text-base font-black text-emerald-400">
              {cycleMetrics.daysElapsed} Days
            </div>
            <span className="text-[10px] text-slate-500 block">{cycleMetrics.daysRemaining} days remaining</span>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-blue-400" /> Total Historical Spend
            </span>
            <div className="text-base font-black text-blue-400">
              {formatZar(totalPaidZar)}
            </div>
            <span className="text-[10px] text-slate-500 block">{payments.length} billing cycles recorded</span>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-400" /> Account Standing
            </span>
            <div className="text-base font-black text-amber-400 flex items-center gap-1">
              <span>Good Standing</span>
              <Check className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[10px] text-slate-500 block">100% On-time Trade Verified</span>
          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* 2. HISTORICAL SUBSCRIPTION PAYMENTS LIST */}
      {/* ======================================================== */}
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
        
        {/* Table Title & Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Historical Subscription Payments & Tax Invoices</h3>
              <p className="text-xs text-slate-400">Complete audit trail of all monthly EFT & card subscription settlements</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search invoice or ref..."
                className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 w-44"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({payments.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('verified')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === 'verified'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Verified
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pending
              </button>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="overflow-x-auto">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Receipt className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-xs text-slate-400 font-bold">No payment records found matching filter.</div>
              <p className="text-[11px] text-slate-500">Try adjusting your search criteria or submit a new payment proof.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase font-bold tracking-wider">
                  <th className="py-3 px-3">Date & Invoice</th>
                  <th className="py-3 px-3">Billing Period</th>
                  <th className="py-3 px-3">Plan / Description</th>
                  <th className="py-3 px-3">Amount (ZAR)</th>
                  <th className="py-3 px-3">Method & Reference</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Tax Invoice & Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPayments.map(payment => {
                  const pDate = new Date(payment.paymentDate);
                  const pStart = new Date(payment.billingCycleStart);
                  const pEnd = new Date(payment.billingCycleEnd);

                  return (
                    <tr key={payment.id} className="hover:bg-slate-900/50 transition-colors group">
                      
                      {/* Date & Invoice */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white">
                          {pDate.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="font-mono text-[10px] text-amber-400 font-bold">
                          {payment.invoiceNumber}
                        </div>
                      </td>

                      {/* Billing Period */}
                      <td className="py-3.5 px-3 text-slate-300">
                        <div className="font-medium">
                          {pStart.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })} - {pEnd.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-[10px] text-slate-500">30-day billing window</div>
                      </td>

                      {/* Plan / Description */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white">{payment.planName}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{payment.notes || 'Monthly Yard Ad'}</div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-3">
                        <div className="font-black text-white text-sm">
                          {formatZar(payment.amountZar)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Incl. 15% VAT ({formatZar(payment.vatZar)})
                        </div>
                      </td>

                      {/* Payment Method & Reference */}
                      <td className="py-3.5 px-3">
                        <div className="font-medium text-slate-300 flex items-center gap-1">
                          <span>{payment.paymentMethod}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            {payment.reference}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(payment.reference, payment.id)}
                            className="text-slate-500 hover:text-slate-200 transition-colors"
                            title="Copy Reference"
                          >
                            {copiedBankField === payment.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        {payment.status === 'verified' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Verified
                          </span>
                        ) : payment.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-bold">
                            <Clock className="w-3 h-3 text-amber-400" />
                            Pending Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-full text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            Failed
                          </span>
                        )}
                      </td>

                      {/* Tax Invoice & PDF Download Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Download PDF Receipt Button */}
                          <button
                            id={`btn-download-pdf-${payment.id}`}
                            type="button"
                            onClick={() => handleDownloadPdf(payment)}
                            disabled={downloadingPdfId === payment.id}
                            className={`px-2.5 py-1.5 border rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                              downloadSuccessId === payment.id
                                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                                : downloadingPdfId === payment.id
                                ? 'bg-slate-800 border-slate-700 text-slate-400 cursor-wait'
                                : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 hover:border-amber-500/60 text-amber-300 hover:text-amber-200'
                            }`}
                            title="Download official PDF Tax Invoice Receipt for your accounting records"
                          >
                            {downloadingPdfId === payment.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                            ) : downloadSuccessId === payment.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Download className="w-3.5 h-3.5 text-amber-400" />
                            )}
                            <span className="hidden sm:inline">
                              {downloadingPdfId === payment.id ? 'Saving...' : downloadSuccessId === payment.id ? 'Saved' : 'Download PDF'}
                            </span>
                            <span className="sm:hidden">PDF</span>
                          </button>

                          {/* View Invoice Modal Button */}
                          <button
                            id={`btn-view-invoice-${payment.id}`}
                            type="button"
                            onClick={() => setSelectedInvoice(payment)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-all inline-flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                            title="Preview official South African Tax Invoice on screen"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span className="hidden sm:inline">View</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* ======================================================== */}
      {/* 3. QUICK EFT SUBMIT MODAL */}
      {/* ======================================================== */}
      {isEftModalOpen && (
        <div className="fixed inset-0 z-70 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl text-white overflow-hidden animate-fadeIn">
            
            {/* Modal Header */}
            <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Submit EFT Payment Proof</h3>
                  <p className="text-[11px] text-slate-400">Monthly Subscription Fee: {formatZar(effectivePricing.effectivePrice)}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEftModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              
              {/* App Owner Banking Details Preview */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 space-y-2.5">
                <span className="text-[10px] uppercase font-black text-amber-400 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" /> App Owner Banking Details (EFT)
                </span>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Bank:</span>
                    <strong className="text-white">{ownerSettings.bankingDetails.bankName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Account Holder:</span>
                    <strong className="text-white">{ownerSettings.bankingDetails.accountHolder}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Account Number:</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="font-mono text-amber-400 text-sm">{ownerSettings.bankingDetails.accountNumber}</strong>
                      <button
                        type="button"
                        onClick={() => handleCopy(ownerSettings.bankingDetails.accountNumber, 'modal_acc')}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        {copiedBankField === 'modal_acc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Branch Code:</span>
                    <strong className="font-mono text-slate-300">{ownerSettings.bankingDetails.branchCode}</strong>
                  </div>
                </div>
              </div>

              {/* Form Input */}
              <form onSubmit={handleQuickEftSubmit} className="space-y-4 pt-1">
                <div className="space-y-1">
                  <label className="text-slate-200 font-bold block">
                    Your Bank EFT Reference ID / POP Number:
                  </label>
                  <input
                    type="text"
                    required
                    value={quickEftRef}
                    onChange={e => setQuickEftRef(e.target.value)}
                    placeholder={`e.g. PS-${seller.companyName.substring(0, 8).toUpperCase()}-SEP26 or FNB-984210`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    Enter the reference printed on your bank receipt or payment notification.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEftModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl cursor-pointer flex items-center gap-1.5 shadow-lg"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit Proof
                  </button>
                </div>
              </form>

            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. OFFICIAL SOUTH AFRICAN TAX INVOICE MODAL */}
      {/* ======================================================== */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-70 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto border border-slate-200">
            
            {/* Modal Actions Top Bar (hidden in print) */}
            <div className="bg-slate-900 px-6 py-3 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs">Official Tax Invoice • {selectedInvoice.invoiceNumber}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-modal-download-pdf"
                  type="button"
                  onClick={() => handleDownloadPdf(selectedInvoice)}
                  disabled={downloadingPdfId === selectedInvoice.id}
                  className={`px-3 py-1.5 font-black text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                    downloadSuccessId === selectedInvoice.id
                      ? 'bg-emerald-500 text-slate-950'
                      : downloadingPdfId === selectedInvoice.id
                      ? 'bg-slate-800 text-slate-400 cursor-wait'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                  title="Download official South African Tax Invoice as PDF"
                >
                  {downloadingPdfId === selectedInvoice.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : downloadSuccessId === selectedInvoice.id ? (
                    <Check className="w-3.5 h-3.5 text-slate-950 font-black" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {downloadingPdfId === selectedInvoice.id
                      ? 'Generating PDF...'
                      : downloadSuccessId === selectedInvoice.id
                      ? 'Downloaded PDF!'
                      : 'Download PDF Receipt'}
                  </span>
                </button>

                <button
                  id="btn-modal-print-invoice"
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-300" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Tax Invoice Content */}
            <div className="p-8 space-y-6 text-slate-800 font-sans" id="printable-tax-invoice">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    PART-SMART <span className="text-amber-500">ZA</span>
                  </div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                    Heavy Machinery & Spares Directory
                  </div>
                  <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                    <p>Part-Smart ZA (Pty) Ltd</p>
                    <p>Reg No: 2024/891230/07</p>
                    <p>VAT Reg No: 4980123984</p>
                    <p>accounts@partsmart.co.za • +27 11 892 4000</p>
                    <p>Johannesburg, Gauteng, South Africa</p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="inline-block bg-slate-900 text-white font-black text-xs px-3 py-1 rounded-md tracking-wider uppercase">
                    TAX INVOICE
                  </span>
                  <div className="text-sm font-bold text-slate-900 mt-2">
                    Invoice #: <span className="font-mono text-amber-600">{selectedInvoice.invoiceNumber}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Date: {new Date(selectedInvoice.paymentDate).toLocaleDateString('en-ZA')}
                  </div>
                  <div className="text-xs text-slate-600">
                    Payment Status:{' '}
                    <strong className={selectedInvoice.status === 'verified' ? 'text-emerald-600 font-black uppercase' : 'text-amber-600 font-black uppercase'}>
                      {selectedInvoice.status === 'verified' ? 'Paid & Settled' : 'Pending Verification'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Billed To Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="font-bold text-slate-500 uppercase text-[10px] tracking-wider mb-1">
                  Billed To (Registered Equipment Yard):
                </div>
                <div className="text-sm font-black text-slate-900">{seller.companyName}</div>
                <div className="text-slate-600 mt-1">
                  <p>Attention: {seller.contactName}</p>
                  <p>{seller.address}, {seller.city}, {seller.province}</p>
                  <p>Phone / WhatsApp: {seller.phone} • Email: {seller.email}</p>
                  <p>EFT Payment Reference: <strong className="font-mono text-slate-900">{selectedInvoice.reference}</strong></p>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-slate-700 text-[11px] uppercase font-bold">
                    <th className="py-2.5">Description & Service Period</th>
                    <th className="py-2.5 text-center">Qty</th>
                    <th className="py-2.5 text-right">Unit Price</th>
                    <th className="py-2.5 text-right">Total (ZAR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-3">
                      <div className="font-bold text-slate-900">{selectedInvoice.planName}</div>
                      <div className="text-slate-500 text-[11px]">
                        Period: {new Date(selectedInvoice.billingCycleStart).toLocaleDateString('en-ZA')} to {new Date(selectedInvoice.billingCycleEnd).toLocaleDateString('en-ZA')}
                      </div>
                      <div className="text-slate-500 text-[10px] mt-0.5">
                        Highveld & Nationwide heavy equipment search directory advertising with direct WhatsApp inquiry routing.
                      </div>
                    </td>
                    <td className="py-3 text-center font-medium">1</td>
                    <td className="py-3 text-right font-medium">{formatZar(selectedInvoice.amountZar - selectedInvoice.vatZar)}</td>
                    <td className="py-3 text-right font-black text-slate-900">{formatZar(selectedInvoice.amountZar - selectedInvoice.vatZar)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200">
                    <td colSpan={3} className="py-2 text-right text-slate-600 font-bold">Subtotal (Excl. VAT):</td>
                    <td className="py-2 text-right font-bold text-slate-900">{formatZar(selectedInvoice.amountZar - selectedInvoice.vatZar)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-1 text-right text-slate-600 font-bold">15% South African VAT:</td>
                    <td className="py-1 text-right font-bold text-slate-900">{formatZar(selectedInvoice.vatZar)}</td>
                  </tr>
                  <tr className="border-t-2 border-slate-900 text-sm">
                    <td colSpan={3} className="py-2.5 text-right font-black text-slate-900">Total Due / Paid (Incl. VAT):</td>
                    <td className="py-2.5 text-right font-black text-amber-600 text-base">{formatZar(selectedInvoice.amountZar)}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Settlement & Banking Notes */}
              <div className="border-t border-slate-200 pt-4 text-[11px] text-slate-500 space-y-1">
                <p><strong>Payment Method:</strong> {selectedInvoice.paymentMethod} (Bank Reference: {selectedInvoice.reference})</p>
                <p><strong>Beneficiary Account:</strong> {ownerSettings.bankingDetails.accountHolder} • {ownerSettings.bankingDetails.bankName} Account #{ownerSettings.bankingDetails.accountNumber} (Branch {ownerSettings.bankingDetails.branchCode})</p>
                <p className="text-[10px] text-slate-400 pt-1">
                  Thank you for advertising with Part-Smart ZA. This is an electronic tax invoice compliant with the South African Value Added Tax Act.
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

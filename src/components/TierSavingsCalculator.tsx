import React, { useState, useMemo } from 'react';
import {
  Calculator,
  ShieldCheck,
  Crown,
  TrendingUp,
  Sparkles,
  Check,
  ArrowRight,
  Zap,
  DollarSign,
  QrCode,
  BarChart3,
  Layers,
  AlertCircle,
  HelpCircle,
  Percent
} from 'lucide-react';
import { SubscriptionPlan, SubscriptionPlanId, Seller } from '../types';

interface TierSavingsCalculatorProps {
  subscriptionPlans: SubscriptionPlan[];
  activePlanId: SubscriptionPlanId;
  onSelectPlan: (planId: SubscriptionPlanId) => void;
  getPlanEffectivePricing: (planId: SubscriptionPlanId) => {
    price: number;
    effectivePrice: number;
    originalPrice: number;
    isDiscountActive: boolean;
    discountPercentage: number;
    promotionalBadge?: string;
    promoNotice?: string;
    maxListings: number;
    name?: string;
  };
  currentSeller?: Seller | null;
  className?: string;
}

export const TierSavingsCalculator: React.FC<TierSavingsCalculatorProps> = ({
  subscriptionPlans,
  activePlanId,
  onSelectPlan,
  getPlanEffectivePricing,
  currentSeller,
  className = ''
}) => {
  // Visual tier toggle: 'basic' vs 'premium'
  const [selectedTierGroup, setSelectedTierGroup] = useState<'basic' | 'premium'>('premium');
  
  // Under premium: toggle between 'pro' (50 listings) and 'enterprise' (unlimited)
  const [premiumOption, setPremiumOption] = useState<'pro' | 'enterprise'>('pro');

  // Interactive inputs for scrap yard metrics
  const [monthlySalesZar, setMonthlySalesZar] = useState<number>(120000);
  const [activeInventoryCount, setActiveInventoryCount] = useState<number>(35);
  const [customBrokerFeePct, setCustomBrokerFeePct] = useState<number>(6); // Traditional classified/broker fee comparison

  // Determine current active plan ID based on toggle
  const currentCalculatedPlanId: SubscriptionPlanId = useMemo(() => {
    if (selectedTierGroup === 'basic') return 'basic';
    return premiumOption;
  }, [selectedTierGroup, premiumOption]);

  // Pricing details from context
  const basicPricing = getPlanEffectivePricing('basic');
  const proPricing = getPlanEffectivePricing('pro');
  const enterprisePricing = getPlanEffectivePricing('enterprise');
  
  const currentPricing = getPlanEffectivePricing(currentCalculatedPlanId);

  // Calculations for feature access savings & monthly value
  const calculations = useMemo(() => {
    const isBasic = selectedTierGroup === 'basic';
    const isEnterprise = selectedTierGroup === 'premium' && premiumOption === 'enterprise';

    // 1. Commission Savings: Traditional brokers / platforms charge 5-8% on part inquiries/sales
    // On PartsMart SA, sellers pay R0 commission on direct buyer calls and WhatsApps
    const brokerCommissionSaved = Math.round(monthlySalesZar * (customBrokerFeePct / 100));

    // 2. Online Advertising / Directory exposure value
    // Basic gives standard directory placement (~R650/mo in Google / Social Ad equivalent)
    // Premium gives Featured Yard badge + Priority Province ranking (~R2,800/mo for Pro, ~R5,500/mo for Enterprise)
    const adExposureValue = isBasic
      ? 650
      : isEnterprise
      ? 5500
      : 2800;

    // 3. Spares QR Label & Thermal Print software value
    // Basic: single listing QR code generator (~R350/mo)
    // Premium: unlimited batch thermal stickers + custom yard logo branding (~R950/mo for Pro, ~R1,800/mo for Enterprise)
    const qrSoftwareValue = isBasic
      ? 350
      : isEnterprise
      ? 1800
      : 950;

    // 4. Inquiries Telemetry & Buyer Analytics value
    // Basic: basic view count (~R150/mo)
    // Premium: detailed buyer inquiry analytics + out-of-office WhatsApp responder (~R850/mo for Pro, ~R1,500/mo for Enterprise)
    const analyticsValue = isBasic
      ? 150
      : isEnterprise
      ? 1500
      : 850;

    // 5. Verified Trust Badge & Instant Buyer Conversion Lift
    // Buyers trust verified yards significantly more, leading to higher conversion on inquiries
    const trustLiftValue = isBasic
      ? 400
      : isEnterprise
      ? Math.round(monthlySalesZar * 0.045) // ~4.5% extra sales closure from Master Dealer badge
      : Math.round(monthlySalesZar * 0.03); // ~3% extra sales closure from Pro Verified badge

    // Total gross monthly feature value
    const grossMonthlyValue = brokerCommissionSaved + adExposureValue + qrSoftwareValue + analyticsValue + trustLiftValue;

    // Subscription cost
    const subscriptionCost = currentPricing.effectivePrice;

    // Net monthly savings / profit boost
    const netMonthlySavings = Math.max(0, grossMonthlyValue - subscriptionCost);

    // ROI Multiplier
    const roiMultiplier = subscriptionCost > 0 ? (grossMonthlyValue / subscriptionCost).toFixed(1) : '10.0';

    return {
      brokerCommissionSaved,
      adExposureValue,
      qrSoftwareValue,
      analyticsValue,
      trustLiftValue,
      grossMonthlyValue,
      subscriptionCost,
      netMonthlySavings,
      roiMultiplier
    };
  }, [selectedTierGroup, premiumOption, monthlySalesZar, customBrokerFeePct, currentPricing]);

  // Presets for quick yard size testing
  const applyPreset = (tier: 'small' | 'medium' | 'large') => {
    if (tier === 'small') {
      setSelectedTierGroup('basic');
      setMonthlySalesZar(40000);
      setActiveInventoryCount(8);
    } else if (tier === 'medium') {
      setSelectedTierGroup('premium');
      setPremiumOption('pro');
      setMonthlySalesZar(140000);
      setActiveInventoryCount(35);
    } else {
      setSelectedTierGroup('premium');
      setPremiumOption('enterprise');
      setMonthlySalesZar(350000);
      setActiveInventoryCount(120);
    }
  };

  const isCurrentPlanActive = (activePlanId === currentCalculatedPlanId) ||
    (activePlanId === 'starter' && currentCalculatedPlanId === 'basic') ||
    (activePlanId === 'dealer_unlimited' && currentCalculatedPlanId === 'enterprise');

  return (
    <div id="tier-savings-calculator" className={`bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl relative overflow-hidden ${className}`}>
      {/* Decorative ambient background */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Section */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Calculator className="w-3.5 h-3.5" /> Interactive ROI & Feature Access Calculator
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Subscription Tier Savings Calculator
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Toggle between <span className="text-amber-400 font-semibold">Basic</span> and <span className="text-emerald-400 font-semibold">Premium</span> tiers to simulate your estimated monthly savings and return on investment based on direct buyer lead access and inventory management tools.
          </p>
        </div>

        {/* Quick Yard Size Presets */}
        <div className="flex items-center gap-1.5 self-start md:self-auto bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shrink-0">
          <span className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider">Presets:</span>
          <button
            id="preset-small-yard"
            type="button"
            onClick={() => applyPreset('small')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTierGroup === 'basic'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Small Yard
          </button>
          <button
            id="preset-medium-yard"
            type="button"
            onClick={() => applyPreset('medium')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTierGroup === 'premium' && premiumOption === 'pro'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Pro Yard
          </button>
          <button
            id="preset-large-yard"
            type="button"
            onClick={() => applyPreset('large')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTierGroup === 'premium' && premiumOption === 'enterprise'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Enterprise Dealer
          </button>
        </div>
      </div>

      {/* PRIMARY VISUAL TOGGLE: Basic vs Premium */}
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Step 1: Select Subscription Tier Model
          </span>
          <span className="text-xs text-slate-500">
            Click to toggle instant comparison
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800">
          {/* BASIC TIER BUTTON */}
          <button
            id="toggle-tier-basic"
            type="button"
            onClick={() => setSelectedTierGroup('basic')}
            className={`flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer text-left ${
              selectedTierGroup === 'basic'
                ? 'bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/10 border-2 border-amber-500 text-white shadow-lg'
                : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black ${
                selectedTierGroup === 'basic'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white">Basic Tier</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                    Essential (10 Listings)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Local auto breakers & spares shops
                </p>
              </div>
            </div>
            <div className="text-right pl-2">
              <div className="text-base font-black text-amber-400">
                R{basicPricing.effectivePrice}<span className="text-xs font-normal text-slate-400">/mo</span>
              </div>
              {basicPricing.isDiscountActive && basicPricing.effectivePrice < basicPricing.originalPrice && (
                <div className="text-[10px] text-orange-400 line-through">
                  R{basicPricing.originalPrice}
                </div>
              )}
            </div>
          </button>

          {/* PREMIUM TIER BUTTON */}
          <button
            id="toggle-tier-premium"
            type="button"
            onClick={() => setSelectedTierGroup('premium')}
            className={`flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer text-left ${
              selectedTierGroup === 'premium'
                ? 'bg-gradient-to-r from-emerald-500/20 via-slate-900 to-amber-500/15 border-2 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500/50'
                : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black ${
                selectedTierGroup === 'premium'
                  ? 'bg-gradient-to-br from-emerald-400 to-amber-400 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white">Premium Tier</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    Pro & Enterprise (50+ / Unlimited)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  High-volume truck breakers & equipment dealers
                </p>
              </div>
            </div>
            <div className="text-right pl-2">
              <div className="text-base font-black text-emerald-400">
                From R{proPricing.effectivePrice}<span className="text-xs font-normal text-slate-400">/mo</span>
              </div>
              <div className="text-[10px] text-emerald-300 font-bold">
                Max ROI Tier
              </div>
            </div>
          </button>
        </div>

        {/* SUB-SELECTOR WHEN PREMIUM IS SELECTED */}
        {selectedTierGroup === 'premium' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Choose Premium Grade:
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                id="sub-toggle-pro"
                type="button"
                onClick={() => setPremiumOption('pro')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  premiumOption === 'pro'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>Pro Tier (50 Listings)</span>
                <span className="text-[10px] opacity-85">R{proPricing.effectivePrice}/mo</span>
              </button>
              <button
                id="sub-toggle-enterprise"
                type="button"
                onClick={() => setPremiumOption('enterprise')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  premiumOption === 'enterprise'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>Enterprise Dealer (Unlimited)</span>
                <span className="text-[10px] opacity-85">R{enterprisePricing.effectivePrice}/mo</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: METRICS & PARAMETERS SLIDERS */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/50 p-5 rounded-2xl border border-slate-800/80">
        {/* Monthly Spares Sales Input / Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Estimated Monthly Spares Sales
            </label>
            <span className="text-sm font-black text-amber-400 font-mono">
              R{monthlySalesZar.toLocaleString()}
            </span>
          </div>
          <input
            id="input-monthly-sales-slider"
            type="range"
            min="10000"
            max="600000"
            step="5000"
            value={monthlySalesZar}
            onChange={(e) => setMonthlySalesZar(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>R10,000</span>
            <span>R300,000</span>
            <span>R600,000+</span>
          </div>
        </div>

        {/* Traditional Broker Fee Comparison Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-emerald-400" /> Typical Broker / Auction Commission
            </label>
            <span className="text-sm font-black text-emerald-400 font-mono">
              {customBrokerFeePct}% <span className="text-[11px] text-slate-400 font-normal">(You pay 0%)</span>
            </span>
          </div>
          <input
            id="input-broker-fee-slider"
            type="range"
            min="3"
            max="12"
            step="1"
            value={customBrokerFeePct}
            onChange={(e) => setCustomBrokerFeePct(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>3% (Low)</span>
            <span>6% (Standard SA Broker)</span>
            <span>12% (Auction Houses)</span>
          </div>
        </div>
      </div>

      {/* STEP 3: ESTIMATED SAVINGS & VALUE BREAKDOWN */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Detailed Feature Value Breakdown */}
        <div className="lg:col-span-7 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" /> Monthly Feature Access & Value Breakdown
          </h4>

          <div className="space-y-2.5">
            {/* Item 1: 0% Commission on Direct Lead Routing */}
            <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Direct Lead Routing (0% Commission)</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.2 rounded">
                      Zero Fees
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Buyers call & WhatsApp your yard directly. You keep 100% of spare part sale proceeds.
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-black text-emerald-400 font-mono">
                  +R{calculations.brokerCommissionSaved.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">saved/mo</div>
              </div>
            </div>

            {/* Item 2: Search Directory & Priority Placement */}
            <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>
                      {selectedTierGroup === 'basic'
                        ? 'Standard Directory Search Placement'
                        : premiumOption === 'enterprise'
                        ? 'Top Homepage Banner & Nationwide Heavy Network'
                        : 'Featured Yard Badge & Priority City Search'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {selectedTierGroup === 'basic'
                      ? 'Local auto scrap yard visibility on category search.'
                      : 'Featured highlight ranking above free/basic listings in search results.'}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-black text-amber-400 font-mono">
                  +R{calculations.adExposureValue.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">ad value/mo</div>
              </div>
            </div>

            {/* Item 3: QR Code Shelf & Bin Label Engine */}
            <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>
                      {selectedTierGroup === 'basic'
                        ? 'Single Listing QR Codes'
                        : 'Batch Shelf & Thermal 58mm/80mm Stickers'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Instant walk-in QR scanning and inventory tagging software value.
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-black text-cyan-400 font-mono">
                  +R{calculations.qrSoftwareValue.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">tools value</div>
              </div>
            </div>

            {/* Item 4: Verified Trust Badge Conversion Boost */}
            <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>
                      {selectedTierGroup === 'basic'
                        ? 'Standard Yard Listing Profile'
                        : premiumOption === 'enterprise'
                        ? 'Master Verified Dealer Gold Shield'
                        : 'Pro Verified Seller Trust Badge'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Builds buyer confidence to prevent scam fears and increase deals closed.
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-black text-purple-400 font-mono">
                  +R{calculations.trustLiftValue.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">closure boost</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Net ROI Summary Card */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-3xl border border-slate-800 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Estimated Net ROI Analysis
              </span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 font-extrabold px-2.5 py-1 rounded-full border border-emerald-500/30">
                {calculations.roiMultiplier}x Estimated ROI
              </span>
            </div>

            {/* Total Feature Value Metric */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Gross Monthly Value Delivered:</span>
                <span className="font-bold text-white font-mono">
                  R{calculations.grossMonthlyValue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Selected Plan Subscription Cost:</span>
                <span className="font-bold text-amber-400 font-mono">
                  - R{calculations.subscriptionCost.toLocaleString()}/mo
                </span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
                <span className="text-xs font-black uppercase text-slate-300">
                  Estimated Net Monthly Benefit:
                </span>
                <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
                  + R{calculations.netMonthlySavings.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Active Tier Highlights Card */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="font-bold text-white flex items-center justify-between">
                <span>Configured Plan: {currentPricing.name || currentCalculatedPlanId.toUpperCase()}</span>
                <span className="text-amber-400 font-black">
                  R{currentPricing.effectivePrice}/mo
                </span>
              </div>
              <ul className="space-y-1.5 text-slate-400 text-[11px] pt-1">
                <li className="flex items-center gap-1.5 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    <strong>{currentPricing.maxListings >= 9999 ? 'Unlimited' : currentPricing.maxListings}</strong> Active Inventory Listings
                  </span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Direct WhatsApp & Call Leads (0% Commission)</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    {selectedTierGroup === 'basic' ? 'Standard Search Rank' : 'Priority Top Search Placement'}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Action Button: Apply / Select This Tier */}
          <div className="space-y-2 pt-2">
            <button
              id="btn-apply-calculated-plan"
              type="button"
              onClick={() => onSelectPlan(currentCalculatedPlanId)}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                isCurrentPlanActive
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
              }`}
            >
              {isCurrentPlanActive ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Current Active Plan ({currentCalculatedPlanId.toUpperCase()})</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>
                    {currentSeller ? 'Select & Switch to ' : 'Choose '}
                    {currentCalculatedPlanId === 'basic' ? 'Basic' : currentCalculatedPlanId === 'pro' ? 'Pro' : 'Enterprise'} Plan (R{currentPricing.effectivePrice}/mo)
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-slate-500">
              Payments via direct South African EFT • Verified immediately by App Owner
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import { Seller, SellerTrustInfo, SubscriptionPlanId, SubscriptionStatus } from '../types';

/**
 * Computes comprehensive visual trust badge information and verification metrics for any seller
 * based on their active subscription plan tier and verification status.
 */
export function getSellerTrustInfo(
  seller?: Seller | null,
  fallbackStatus?: {
    sellerName?: string;
    subscriptionStatus?: SubscriptionStatus;
    planId?: SubscriptionPlanId;
  }
): SellerTrustInfo {
  const status: SubscriptionStatus = seller?.subscriptionStatus || fallbackStatus?.subscriptionStatus || 'unpaid';
  const planId: SubscriptionPlanId = seller?.planId || fallbackStatus?.planId || 'basic';
  const isCipc = seller?.isCipcVerified ?? true;
  const isPhysical = seller?.isPhysicalYardVerified ?? true;

  // 1. Enterprise Dealer / Unlimited Tier
  if (status === 'active' && (planId === 'enterprise' || planId === 'dealer_unlimited')) {
    return {
      tier: 'enterprise',
      badgeLabel: 'Enterprise Dealer',
      shortBadgeLabel: 'Enterprise',
      badgeTitle: 'Verified Enterprise Dealer',
      iconName: 'crown',
      themeColor: {
        bg: 'bg-amber-950/40',
        border: 'border-amber-400/50 hover:border-amber-300',
        text: 'text-amber-300',
        badgeGradient: 'from-amber-500/25 via-yellow-500/20 to-amber-500/25',
        pillBg: 'bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-yellow-500/20 text-amber-200 border-amber-400/60 shadow-amber-950/40',
        iconColor: 'text-amber-400',
        glow: 'shadow-amber-500/10'
      },
      tierRank: 4,
      isVerified: true,
      tagline: 'Top-Tier Commercial Yard & Fleet Dismantler',
      description: 'Highest trust tier on Part-Smart ZA. High-capacity commercial yard with bulk inventory, vetted premises, and dedicated sales staff.',
      trustPerks: [
        'Verified Premier Enterprise Dealer',
        isCipc ? 'CIPC Registered Auto / Machinery Business' : 'Commercial Scrap Yard Operator',
        isPhysical ? 'Audited Physical Yard & Workshop Premises' : 'Verified Direct Yard Stock',
        'Direct WhatsApp & Instant Phone Counter Access',
        'Bulk Spares & Commercial Fleet Dismantling Specialist'
      ],
      responseTime: '< 15 mins average WhatsApp reply',
      guaranteeNotice: '100% direct yard stock with zero broker markups. Buy direct from verified enterprise dealers.'
    };
  }

  // 2. Pro Verified Yard Tier
  if (status === 'active' && planId === 'pro') {
    return {
      tier: 'pro',
      badgeLabel: 'Pro Verified Yard',
      shortBadgeLabel: 'Pro Yard',
      badgeTitle: 'Pro Verified Scrapyard',
      iconName: 'shield-check',
      themeColor: {
        bg: 'bg-blue-950/40',
        border: 'border-blue-400/50 hover:border-blue-300',
        text: 'text-blue-300',
        badgeGradient: 'from-blue-500/25 via-indigo-500/20 to-blue-500/25',
        pillBg: 'bg-gradient-to-r from-blue-500/20 via-indigo-500/15 to-blue-500/20 text-blue-200 border-blue-400/60 shadow-blue-950/40',
        iconColor: 'text-blue-400',
        glow: 'shadow-blue-500/10'
      },
      tierRank: 3,
      isVerified: true,
      tagline: 'Commercial Spares & Machinery Specialist',
      description: 'Active Pro-tier member with high-priority search visibility, vetted contact channels, and authenticated scrap inventory.',
      trustPerks: [
        'Pro-Tier Verified Scrap Yard Partner',
        'Direct Breaker Yard with Priority Inquiry Routing',
        'Specialised Commercial Truck, Plant or Auto Spares',
        'Verified Contact & Physical Yard Location'
      ],
      responseTime: '< 30 mins average WhatsApp reply',
      guaranteeNotice: 'Direct communication with yard sales reps for VIN checks and condition confirmations.'
    };
  }

  // 3. Basic / Starter Plan (Active Status)
  if (status === 'active') {
    return {
      tier: 'verified',
      badgeLabel: 'Verified Yard',
      shortBadgeLabel: 'Verified',
      badgeTitle: 'Verified Active Scrap Yard',
      iconName: 'check',
      themeColor: {
        bg: 'bg-emerald-950/40',
        border: 'border-emerald-500/40 hover:border-emerald-400',
        text: 'text-emerald-300',
        badgeGradient: 'from-emerald-500/20 via-teal-500/15 to-emerald-500/20',
        pillBg: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40 shadow-emerald-950/30',
        iconColor: 'text-emerald-400',
        glow: 'shadow-emerald-500/10'
      },
      tierRank: 2,
      isVerified: true,
      tagline: 'Registered Scrapyard Partner',
      description: 'Active registered scrap yard on Part-Smart ZA with confirmed contact phone and direct WhatsApp counter routing.',
      trustPerks: [
        'Active Subscribed Scrap Yard',
        'Direct Phone & WhatsApp Inquiry Channel',
        'Local Provincial Scrap Dealer'
      ],
      responseTime: 'Standard trading hours reply',
      guaranteeNotice: 'Direct yard pricing with zero buyer commissions.'
    };
  }

  // 4. Pending Verification Status
  if (status === 'pending_verification') {
    return {
      tier: 'pending',
      badgeLabel: 'Verification Pending',
      shortBadgeLabel: 'Pending',
      badgeTitle: 'Yard Verification In Progress',
      iconName: 'clock',
      themeColor: {
        bg: 'bg-amber-950/30',
        border: 'border-amber-500/40 hover:border-amber-400',
        text: 'text-amber-300',
        badgeGradient: 'from-amber-500/15 via-orange-500/10 to-amber-500/15',
        pillBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-amber-950/20',
        iconColor: 'text-amber-400',
        glow: 'shadow-amber-500/5'
      },
      tierRank: 1,
      isVerified: false,
      tagline: 'Payment & Documentation Under Review',
      description: 'Seller has submitted proof of payment or registration documentation; admin approval is currently in progress.',
      trustPerks: [
        'Registration documents submitted',
        'Bank EFT proof currently in review',
        'Direct contact available on enquiry'
      ],
      responseTime: 'Pending approval',
      guaranteeNotice: 'Please verify part specifications directly with the seller before final payment.'
    };
  }

  // 5. Unpaid / Expired / Default
  return {
    tier: 'unverified',
    badgeLabel: 'Unverified Yard',
    shortBadgeLabel: 'Unverified',
    badgeTitle: 'Unverified Seller Account',
    iconName: 'alert-triangle',
    themeColor: {
      bg: 'bg-slate-900/60',
      border: 'border-slate-700/60 hover:border-slate-600',
      text: 'text-slate-400',
      badgeGradient: 'from-slate-800 via-slate-800 to-slate-800',
      pillBg: 'bg-slate-800/70 text-slate-400 border-slate-700/60 shadow-slate-950/20',
      iconColor: 'text-slate-400',
      glow: 'shadow-none'
    },
    tierRank: 0,
    isVerified: false,
    tagline: 'Standard Unverified Directory Listing',
    description: 'This seller has not yet activated a verified subscription tier on the Part-Smart ZA network.',
    trustPerks: [
      'Basic directory listing',
      'Direct phone/WhatsApp may be available'
    ],
    responseTime: 'Unverified',
    guaranteeNotice: 'Exercise standard buyer diligence when requesting courier or EFT transactions.'
  };
}

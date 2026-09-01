export type CategoryType = 'cars' | 'minibus_taxis' | 'trucks' | 'heavy_equipment';

export type PartCondition = 'new' | 'reconditioned' | 'used' | 'stripping_spares';

export type SAProvince = 
  | 'Gauteng'
  | 'Western Cape'
  | 'KwaZulu-Natal'
  | 'Mpumalanga'
  | 'Free State'
  | 'Eastern Cape'
  | 'Limpopo'
  | 'North West'
  | 'Northern Cape';

export type SubscriptionPlanId = 'starter' | 'basic' | 'pro' | 'dealer_unlimited' | 'enterprise';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  priceZar: number;
  maxListings: number;
  description: string;
  features: string[];
  discountPercentage?: number; // e.g. 50 for 50% discount
  promoPriceZar?: number; // Custom discounted price override if set
  isDiscountActive?: boolean; // Whether promo pricing is currently active
  promotionalBadge?: string; // e.g. "🔥 50% LAUNCH DEAL", "SPRING SPECIAL"
  promoNotice?: string; // e.g. "Special promotional rate for new yards!"
}

export interface SubscriptionPromoCampaign {
  enabled: boolean;
  campaignTitle: string;
  headline: string;
  badgeText: string;
  announcementText: string;
  expiresAt?: string;
  discountPercentage?: number;
}

export type SubscriptionStatus = 'active' | 'unpaid' | 'pending_verification' | 'expired';

export interface SubscriptionPaymentRecord {
  id: string;
  sellerId: string;
  sellerName: string;
  invoiceNumber: string;
  paymentDate: string; // ISO String
  billingCycleStart: string;
  billingCycleEnd: string;
  planId: SubscriptionPlanId;
  planName: string;
  amountZar: number;
  vatZar: number; // 15% South African VAT
  paymentMethod: 'EFT' | 'Instant EFT' | 'Card' | 'Debit Order';
  reference: string;
  status: 'verified' | 'pending' | 'failed';
  notes?: string;
  emailDispatchedAt?: string;
  emailRecipient?: string;
  taxInvoiceAttached?: boolean;
  vatRatePercent?: number;
  supplierVatNumber?: string;
  buyerVatNumber?: string;
}

export type SellerTrustTier = 'enterprise' | 'pro' | 'verified' | 'pending' | 'unverified';

export interface SellerTrustInfo {
  tier: SellerTrustTier;
  badgeLabel: string;
  shortBadgeLabel: string;
  badgeTitle: string;
  iconName: 'crown' | 'shield-check' | 'award' | 'check' | 'clock' | 'alert-triangle';
  themeColor: {
    bg: string;
    border: string;
    text: string;
    badgeGradient: string;
    pillBg: string;
    iconColor: string;
    glow: string;
  };
  tierRank: number; // 4: Enterprise, 3: Pro, 2: Basic Active, 1: Pending, 0: Unpaid/Expired
  isVerified: boolean;
  tagline: string;
  description: string;
  trustPerks: string[];
  responseTime?: string;
  guaranteeNotice: string;
}

export interface Seller {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  whatsapp: string;
  email: string;
  logoUrl?: string; // Profile logo for yard branding and printable shelf labels
  province: SAProvince;
  city: string;
  address: string;
  planId: SubscriptionPlanId;
  subscriptionStatus: SubscriptionStatus;
  subscriptionDueDate: string; // ISO Date String
  lastPaymentRef?: string;
  paymentProofSubmittedAt?: string;
  isCipcVerified?: boolean; // South African CIPC registration verified
  isPhysicalYardVerified?: boolean; // Physical premises audited
  yearsInBusiness?: number; // e.g. 10+ years
  outOfOfficeEnabled?: boolean;
  outOfOfficeMessage?: string;
  outOfOfficeReturnDate?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerWhatsapp: string;
  title: string;
  category: CategoryType;
  subcategory: string; // e.g., 'Engine', 'Hydraulic Pump', 'Gearbox', 'Excavator Bucket', 'Bakkie Spares'
  make: string; // e.g., 'CAT', 'Komatsu', 'Toyota', 'Scania', 'JCB', 'Cummins', 'Volvo'
  model: string; // e.g., '320D', 'Hilux GD-6', 'R560', 'JS200'
  year?: number;
  partNumber?: string;
  condition: PartCondition;
  priceZar: number;
  province: SAProvince;
  city: string;
  description: string;
  specifications: Record<string, string>;
  images: string[];
  isFeatured?: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerBankingDetails {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
  swiftCode?: string;
  paymentReferenceFormat: string;
  additionalInstructions: string;
  updatedAt: string;
}

export interface OwnerTaxInvoiceSettings {
  enabled: boolean; // Master toggle for automated Tax/VAT Invoicing
  autoAttachToEmail?: boolean; // Automatically attach tax-compliant invoice to payment confirmation email
  autoAttachToConfirmationEmail?: boolean; // Alias
  autoSendOnApproval?: boolean; // Automatically dispatch email when owner clicks "Approve & Activate"
  autoDispatchOnApproval?: boolean; // Alias
  companyLegalName?: string; // Registered Business Name, e.g. "Part-Smart ZA (Pty) Ltd"
  legalEntityName?: string; // Alias
  tradingName?: string; // Trading Name, e.g. "Part-Smart ZA Equipment & Auto Breakers Network"
  vatRegistrationNumber: string; // SARS VAT Registration Number (10 digits)
  cipcRegistrationNumber?: string; // CIPC Company Registration Number
  companyTaxNumber?: string; // SARS Income Tax Number
  registeredAddress?: string; // Registered Business Address
  billingEmail?: string; // Billing / Accounts Contact Email
  billingContactEmail?: string; // Alias
  billingPhone?: string; // Billing Contact Telephone
  billingContactPhone?: string; // Alias
  vatRatePercent: number; // South African standard VAT rate (15%)
  invoiceNumberPrefix: string; // e.g. "INV-PSZA-"
  nextInvoiceSequence: number; // e.g. 1042
  taxComplianceNotice?: string; // SARS Section 20(4) VAT compliance statement
  complianceNoticeText?: string; // Alias
  emailSubjectTemplate: string; // e.g. "Payment Confirmed: Tax Invoice {invoiceNumber} - Part-Smart ZA"
  emailBodyTemplate?: string; // Full body template
  emailBodyCustomNote?: string; // Custom message included in payment confirmation email
  updatedAt?: string;
}

export interface OwnerSettings {
  passwordHash: string; // Default password 'admin123' or customizable
  bankingDetails: OwnerBankingDetails;
  ownerEmail: string;
  ownerPhone: string;
  taxInvoiceSettings?: OwnerTaxInvoiceSettings;
  subscriptionPlans?: SubscriptionPlan[];
  promotionalCampaign?: SubscriptionPromoCampaign;
  whatsappAutoReply?: {
    enabledByDefault?: boolean;
    defaultOutOfOfficeTemplate?: string;
    platformEmergencyPhone?: string;
  };
}

export interface SellerSpecial {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerWhatsapp: string;
  sellerCity: string;
  sellerProvince: SAProvince;
  title: string;
  category: CategoryType;
  subcategory: string;
  badge: string; // e.g. "45% OFF", "Clearance Deal", "Free Delivery in GP", "Bundle Combo"
  originalPriceZar: number;
  specialPriceZar: number;
  description: string;
  terms?: string;
  expiresAt: string; // ISO string
  imageUrl: string;
  isFeatured?: boolean;
  views?: number;
  createdAt: string;
}

export interface CompetitionPrize {
  rank: string; // e.g. "1st Place", "2nd Place", "3rd Place"
  reward: string; // e.g. "R15,000 Cash + 6 Months Free Unlimited Dealer Plan"
  badge: string; // e.g. "Gold Trophy Yard"
}

export interface CompetitionLeaderboardItem {
  sellerId: string;
  sellerName: string;
  city: string;
  province: SAProvince;
  metricLabel: string;
  metricValue: string | number;
  rank: number;
  badgeTitle: string;
  highlightNote?: string;
}

export interface SellerCompetition {
  id: string;
  title: string;
  tagline: string;
  description: string;
  categoryType: 'all' | CategoryType | 'yard_excellence';
  prizePool: string;
  prizes: CompetitionPrize[];
  startDate: string;
  endDate: string;
  status: 'active' | 'judging' | 'completed';
  bannerImage: string;
  rules: string[];
  criteria: string[];
  participantsCount: number;
  leaderboard: CompetitionLeaderboardItem[];
  createdAt: string;
}

export interface CompetitionEntry {
  id: string;
  competitionId: string;
  sellerId: string;
  sellerName: string;
  sellerWhatsapp: string;
  sellerCity: string;
  entryTitle: string;
  entryDescription: string;
  imageUrl?: string;
  proofMetrics?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'winner';
}

export interface CustomerContact {
  id: string;
  name: string;
  phone: string;
  company?: string;
  interestTag?: string; // e.g. 'Heavy Machinery', 'Trucks', 'Toyota Spares', 'Hydraulics', 'General'
  notes?: string;
  lastContactedAt?: string;
  createdAt: string;
}

export interface BroadcastHistoryItem {
  id: string;
  sellerId: string;
  createdAt: string;
  title: string;
  recipientCount: number;
  itemIds: string[];
  templateUsed: string;
  messageSnippet: string;
}

export interface FilterState {
  searchQuery: string;
  category: CategoryType | 'all';
  subcategory: string;
  condition: PartCondition | 'all';
  province: SAProvince | 'all';
  minPrice?: number;
  maxPrice?: number;
  make: string;
  sortBy: 'newest' | 'price_low' | 'price_high' | 'views';
  onlyFavorites?: boolean;
}
